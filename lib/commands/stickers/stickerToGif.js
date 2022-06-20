const { mediaMessageToBuffer } = require("../../tools");
const ezgif = require("ezgif");
const { messages } = require("../../templates");

const stickerToGif = async (kurisu) => {
  if (!kurisu.mediaType == "sticker") return messages.errorOnlyStickers;

  const media = await mediaMessageToBuffer(kurisu);
  const result = await ezgif.webp_to_mp4(media).catch((err) => {
    console.log(err);
    return messages.error;
  });
  return messages.videoBuffer(result, true);
};

module.exports = stickerToGif;
