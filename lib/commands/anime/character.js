const { amadeus } = require("../../providers");
const templates = require("../../templates");

const character = async (kurisu) => {
  if (kurisu.outCommandMessage.length < 1)
    return { text: "Ingrese el nombre de algun personaje" };

  let character = await amadeus.characterByName(kurisu.outCommandMessage);
  if (!character) return { text: "No se encontraron resultados" };
  if (character.total_results > 1)
    return templates.character.messageListTemplate(character.results);
  return templates.character.messageTemplate(character);
};

const characterById = async (kurisu) => {
  if (kurisu.outCommandMessage.length < 1)
    return { text: "Ingrese el id de algun personaje" };

  let character = await amadeus.characterById(kurisu.outCommandMessage);
  if (!character) return { text: "No se encontraron resultados" };
  return templates.character.messageTemplate(character);
};

module.exports = {
  character,
  characterById,
};
