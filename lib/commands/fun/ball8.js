const answers = require("../../../data/answers8Ball.json");

const ball8 = async (kurisu) => {
  if (!kurisu.outCommandMessage)
    return { text: "Preguntame algo, no seas tan timido." };

  const res = answers[Math.floor(Math.random() * answers.length)];
  return { text: "Respuesta: " + res };
};

module.exports = ball8;
