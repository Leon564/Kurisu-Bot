const { amadeus } = require("../../providers");
const templates = require("../../templates");

const findAnime = async (kurisu) => {
  if (kurisu.outCommandMessage.length < 1) {
    let anime = await amadeus.randomAnime();
    if (!anime) return templates.messages.errorNoResults;
    return templates.anime.messageTemplate(anime);
  }

  let anime = await amadeus.animeByName(kurisu.outCommandMessage);
  if (!anime) return templates.messages.errorNoResults;
  if (anime.total_results > 1) {
    return templates.anime.messageListTemplate(anime.results);
  }
  return templates.anime.messageTemplate(anime.results[0]);
};
const animeById = async (kurisu) => {
  const anime = await amadeus.animeById(kurisu.outCommandMessage);
  if (anime) {
    return templates.anime.messageTemplate(anime);
  }
  return templates.messages.errorNoResults;
};
module.exports = {
  findAnime,
  animeById,
};
