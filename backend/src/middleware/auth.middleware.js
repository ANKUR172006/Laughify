const userModel=require("../model/auth.model")
const jwt =require("jsonwebtoken");
const redis=require("../config/cache")

async function authUser(req,res,next){
    try {
        const token = req.cookies.token;

        if(!token){
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const isTokenBlacklisted = await redis.get(token);

        if(isTokenBlacklisted){
            return res.status(401).json({
                success: false,
                message: 'Session expired, please login again'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch(err) {
        console.error("Auth middleware error:", err);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
}


module.exports={
    authUser
}