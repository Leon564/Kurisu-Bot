const { amadeus } = require("../../providers");
const { imageDownloadAndResize } = require("../../tools");

const waifu = async () => {
  let result = await amadeus.waifu_Sfw();
  if (!result) return { error: "Ocurrio un error :c" };
  let image = await imageDownloadAndResize(result.image);
  if (!image) return { error: "Ocurrio un error :c" };
  return { image, caption: result.name };
};

const husb = async () => {
    let result = await amadeus.husb_Sfw();
    if (!result) return { error: "Ocurrio un error :c" };
    let image = await imageDownloadAndResize(result.image);
    if (!image) return { error: "Ocurrio un error :c" };
    return { image, caption: result.name };
  };

module.exports = { waifu, husb };
