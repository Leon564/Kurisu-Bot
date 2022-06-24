const { amadeus } = require("../../providers");
const { imageDownloadAndResize } = require("../../tools");
const {messages} = require("../../templates");

const waifu = async () => {
  let result = await amadeus.waifu_Nfsw();
  if (!result) return messages.error;
  let image = await imageDownloadAndResize(result.image);
  if (!image) return messages.error;
  return messages.imageBuffer(image, {caption:result.name,viewOnce:true});
};

const husb = async () => {
  let result = await amadeus.husb_Nfsw();
  if (!result) return messages.error;
  let image = await imageDownloadAndResize(result.image);
  if (!image) return messages.error;
  return messages.imageBuffer(image, {caption:result.name,viewOnce:true});
};

module.exports = { waifu, husb };
