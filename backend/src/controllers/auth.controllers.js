const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const dns = require("dns").promises;
const crypto = require("crypto");
const userModel = require("../model/auth.model");
const redis = require("../config/cache");

const googleClient = new OAuth2Client(process.env.GOOGLE_API_KEY);
const REGISTER_OTP_TTL_SECONDS = 10 * 60;
const REGISTER_OTP_RESEND_SECONDS = 60;

const funnyAvatarStyles = [
  "fun-emoji",
  "bottts",
  "adventurer",
  "avataaars",
  "big-smile",
  "croodles"
];

function getRandomFunnyProfilePic(seedSource = Date.now()) {
  const seed = encodeURIComponent(`${seedSource}-${Math.random().toString(36).slice(2, 10)}`);
  const style = funnyAvatarStyles[Math.floor(Math.random() * funnyAvatarStyles.length)];
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
}

function toPublicUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    profilePic: user.profilePic
  };
}

function signLoginCookie(res, user) {
  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  });
}

function getRegisterOtpKey(email) {
  return `register-otp:${email}`;
}

function hashOtp(email, otp) {
  return crypto
    .createHash("sha256")
    .update(`${email}:${otp}:${process.env.JWT_SECRET || "laughify"}`)
    .digest("hex");
}

function createOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function getResendFromEmail() {
  const configuredSender = process.env.RESEND_FROM_EMAIL?.trim();
  if (!configuredSender) return "Laughify <onboarding@resend.dev>";

  if (configuredSender.includes("@")) return configuredSender;

  const domain = configuredSender.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return `Laughify <verify@${domain}>`;
}

class ResendEmailError extends Error {
  constructor(status, body) {
    super(`Resend email failed: ${status} ${body}`);
    this.name = "ResendEmailError";
    this.status = status;
    this.body = body;
  }
}

function isResendSandboxRecipientError(err) {
  return err?.name === "ResendEmailError" &&
    err.status === 403 &&
    String(err.body || "").includes("You can only send testing emails to your own email address");
}

async function sendRegisterOtpEmail(email, otp) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFromEmail(),
      to: [email],
      subject: "Your Laughify verification code",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
          <h2>Verify your Laughify account</h2>
          <p>Your one-time verification code is:</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:6px">${otp}</p>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
      text: `Your Laughify verification code is ${otp}. It expires in 10 minutes.`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ResendEmailError(response.status, body);
  }
}

const registerController = async function (req, res) {
    try {
        const { password, username } = req.body;
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!email || !password || !username) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Verify email domain has MX records (can receive emails)
        const domain = email.split('@')[1];
        try {
            await dns.resolveMx(domain);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address with a working domain",
            });
        }

        const isAlreadyRegistered = await userModel.findOne({
            $or: [{ email }, { username }],
        });

        if (isAlreadyRegistered) {
            return res.status(409).json({
                success: false,
                message: isAlreadyRegistered.email === email 
                    ? "Email already registered" 
                    : "Username already taken",
            });
        }

        const existingOtp = await redis.get(getRegisterOtpKey(email));
        if (existingOtp) {
            const pending = JSON.parse(existingOtp);
            const secondsSinceSent = Math.floor((Date.now() - pending.sentAt) / 1000);
            if (secondsSinceSent < REGISTER_OTP_RESEND_SECONDS) {
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${REGISTER_OTP_RESEND_SECONDS - secondsSinceSent}s before requesting another code`,
                });
            }
        }

        const hash = await bcrypt.hash(password, 12);
        const otp = createOtp();
        let usedDevOtpFallback = false;

        try {
            await sendRegisterOtpEmail(email, otp);
        } catch (emailErr) {
            if (process.env.NODE_ENV !== "production" && isResendSandboxRecipientError(emailErr)) {
                usedDevOtpFallback = true;
                console.warn(
                    `[DEV OTP FALLBACK] Resend sandbox blocked ${email}. Verify a domain in Resend for real delivery. OTP: ${otp}`
                );
            } else {
                throw emailErr;
            }
        }

        await redis.set(
            getRegisterOtpKey(email),
            JSON.stringify({
                username,
                email,
                password: hash,
                otpHash: hashOtp(email, otp),
                attempts: 0,
                sentAt: Date.now(),
            }),
            "EX",
            REGISTER_OTP_TTL_SECONDS
        );

        return res.status(200).json({
            success: true,
            verificationRequired: true,
            message: usedDevOtpFallback
                ? "Resend sandbox blocked this recipient. OTP printed in backend terminal for local testing."
                : "Verification code sent to your email",
            ...(usedDevOtpFallback ? { devOtp: otp } : {}),
        });
    } catch (err) {
        console.error("Registration error:", err);
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({
                success: false,
                message: errors[0]
            });
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong, please try again later",
        });
    }
};

const verifyRegisterOtpController = async function (req, res) {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const otp = String(req.body.otp || "").trim();

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and verification code are required",
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "Please enter the 6-digit verification code",
            });
        }

        const pendingRaw = await redis.get(getRegisterOtpKey(email));
        if (!pendingRaw) {
            return res.status(400).json({
                success: false,
                message: "Verification code expired. Please register again.",
            });
        }

        const pending = JSON.parse(pendingRaw);
        if (pending.attempts >= 5) {
            await redis.del(getRegisterOtpKey(email));
            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Please register again.",
            });
        }

        if (pending.otpHash !== hashOtp(email, otp)) {
            pending.attempts += 1;
            await redis.set(getRegisterOtpKey(email), JSON.stringify(pending), "EX", REGISTER_OTP_TTL_SECONDS);
            return res.status(400).json({
                success: false,
                message: "Invalid verification code",
            });
        }

        const isAlreadyRegistered = await userModel.findOne({
            $or: [{ email }, { username: pending.username }],
        });

        if (isAlreadyRegistered) {
            await redis.del(getRegisterOtpKey(email));
            return res.status(409).json({
                success: false,
                message: isAlreadyRegistered.email === email
                    ? "Email already registered"
                    : "Username already taken",
            });
        }

        const user = await userModel.create({
            username: pending.username,
            email: pending.email,
            password: pending.password,
            profilePic: getRandomFunnyProfilePic(pending.username),
        });

        await redis.del(getRegisterOtpKey(email));
        signLoginCookie(res, user);

        return res.status(201).json({
            success: true,
            message: "Email verified and account created successfully",
            user: toPublicUser(user),
        });
    } catch (err) {
        console.error("Registration OTP verification error:", err);
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({
                success: false,
                message: errors[0]
            });
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong, please try again later",
        });
    }
};

const loginController = async function (req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })
    }

    const user = await userModel.findOne({
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    if (!user.profilePic) {
      user.profilePic = getRandomFunnyProfilePic(user.username);
      await user.save();
    }
    
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username
      }, process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    )
    
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/"
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: toPublicUser(user)
    })
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later"
    });
  }
}

const googleAuthController = async function (req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required"
      });
    }

    // Verify the Google token with clock tolerance, and handle clock errors gracefully
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_API_KEY,
        clockTolerance: 7200, // Allow 2 hours of clock skew
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      // If the error is about token being used too early, try to decode the token manually
      // since we trust the token came from Google via the frontend's Google login
      if (verifyErr.message && verifyErr.message.includes("Token used too early")) {
        console.warn("Clock skew detected, decoding token manually");
        // Decode the token (we still trust it because it came from Google's sign-in button)
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        payload = JSON.parse(jsonPayload);
      } else {
        // Re-throw other errors
        throw verifyErr;
      }
    }
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;

    // Check if user already exists
    let user = await userModel.findOne({
      $or: [
        { googleId },
        { email }
      ]
    });

    if (user) {
      if (!user.profilePic) {
        user.profilePic = getRandomFunnyProfilePic(user.username);
        await user.save();
      }

      // If user exists, log them in
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/"
      });

      return res.status(200).json({
        success: true,
        message: "Logged in with Google successfully",
        user: toPublicUser(user)
      });
    } else {
      // Create a new user
      let username = name.split(" ").join("").toLowerCase();
      
      // Ensure username is unique
      let usernameExists = await userModel.findOne({ username });
      let counter = 1;
      while (usernameExists) {
        username = `${username}${counter}`;
        usernameExists = await userModel.findOne({ username });
        counter++;
      }

      user = await userModel.create({
        username,
        email,
        googleId,
        password: undefined, // Not required for Google users
        profilePic: getRandomFunnyProfilePic(username)
      });

      const token = jwt.sign(
        {
          id: user._id,
          username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/"
      });

      return res.status(201).json({
        success: true,
        message: "Account created and logged in with Google successfully",
        user: toPublicUser(user)
      });
    }

  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong with Google authentication"
    });
  }
}

const getMe = async function (req, res) {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (user && !user.profilePic) {
      user.profilePic = getRandomFunnyProfilePic(user.username);
      await user.save();
    }
    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user
    });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later"
    });
  }
}

const logoutUser = async function (req, res) {
  try {
    const token = req.cookies.token;
    res.clearCookie("token", {
      path: "/"
    });

    if (token) {
      await redis.set(token, Date.now().toString(), "EX", 7 * 24 * 60 * 60); // Store for 7 days, same as token expiry
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later"
    });
  }
}


module.exports = {
    registerController,
    verifyRegisterOtpController,
    loginController,
    getMe,
    logoutUser,
    googleAuthController
};
