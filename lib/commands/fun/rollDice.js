const dices = require("../../../data/dices.json");
const rollDice = () => {
  const dice = dices[Math.floor(Math.random() * dices.length)];
  return { sticker: { url: dice } };
};
module.exports = rollDice;
