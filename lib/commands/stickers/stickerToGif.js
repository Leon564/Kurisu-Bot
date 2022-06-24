const { mediaMessageToBuffer } = require("../../tools");
const { Convert, Formats, Sizes } = require("ezgif-converter");
const { messages } = require("../../templates");

const stickerToGif = async (kurisu) => {
  if (!kurisu.mediaType == "sticker") return messages.errorOnlyStickers;
  
  const media = await mediaMessageToBuffer(kurisu);
  const gif = await new Convert(media)
    .setTargetFormat(Formats.MP4)    
    .toBuffer()
    .catch((err) => {
      console.log(err);
      return messages.error;
    });

  return messages.videoBuffer(gif, { gifPlayback: true });
};

module.exports = stickerToGif;
