const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength: [40, "Name must be less than 40 characters long"],
        default: "Anonymous Friend"
    },
    rating: {
        type: Number,
        required: [true, "Rating is required"],
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating must be at most 5"]
    },
    avatar: {
        type: String,
        required: [true, "Avatar is required"],
        trim: true,
        maxlength: [8, "Avatar must be a short emoji or character"]
    },
    text: {
        type: String,
        required: [true, "Review text is required"],
        trim: true,
        minlength: [2, "Review must be at least 2 characters long"],
        maxlength: [800, "Review must be less than 800 characters long"]
    },
    isVerifiedUser: {
        type: Boolean,
        default: false
    },
    allowSharing: {
        type: Boolean,
        default: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    likes: {
        type: Number,
        default: 0,
        min: [0, "Likes cannot be negative"]
    },
    likedBy: [{
        type: String,
        default: []
    }]
}, {
    timestamps: true
});

feedbackSchema.index({ allowSharing: 1, createdAt: -1 });
feedbackSchema.index(
    { userId: 1 },
    { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } }
);

module.exports = mongoose.model("feedback", feedbackSchema);
