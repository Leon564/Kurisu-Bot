const sharp = require("sharp");
const { mediaMessageToBuffer } = require("../../tools");
const { messages } = require("../../templates");

const stickerToImage = async (kurisu) => {
  if (!kurisu.mediaType == "sticker") return messages.errorOnlyStickers;

  const media = await mediaMessageToBuffer(kurisu);
  const buffer = await sharp(media).png().toBuffer();

  return messages.imageBuffer(buffer);
};

module.exports = stickerToImage;
