const mongoose=require("mongoose");

const funnyAvatarStyles = [
    "fun-emoji",
    "bottts",
    "adventurer",
    "avataaars",
    "big-smile",
    "croodles"
];

function getDefaultProfilePic() {
    const seed = encodeURIComponent(`${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    const style = funnyAvatarStyles[Math.floor(Math.random() * funnyAvatarStyles.length)];
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
}

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
        required: function() {
            return !this.googleId; // Only required if not using Google
        },
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
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    highestLevel: {
        type: Number,
        default: 1
    },
    profilePic: {
        type: String,
        default: getDefaultProfilePic
    },
    smilePhotos: [{
        url: String,
        level: Number,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

 module.exports=mongoose.model("users",userSchema)
