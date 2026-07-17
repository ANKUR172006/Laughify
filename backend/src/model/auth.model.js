const mongoose=require("mongoose");

 const userSchema= new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: [true, "Username already taken"],
        trim: true,
        minlength: [3, "Username must be at least 3 characters long"],
        maxlength: [20, "Username must be less than 20 characters long"]
    },
    password:{
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    },
    email:{
        type:String,
        required: [true, "Email is required"],
        unique:[true, "Email already registered"],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    highestLevel: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

 module.exports=mongoose.model("users",userSchema)