const sharp = require("sharp");
const { mediaMessageToBuffer } = require("../../tools");

const stickerToImage = async (kurisu) => {
  if (!kurisu.media && !kurisu.mediaType) return { text: "No media found" };

  const media = await mediaMessageToBuffer(kurisu.media, kurisu.mediaType);
  const buffer = await sharp(media).png().toBuffer();

  return { image: buffer };
};

module.exports = stickerToImage;
