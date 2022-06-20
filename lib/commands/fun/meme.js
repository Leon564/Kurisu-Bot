const { amadeus } = require("../../providers");
const { messages } = require("../../templates");

const meme = async () => {
  const result = await amadeus.meme();
  if (result) return messages.imageUrl(result);
  return messages.error;
};
module.exports = meme;
