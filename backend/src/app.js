const express = require("express");
const path = require("path");
const authRouter = require("./routes/auth.router");
const gameRouter = require("./routes/game.router");
const feedbackRouter = require("./routes/feedback.router");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
}));
app.use("/api/auth", authRouter);
app.use("/api/game", gameRouter);
app.use("/api/feedback", feedbackRouter);

const distDir = path.join(__dirname, "../dist");

const LONG_CACHE = /\.[a-f0-9]{8}\.(css|js|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|otf|ico)$/i;
const MEDIUM_CACHE = /\.(png|jpg|jpeg|gif|webp|svg|woff2?|ttf|otf|ico)$/i;

app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();

    if (LONG_CACHE.test(req.path)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else if (MEDIUM_CACHE.test(req.path)) {
        res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    } else if (/\.html$/i.test(req.path) || req.path === "/") {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    } else {
        res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    }
    next();
});

app.use(express.static(distDir, {
    index: false,
    extensions: [],
}));

app.use((req, res, next) => {
    if (!req.path.startsWith("/api")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.sendFile(path.join(distDir, "index.html"));
    } else {
        next();
    }
});

module.exports = app;
