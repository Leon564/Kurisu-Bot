const { mediaMessageToBuffer } = require("../../tools");
const ezgif = require("ezgif");

const stickerToGif = async (kurisu) => {
  if (!kurisu.media && !kurisu.mediaType) return { text: "No media found" };
  const media = await mediaMessageToBuffer(kurisu.media, kurisu.mediaType);
  const result = await ezgif.webp_to_mp4(media).catch((err) => {
    console.log(err);
    return { text: "I'm sorry, I couldn't find a gif for you." };
  });
  return { video: result, gifPlayback: true };
};

module.exports = stickerToGif;
