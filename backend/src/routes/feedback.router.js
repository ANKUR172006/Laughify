const express = require("express");
const feedbackRouter = express.Router();
const feedbackController = require("../controllers/feedback.controller");

feedbackRouter.post(
    "/",
    feedbackController.optionalAuthMiddleware,
    feedbackController.createFeedback
);

feedbackRouter.get(
    "/public",
    feedbackController.optionalAuthMiddleware,
    feedbackController.getPublicFeedback
);

feedbackRouter.get(
    "/stats",
    feedbackController.getFeedbackStats
);

feedbackRouter.post(
    "/:id/like",
    feedbackController.optionalAuthMiddleware,
    feedbackController.toggleLikeFeedback
);

module.exports = feedbackRouter;
