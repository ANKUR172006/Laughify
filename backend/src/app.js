const express = require("express");
const path = require("path");
const authRouter = require("./routes/auth.router");
const gameRouter = require("./routes/game.router");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
app.use(express.json({ limit: "10mb" })); // Increase limit for base64 images
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
}));
app.use("/api/auth", authRouter);
app.use("/api/game", gameRouter);

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, "../dist")));

// Handle SPA fallback - all non-api requests go to index.html
app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
});

module.exports=app;