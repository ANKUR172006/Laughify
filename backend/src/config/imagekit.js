const ImageKit = require("imagekit");


console.log("PUBLIC_KEY:", process.env.IMAGEKIT_PUBLIC_KEY );
console.log("PRIVATE_KEY:", process.env.IMAGEKIT_PRIVATE_KEY );
console.log("URL_ENDPOINT:", process.env.IMAGEKIT_URL_ENDPOINT  );

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

module.exports = imagekit;
