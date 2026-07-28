const imagekit = require("../config/imagekit");
const userModel = require("../model/auth.model");

const funnyAvatarStyles = [
  "fun-emoji",
  "bottts",
  "adventurer",
  "avataaars",
  "big-smile",
  "croodles"
];

function getFunnyProfilePic(seedSource = Date.now()) {
  const seed = encodeURIComponent(String(seedSource));
  const index = Math.abs(String(seedSource).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % funnyAvatarStyles.length;
  return `https://api.dicebear.com/9.x/${funnyAvatarStyles[index]}/svg?seed=${seed}`;
}

function getImageExtension(imageData) {
  const match = imageData.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/);
  const ext = match ? match[1].toLowerCase() : "jpg";
  if (ext === "jpeg") return "jpg";
  if (["jpg", "png", "webp", "gif"].includes(ext)) return ext;
  return "jpg";
}

const getVideoByLevel = async (req, res) => {
  try {
    const { level } = req.params;
    const levelNumber = Number(level);
    if (!Number.isFinite(levelNumber)) {
      return res.status(400).json({ success: false, message: "Invalid level" });
    }
    
    const files = await imagekit.listFiles({
      path: "/laughify-videos",
    });

    const levelRegex = new RegExp(String.raw`(?:^|[^0-9])level[\s_-]*0*${levelNumber}(?:[^0-9]|$)`, "i");
    const candidates = files.filter((file) => levelRegex.test(file.name));
    candidates.sort((a, b) => {
      const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
      const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
      if (bTime !== aTime) return bTime - aTime;
      return String(b.fileId || "").localeCompare(String(a.fileId || ""));
    });
    const levelVideo = candidates[0];

    if (!levelVideo) {
      return res.status(404).json({
        success: false,
        message: `Video for level ${level} not found in /laughify-videos folder`,
      });
    }

    const videoUrl = imagekit.url({
      path: levelVideo.filePath,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });

    const cacheToken = levelVideo.updatedAt || levelVideo.fileId || levelVideo.name;
    const cacheBustedUrl = `${videoUrl}${videoUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(cacheToken)}`;
    res.set("Cache-Control", "no-store");
    res.status(200).json({
      success: true,
      videoUrl: cacheBustedUrl,
      level,
      fileName: levelVideo.name,
      fileId: levelVideo.fileId,
      updatedAt: levelVideo.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateHighestLevel = async (req, res) => {
  try {
    const { level } = req.body;
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (level > user.highestLevel) {
      user.highestLevel = level;
      await user.save();
    }

    res.status(200).json({
      success: true,
      highestLevel: user.highestLevel
    });
  } catch (error) {
    console.error("Error updating highest level:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const listVideos = async (req, res) => {
  try {
    const files = await imagekit.listFiles({
      path: "/laughify-videos",
    });

    res.status(200).json({
      success: true,
      videos: files
        .map((file) => {
          const match = String(file.name).match(/level[\s_-]*0*(\d+)/i);
          return { ...file, _level: match ? Number(match[1]) : null };
        })
        .sort((a, b) => {
          if (a._level == null && b._level == null) return 0;
          if (a._level == null) return 1;
          if (b._level == null) return -1;
          if (a._level !== b._level) return a._level - b._level;
          const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
          const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
          return bTime - aTime;
        })
        .map(({ _level, ...rest }) => rest),
    });
  } catch (error) {
    console.error("Error listing videos:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadUserPhoto = async (req, res) => {
  try {
    const { level, imageData } = req.body;
    const userId = req.user.id;
    
    // Get user to retrieve username
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // imageData is base64 encoded
    const uploadResult = await imagekit.upload({
      file: imageData, // required
      fileName: `${user.username}-laugh-level-${level}-${Date.now()}.jpg`, // required
      folder: "/Laughing-Faces",
    });

    // Add photo to user's smilePhotos
    user.smilePhotos.push({
      url: uploadResult.url,
      level: level
    });
    await user.save();

    res.status(200).json({
      success: true,
      photoUrl: uploadResult.url,
      fileId: uploadResult.fileId,
    });
  } catch (error) {
    console.error("Error uploading photo:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadProfilePic = async (req, res) => {
  try {
    const { imageData } = req.body;
    const userId = req.user.id;

    if (!imageData || typeof imageData !== "string" || !imageData.startsWith("data:image/")) {
      return res.status(400).json({
        success: false,
        message: "Please upload a valid image file"
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const uploadResult = await imagekit.upload({
      file: imageData,
      fileName: `${user.username}-profile-${Date.now()}.${getImageExtension(imageData)}`,
      folder: "/Profile-Pics",
    });

    user.profilePic = uploadResult.url;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture updated",
      profilePic: user.profilePic,
      fileId: uploadResult.fileId,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.profilePic) {
      user.profilePic = getFunnyProfilePic(user.username || userId);
      await user.save();
    }

    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        highestLevel: user.highestLevel,
        smilePhotos: user.smilePhotos
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    // Get users sorted by highestLevel descending
    const users = await userModel.find({}, "username highestLevel profilePic").sort({ highestLevel: -1 }).limit(100);
    res.status(200).json({
      success: true,
      leaderboard: users.map((user) => ({
        _id: user._id,
        username: user.username,
        highestLevel: user.highestLevel,
        profilePic: user.profilePic || getFunnyProfilePic(user.username || user._id)
      }))
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getVideoByLevel,
  listVideos,
  uploadUserPhoto,
  uploadProfilePic,
  updateHighestLevel,
  getProfile,
  getLeaderboard
};
