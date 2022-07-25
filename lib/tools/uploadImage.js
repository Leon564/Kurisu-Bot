const imgbb = require("imgbb");
const { imgbbApiKey } = require("../../config");

const uploadImage = async (image) => {
  const result = await new imgbb(image)
    .setApiKey(imgbbApiKey) //https://imgbb.com/
    .setExpiration(120) //time in seconds for the image to be deleted
    .setName(Date.now()) //name of the image
    .upload();

  if (!result.url) return null;

  return result.url;
};

module.exports = uploadImage;
