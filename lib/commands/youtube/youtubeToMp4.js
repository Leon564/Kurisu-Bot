const ytdl = require("ytdl-core");
const templates = require("../../templates");
const got = require("got");
const { search } = require("./youtubeSearch");

const youtubeToMp4Stream = async (id) => {
  console.log(id);
  const info = await ytdl.getInfo(id);

  const format = ytdl.chooseFormat(info.formats, {
    filter: "audioandvideo",
    quality: "highestvideo",
  });

  return {
    video: { stream: got.stream(format.url) },
  };
};

const stream = async (kurisu) => {
  const regExp = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  const q = kurisu.outCommandMessage;
  const result = await search(kurisu).catch((err) => {
    return null;
  });

  if (!result) return templates.messages.error;
  if (result.length === 1 || regExp.test(q))
    return youtubeToMp4Stream(result[0].id);

  return templates.youtube.listMessage(result, q);
};

module.exports = stream;
