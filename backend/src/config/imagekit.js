const ImageKit = require("imagekit");

console.log("🔍 ImageKit Config Check:");
console.log("PUBLIC_KEY:", process.env.IMAGEKIT_PUBLIC_KEY ? "✓ Set" : "✗ Missing");
console.log("PRIVATE_KEY:", process.env.IMAGEKIT_PRIVATE_KEY ? "✓ Set" : "✗ Missing");
console.log("URL_ENDPOINT:", process.env.IMAGEKIT_URL_ENDPOINT ? "✓ Set" : "✗ Missing");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

module.exports = imagekit;
