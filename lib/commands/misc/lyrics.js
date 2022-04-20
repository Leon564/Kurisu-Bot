const lyric = require("lyrics");
const lyrics = async (kurisu) => {
  if (kurisu.outCommandMessage.length < 1)
    return { text: "Ingrese el nombre de alguna cancion" };
  return lyric(kurisu.outCommandMessage).then((song) => {
    if (!song) return { text: "No se encontraron resultados" };
    return {
      text: `*${song.title}*\n${song.artist}\n\n${song.lyrics}`,
    };
  });
};

module.exports = lyrics;
