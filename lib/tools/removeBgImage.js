const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const config = require("../../config");

const removeBg = async (image) => {
  if (!image || !config.BgApikey) return "error";
  let BgApikey = JSON.parse(config.BgApikey);
  BgApikey = Array.isArray(BgApikey)
    ? BgApikey[Math.floor(Math.random() * BgApikey.length)]
    : BgApikey;

  image = Buffer.isBuffer(image) ? image : fs.readFileSync(image);

  const formData = new FormData();
  formData.append("size", "auto");
  formData.append("image_file", image, "image");
  return axios({
    method: "post",
    url: "https://api.remove.bg/v1.0/removebg",
    data: formData,
    responseType: "arraybuffer",
    headers: {
      ...formData.getHeaders(),

      "X-Api-Key": BgApikey,
    },
    encoding: null,
  })
    .then((response) => {
      if (response.status != 200) return "error";
      return response.data;
    })
    .catch((error) => {
      return console.error("Request failed:", error);
    });
};

module.exports = removeBg;
