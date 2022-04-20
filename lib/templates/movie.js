const { prefix } = require("../../config");

const messageTemplate = (movie) => ({
  image: {
    url: movie.poster || "https://i.ibb.co/NFyxfR2/No-Image-Placeholder.png",
  },
  caption:
    "*🗡️Titulo🗡️:*" +
    movie.title +
    "\n*💠Titulo Original💠:*" +
    movie.original_title +
    "\n\n*🕘Fecha de estreno🕘:*" +
    movie.relase_date +
    "\n\n*⚔Generos⚔:*" +
    movie.genres.join("✔ ") +
    "\n\n*puntuacion:*" +
    "⭐".repeat(Math.round(movie.vote_average / 2 || 0)) +
    "\n\n*sinopsis:*" +
    movie.overview,
});

const messageListTemplate = (movies = []) => {
  let rows = movies.map((x) => ({
    title: x.title,
    rowId: `${prefix}movie $id ${x.type}-${x.id}`,
  }));
  return {
    title: "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tResultados",
    text: `Selecciona una opcion en el menu a continuacion para ver los detalles de la pelicula.`,
    footer: "Kurisu-BotV2.0.0 by Leon564",
    buttonText: "Peliculas",
    sections: [{ title: "Resultados", rows }],
  };
};

module.exports = {
  messageTemplate,
  messageListTemplate,
};
