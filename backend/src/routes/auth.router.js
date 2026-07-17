const express=require("express")
const authRouter=express.Router()
const model=require("../model/auth.model");
const authController=require("../controllers/auth.controllers")
const authMiddleware=require("../middleware/auth.middleware")

authRouter.post("/register",authController.registerController);
authRouter.post("/login",authController.loginController);
authRouter.get("/get-me",authMiddleware.authUser,authController.getMe);
authRouter.post("/logout",authMiddleware.authUser,authController.logoutUser)


module.exports=authRouter