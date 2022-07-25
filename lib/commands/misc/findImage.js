const { findImage, findByImage } = require("../../providers/amadeus");
const {
  imageDownloadAndResize,
  uploadImage,
  mediaMessageToBuffer,
} = require("../../tools");
const { findImages, messages } = require("../../templates");

const findImagebyText = async (kurisu) => {
  const images = await findImage(kurisu.outCommandMessage);
  if (!images) return messages.error;
  return findImages.imagesByTextResults(images);
};

const replyImagebyLink = async (kurisu) => {
  return imageDownloadAndResize(kurisu.outCommandMessage)
    .then((image) => {
      if (!image) return messages.error;
      return messages.imageBuffer(image);
    })
    .catch((err) => {
      console.log(err);
      return messages.text(
        `ocurrio un error al descargar la imagen \n${kurisu.outCommandMessage}`
      );
    });
};

const findByImageLink = async (kurisu) => {
  let image = await mediaMessageToBuffer(kurisu);
  if (!image) return messages.errorOldMessage;

  const imageUrl = await uploadImage(image);
  if (!imageUrl) return messages.error;

  const images = await findByImage(imageUrl);
  if (!images) return messages.error;
  const result = images.filter((image) => image.url);
  if (result.length < 1) return messages.error;
  return findImages.imagesByLinkResults(result);
};

const searchImage = async (kurisu) => {
  if (!["image"].includes(kurisu.mediaType))
    return await findImagebyText(kurisu);
    
  return await findByImageLink(kurisu);
};

module.exports = {
  searchImage,
  replyImagebyLink,
};
