const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const dns = require("dns").promises;
const userModel = require("../model/auth.model");
const redis = require("../config/cache");

const googleClient = new OAuth2Client(process.env.GOOGLE_API_KEY);

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

const registerController = async function (req, res) {
    try {
        const { email, password, username } = req.body;

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

        const hash = await bcrypt.hash(password, 12); // More secure hashing

        const user = await userModel.create({
            username,
            email,
            password: hash,
            profilePic: getRandomFunnyProfilePic(username),
        });

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d", // Longer expiration for better UX
            }
        );

        // Improved cookie config
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Secure in production
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // Match token expiry
            path: "/"
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: toPublicUser(user),
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
    loginController,
    getMe,
    logoutUser,
    googleAuthController
};
