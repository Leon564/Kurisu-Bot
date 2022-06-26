const axios = require("axios");
const sharp = require("sharp");
const path = require("path");
const error404Image =
  "https://i.ibb.co/VLTKT8q/anime-girls-404-not-found-glowing-eyes-girls-frontline-wallpaper-preview.jpg";

async function imageDownloadAndResize(url) {
  const image = await axios
    .get(encodeURI(url), { responseType: "arraybuffer" })
    .catch((err) => {
      return null;
    });
  if (!image?.data) return {url: error404Image};
  const result = await sharp(image.data)
    .resize(1000)
    .jpeg({ quality: 80 })
    .toBuffer();
  return result ?? null;
}

module.exports = imageDownloadAndResize;
