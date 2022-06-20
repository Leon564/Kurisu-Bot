const dices = require("../../../data/dices.json");
const { messages } = require("../../templates");
const rollDice = () => {
  const dice = dices[Math.floor(Math.random() * dices.length)];
  return messages.stickerUrl(dice); 
};
module.exports = rollDice;
