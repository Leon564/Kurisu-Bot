const { prefix } = require("../../config");

const messageTemplate = (anime) => ({
  image: { url: anime.poster },
  caption:
    "\n*🗡️Titulo🗡️:* " +
    anime.title +
    "\n\n*🕘Año de estreno🕘:* " +
    anime.relase_date +
    "\n\n*⚔Generos⚔:* " +
    anime.genres.join("✔ ") +
    "✔\n\n*💠Episodios💠:* " +
    anime.episodes +
    "\n*puntuacion:*" +
    "⭐".repeat(Math.round(anime.vote_average / 2 || 0)) +
    "\n\n*Estado:* " +
    anime.state +
    "✅  *Tipo:* " +
    anime.type +
    "✅\n\n*Puedes verlo en:* " +
    anime.url +
    "\n\n*Sinopsis:* " +
    anime.about,
});

const messageListTemplate = (animes) => {
  let rows = animes.map((x) => ({
    title: x.title,
    rowId: prefix + "animeid " + x.id,
  }));
  return {
    title: "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tResultados",
    text: `Selecciona una opcion en el menu a continuacion para ver los detalles del anime.`,
    footer: "Kurisu-BotV2.0.0 by Leon564",
    buttonText: "Animes",
    sections: [{ title: "Resultados", rows }],
  };
};

module.exports = {
  messageTemplate,
  messageListTemplate,
};
