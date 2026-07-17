const express = require("express");
const gameRouter = express.Router();
const gameController = require("../controllers/game.controller");
const { authUser } = require("../middleware/auth.middleware");

gameRouter.get("/list", gameController.listVideos);
gameRouter.get("/video/:level", gameController.getVideoByLevel);
gameRouter.post("/photo", gameController.uploadUserPhoto);
gameRouter.post("/highest-level", authUser, gameController.updateHighestLevel);

module.exports = gameRouter;
