const imagekit = require("../config/imagekit");
const userModel = require("../model/auth.model");

const getVideoByLevel = async (req, res) => {
  try {
    const { level } = req.params;
    
    // List files from the /laughify-videos folder
    const files = await imagekit.listFiles({
      path: "/laughify-videos",
    });

    // Find the file for this level (case-insensitive, matches level-1, level 1, etc.)
    const levelVideo = files.find(file => {
      const name = file.name.toLowerCase();
      return name.includes(`level-${level}`) || name.includes(`level ${level}`);
    });

    if (!levelVideo) {
      return res.status(404).json({
        success: false,
        message: `Video for level ${level} not found in /laughify-videos folder`,
      });
    }

    // Generate URL for the video
    const videoUrl = imagekit.url({
      path: levelVideo.filePath,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });

    res.status(200).json({
      success: true,
      videoUrl,
      level,
      fileName: levelVideo.name,
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
      videos: files,
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
    
    // imageData is base64 encoded
    const uploadResult = await imagekit.upload({
      file: imageData, // required
      fileName: `user-laugh-level-${level}-${Date.now()}.jpg`, // required
      folder: "/Laughing-Faces",
    });

    // Add photo to user's smilePhotos
    const user = await userModel.findById(userId);
    if (user) {
      user.smilePhotos.push({
        url: uploadResult.url,
        level: level
      });
      await user.save();
    }

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

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
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
    const users = await userModel.find({}, "username highestLevel").sort({ highestLevel: -1 }).limit(100);
    res.status(200).json({
      success: true,
      leaderboard: users
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
  updateHighestLevel,
  getProfile,
  getLeaderboard
};
