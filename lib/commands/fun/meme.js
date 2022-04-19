const { amadeus } = require("../../providers");

const meme = async () => {
  const result = await amadeus.meme();
  if (result) return { image: { url: result } };
  return { text: "I'm sorry, I couldn't find a meme for you." };
};
module.exports = meme;
