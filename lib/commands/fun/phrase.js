const { amadeus } = require("../../providers");
const { messages } = require("../../templates");

async function phrase() {
  const result = await amadeus.phrase();
  if (result) return messages.text(result);
  return messages.error;
}

module.exports = phrase;
