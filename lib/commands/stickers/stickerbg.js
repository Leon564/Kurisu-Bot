const { Sticker, stickerTypes } = require("ws-sticker-maker");
const { messages } = require("../../templates");
const { removeBgImage, mediaMessageToBuffer } = require("../../tools");

const stickerbg = async (kurisu) => {
  if (!["image"].includes(kurisu.mediaType)) return messages.errorOnlyImages;  
  let image = await mediaMessageToBuffer(kurisu);
  if (!image) return messages.errorOldMessage;  
  image = await removeBgImage(image);
  let type =
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

  console.log(`creando stickerbg ${type} a ${kurisu.from}`);  
  const values = kurisu.outCommandMessage.split("$").slice(1);
  return await new Sticker(image)
    .setPack(values[0])
    .setAuthor(values[1])
    .setType(type)
    .setFps(15)
    .setQuality(kurisu.mediaType === "image" ? 85 : 10)
    .toMessage();
};

module.exports = stickerbg;