const axios = require("axios");
const sharp = require("sharp");
const path = require("path");

async function imageDownloadAndResize(url) {
  const image = await axios
    .get(url, { responseType: "arraybuffer" })
    .catch((err) => {
      return null;
    });
  if (!image?.data) return null;
  const result = await sharp(image.data)
    .resize(1000)
    .jpeg({ quality: 80 })
    .toBuffer();
  return result ?? null;
}

module.exports = imageDownloadAndResize;
