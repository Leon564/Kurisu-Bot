const { amadeus } = require("../../providers");
const { imageDownloadAndResize } = require("../../tools");

const waifu = async () => {
  let result = await amadeus.waifu_Nfsw();
  if (!result) return { error: "Ocurrio un error :c" };
  let image = await imageDownloadAndResize(result.image);
  if (!image) return { error: "Ocurrio un error :c" };
  return { image, caption: result.name, viewOnce: true };
};

const husb = async () => {
  let result = await amadeus.husb_Nfsw();
  if (!result) return { error: "Ocurrio un error :c" };
  let image = await imageDownloadAndResize(result.image);
  if (!image) return { error: "Ocurrio un error :c" };
  return { image, caption: result.name, viewOnce: true };
};

module.exports = { waifu, husb };
