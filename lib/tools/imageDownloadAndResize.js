const axios = require("axios");
const sharp = require("sharp");
const path = require("path");

async function imageDownloadAndResize(url) {
  try {
    const image = await axios.get(url, { responseType: "arraybuffer" });
    const result = await sharp(image.data)
      .resize(1000)
      .jpeg({ quality: 80 })
      .toBuffer();
    return result ?? null;
  } catch (err) {
    return null;
  }
}

module.exports = imageDownloadAndResize;
