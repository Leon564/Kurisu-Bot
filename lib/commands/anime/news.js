const { amadeus } = require("../../providers");
const templates = require("../../templates");

const animeNews = async () => {
  const resultNews = await amadeus.animeNews();
  if (!resultNews) return templates.messages.error;
  return templates.animeNews.messageListTemplate(resultNews);
};
newsById = async (kurisu) => {
  let id = kurisu.outCommandMessage;
  if (!id) return templates.messages.error;
  const resultNews = await amadeus.animeNewsById(id);
  if (!resultNews) return templates.messages.error;
  return await templates.animeNews.messageTemplate(resultNews);
};

module.exports = { animeNews, newsById };
