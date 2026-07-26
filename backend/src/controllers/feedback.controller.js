const feedbackModel = require("../model/feedback.model");

function getLikerIdentifier(req) {
    if (req.user && req.user.id) {
        return `user:${req.user.id}`;
    }
    const ip = req.headers["x-forwarded-for"]
        ? req.headers["x-forwarded-for"].split(",")[0].trim()
        : (req.ip || req.socket?.remoteAddress || "unknown");
    return `ip:${ip}`;
}

const createFeedback = async function (req, res) {
    try {
        const { name, rating, avatar, text, isVerifiedUser, allowSharing, email } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "A valid rating between 1 and 5 is required"
            });
        }

        if (!text || String(text).trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Please write a short review to share your experience"
            });
        }

        const userId = req.user && req.user.id ? req.user.id : null;
        if (userId) {
            const existingFeedback = await feedbackModel.exists({ userId });
            if (existingFeedback) {
                return res.status(409).json({
                    success: false,
                    message: "You have already submitted feedback. One review is allowed per account."
                });
            }
        }

        const finalIsVerified = !!(userId || (typeof isVerifiedUser === "boolean" && isVerifiedUser));

        const feedback = await feedbackModel.create({
            name: (name && String(name).trim()) || "Anonymous Friend",
            rating: Number(rating),
            avatar: (avatar && String(avatar).trim()) || "😀",
            text: String(text).trim(),
            isVerifiedUser: finalIsVerified,
            allowSharing: typeof allowSharing === "boolean" ? allowSharing : true,
            email: (email && String(email).trim()) || undefined,
            userId,
            likes: 0,
            likedBy: []
        });

        return res.status(201).json({
            success: true,
            message: "Thank you for sharing your feedback!",
            feedback: {
                _id: feedback._id,
                name: feedback.name,
                rating: feedback.rating,
                avatar: feedback.avatar,
                text: feedback.text,
                isVerifiedUser: feedback.isVerifiedUser,
                allowSharing: feedback.allowSharing,
                likes: feedback.likes,
                createdAt: feedback.createdAt
            }
        });
    } catch (err) {
        console.error("Create feedback error:", err);
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({
                success: false,
                message: errors[0]
            });
        }
        if (err.code === 11000 && err.keyPattern && err.keyPattern.userId) {
            return res.status(409).json({
                success: false,
                message: "You have already submitted feedback. One review is allowed per account."
            });
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong, please try again later"
        });
    }
};

const getPublicFeedback = async function (req, res) {
    try {
        const likerId = getLikerIdentifier(req);

        const items = await feedbackModel
            .find({ allowSharing: true })
            .sort({ createdAt: -1 })
            .limit(200)
            .select("-email -userId")
            .lean();

        const hydrated = items.map((item) => ({
            ...item,
            liked: Array.isArray(item.likedBy) && item.likedBy.includes(likerId) ? true : false,
            likedBy: undefined
        }));

        return res.status(200).json({
            success: true,
            message: "Public feedback fetched",
            feedback: hydrated
        });
    } catch (err) {
        console.error("Get public feedback error:", err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong, please try again later"
        });
    }
};

const getFeedbackStats = async function (req, res) {
    try {
        const [total, publicOnly] = await Promise.all([
            feedbackModel.countDocuments({}),
            feedbackModel.find({ allowSharing: true }).select("rating likes").lean()
        ]);

        const publicCount = publicOnly.length;
        const avgRating = publicCount
            ? publicOnly.reduce((sum, f) => sum + (Number(f.rating) || 0), 0) / publicCount
            : 0;
        const totalLikes = publicOnly.reduce((sum, f) => sum + (Number(f.likes) || 0), 0);

        return res.status(200).json({
            success: true,
            message: "Feedback stats fetched",
            stats: {
                totalFeedbackCount: total,
                publicReviewCount: publicCount,
                avgRating: Number(avgRating.toFixed(2)),
                totalLikes
            }
        });
    } catch (err) {
        console.error("Get feedback stats error:", err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong, please try again later"
        });
    }
};

const toggleLikeFeedback = async function (req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Feedback id is required"
            });
        }

        const likerId = getLikerIdentifier(req);

        const feedback = await feedbackModel.findById(id);
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found"
            });
        }

        const likedByArr = Array.isArray(feedback.likedBy) ? [...feedback.likedBy] : [];
        const alreadyLikedIndex = likedByArr.indexOf(likerId);

        let newLikes = Number(feedback.likes) || 0;
        let liked;

        if (alreadyLikedIndex >= 0) {
            likedByArr.splice(alreadyLikedIndex, 1);
            newLikes = Math.max(0, newLikes - 1);
            liked = false;
        } else {
            likedByArr.push(likerId);
            newLikes = newLikes + 1;
            liked = true;
        }

        feedback.likedBy = likedByArr;
        feedback.likes = newLikes;
        await feedback.save();

        return res.status(200).json({
            success: true,
            message: liked ? "You liked this review!" : "Removed your like",
            likes: newLikes,
            liked
        });
    } catch (err) {
        console.error("Toggle like feedback error:", err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong, please try again later"
        });
    }
};

const optionalAuthMiddleware = async function (req, res, next) {
    try {
        const token = req.cookies && req.cookies.token;
        if (!token) return next();

        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
            req.user = decoded;
        }
    } catch (err) {
        // ignore invalid token - still treat as guest
    }
    next();
};

module.exports = {
    createFeedback,
    getPublicFeedback,
    getFeedbackStats,
    toggleLikeFeedback,
    optionalAuthMiddleware
};
