const express=require("express")
const authRouter=express.Router()
const model=require("../model/auth.model");
const authController=require("../controllers/auth.controllers")
const authMiddleware=require("../middleware/auth.middleware")

authRouter.post("/register",authController.registerController);
authRouter.post("/verify-register-otp", authController.verifyRegisterOtpController);
authRouter.post("/login",authController.loginController);
authRouter.post("/google", authController.googleAuthController);
authRouter.get("/get-me",authMiddleware.authUser,authController.getMe);
authRouter.post("/logout",authMiddleware.authUser,authController.logoutUser)


module.exports=authRouter
