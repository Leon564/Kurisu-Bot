const lyric = require("lyrics");
const { messages } = require("../../templates");

const lyrics = async (kurisu) => {
  if (kurisu.outCommandMessage.length < 1) return messages.errorNoSongName;
  return lyric(kurisu.outCommandMessage).then((song) => {
    if (!song) return messages.errorNoResults;
    return messages.text(`*${song.title}*\n${song.artist}\n\n${song.lyrics}`);
  });
};

module.exports = lyrics;
