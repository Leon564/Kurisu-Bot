const { amadeus } = require("../../providers");
const templates = require("../../templates");

const character = async (kurisu) => {
  if (kurisu.outCommandMessage.length < 1)
    return templates.messages.errorCharacterName;

  let character = await amadeus.characterByName(kurisu.outCommandMessage);
  if (!character) return templates.messages.errorNoResults;
  if (character.total_results > 1)
    return templates.character.messageListTemplate(character.results);
  return templates.character.messageTemplate(character);
};

const characterById = async (kurisu) => {
  if (kurisu.outCommandMessage.length < 1)
    return templates.messages.errorCharacterId;

  let character = await amadeus.characterById(kurisu.outCommandMessage);
  if (!character) return templates.messages.errorNoResults;
  return templates.character.messageTemplate(character);
};

module.exports = {
  character,
  characterById,
};
