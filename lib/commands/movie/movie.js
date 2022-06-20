const { amadeus } = require("../../providers");
const templates = require("../../templates");

const movieByName = async (kurisu) => {
  const movie = await amadeus.movieByName(kurisu.outCommandMessage);
  if (!movie) return templates.messages.errorNoResults;
  if (movie.total_results > 1)
    return templates.movie.messageListTemplate(movie.results);

  return templates.movie.messageTemplate(movie.results[0]);
};

movieById = async (kurisu) => {
  const id = kurisu.outCommandMessage;
  const movie = await amadeus.movieById(id.split("-")[1], id.split("-")[0]);
  if (movie) {
    return templates.movie.messageTemplate(movie);
  }
  return templates.messages.errorNoResults;
};

module.exports = { movieByName, movieById };
