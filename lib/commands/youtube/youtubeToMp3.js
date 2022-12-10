const ytdl = require("ytdl-core");
const templates = require("../../templates");
const got = require("got");
const { search } = require("./youtubeSearch");

const youtubeToMp4Stream = async (id, kurisu) => {
  console.log(id);
  const info = await ytdl.getInfo(id);

  const format = ytdl.chooseFormat(info.formats, {
    filter: "audioonly",
    quality: "highestaudio",
    format: "mp4",
  });
  console.log("enviando");
  return {
    audio: { stream: got.stream(format.url) },
    mimetype: kurisu.device == "ios" ? "audio/mpeg" : "audio/mp4",
    ptt: false,
  };
};

const stream = async (kurisu) => {
  const regExp = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  const q = kurisu.outCommandMessage;
  if (!q) return templates.messages.errorNoVideoName;
  const result = await search(kurisu).catch((err) => {
    return null;
  });

  if (!result) return templates.messages.errorNoVideo;
  return youtubeToMp4Stream(result[0].id, kurisu);
};

module.exports = stream;
