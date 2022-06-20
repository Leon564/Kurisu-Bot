const answers = require("../../../data/answers8Ball.json");
const { messages } = require("../../templates");

const ball8 = async (kurisu) => {
  if (!kurisu.outCommandMessage) return messages.sendQuestion;
  const res = answers[Math.floor(Math.random() * answers.length)];
  return messages.text("*kurisu dice:* " + res);
};

module.exports = ball8;
