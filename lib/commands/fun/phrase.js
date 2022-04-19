const { amadeus } = require("../../providers");

async function phrase() {
  const result = await amadeus.phrase();
  if (result) return { text: result };
  return { text: "I'm sorry, I couldn't find a phrase for you." };
}

module.exports = phrase;
