const { Sticker, stickerTypes } = require("ws-sticker-maker");
const { amadeus } = require("../../providers");
const doge = async () => {
  const image = await amadeus.doge();
  if (!image) return null;
  return await new Sticker(image)
    .setPack("Doge-Sticker")
    .setAuthor("Kurisu")
    .toMessage();
};

module.exports = doge;
