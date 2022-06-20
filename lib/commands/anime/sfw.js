const { amadeus } = require("../../providers");
const { imageDownloadAndResize } = require("../../tools");
const { messages } = require("../../templates");

const waifu = async () => {
  let result = await amadeus.waifu_Sfw();
  if (!result) return messages.error;
  let image = await imageDownloadAndResize(result.image);
  if (!image) return messages.error;
  return messages.imageBuffer(image, result.name);  
};

const husb = async () => {
    let result = await amadeus.husb_Sfw();
    if (!result) return messages.error;
    let image = await imageDownloadAndResize(result.image);
    if (!image) return messages.error;
    return messages.imageBuffer(image, result.name);
  
  };

module.exports = { waifu, husb };
