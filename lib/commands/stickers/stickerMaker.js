const { Sticker, stickerTypes } = require("ws-sticker-maker");
const { mediaMessageToBuffer } = require("../../tools");
const {messages}=require("../../templates")

const stickerMaker = async (kurisu) => {  
  if (!["video","image","sticker"].includes(kurisu.mediaType)) return messages.errorNoMedia;;  
  const image = await mediaMessageToBuffer(kurisu);
  if (!image) return messages.errorOldMessage;
  const type =
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
    .setSize(512)
    .setQuality(0)
    .toMessage();
};

module.exports = stickerMaker;
