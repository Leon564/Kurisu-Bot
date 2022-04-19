const { Sticker, stickerTypes } = require("ws-sticker-maker");
const { amadeus } = require("../../providers");
const doge = async () => {
  const image = await amadeus.snime();
  if (!image) return null;
  return await new Sticker(image)
    .setPack("anime-Sticker")
    .setAuthor("Kurisu")
    .toMessage();
};

module.exports = doge;
