const { Sticker, stickerTypes } = require("ws-sticker-maker");
const { mediaMessageToBuffer } = require("../../tools");

const stickerMaker = async (kurisu) => {
  if (!kurisu.mediaType) return { text: "No media found" };
  let image = await mediaMessageToBuffer(kurisu.media, kurisu.mediaType);

  var type =
    Object.values(stickerTypes).find(
      (x) =>
        "$" + x ===
        kurisu.outCommandMessageLower.split(" ").find((y) => y === "$" + x)
    ) || "default";

  if (kurisu.outCommandMessageLower.includes("$" + type)) {
    kurisu.outCommandMessage = kurisu.outCommandMessage.replace(
      new RegExp(`\\$${type}`, "gi"),
      ""
    );
  }

  console.log(`creando sticker ${type} a ${kurisu.from}`);

  const values = kurisu.outCommandMessage.split("$").slice(1);
  return await new Sticker(image)
    .setPack(values[0])
    .setAuthor(values[1])
    .setType(type)
    .setFps(15)
    .setQuality(kurisu.mediaType === "image" ? 85 : 10)
    .toMessage();
};

module.exports = stickerMaker;
