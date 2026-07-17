const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const userModel = require("../model/auth.model");
const redis=require("../config/cache")

const registerController = async function (req, res) {
    try {
        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
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
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            },
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

const loginController= async function (req,res){
  try {
    const {identifier,password}=req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })
    }

    const user=await userModel.findOne({
      $or:[
        {username:identifier},
        {email:identifier}
      ]
    })

    if(!user){
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    const isPasswordValid=await bcrypt.compare(password,user.password)

    if(!isPasswordValid){
      return res.status(401).json({
        success: false,
        message:"Invalid credentials"
      })
    }
    
    const token =jwt.sign(
      {
        id:user._id,
        username:user.username
      }, process.env.JWT_SECRET,
      {
        expiresIn:"7d"
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
      message:"Logged in successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    })
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later"
    });
  }
}

const getMe=async function (req,res) {
  try {
    const user=await userModel.findById(req.user.id).select("-password")
    res.status(200).json({
      success: true,
      message:"User fetched successfully",
      user
    })
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later"
    });
  }
}

const logoutUser=async function(req,res){
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
      message:"Logged out successfully"
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
    registerController,loginController,getMe,logoutUser
};