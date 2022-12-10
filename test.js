const ytdl = require("ytdl-core");
const templates = require("./lib/templates");
const got = require("got");
const { search } = require("./lib/commands/youtube/youtubeSearch");

const youtubeToMp4Stream = async (id) => {
  console.log(id);
  const info = await ytdl.getInfo(id);
  console.log({info:info.formats});
  const format = ytdl.chooseFormat(info.formats, {
    filter: "audioonly",
    quality: "highestaudio",
  });
  console.log({format});
  return {
    video: { stream: got.stream(format.url) },
  };
};

const stream = async (url) => {
  const regExp = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  ///const q = kurisu.outCommandMessage;
  //if (!q) return templates.messages.errorNoVideoName;
  const result = await search({ outCommandMessage: url }).catch((err) => {
    return null;
  });

  //if (!result) return templates.messages.errorNoVideo;
  if (result.length === 1 || regExp.test(url))
    return youtubeToMp4Stream(result[0].id);

  return result;
  //return templates.youtube.listMessage(result, q);
};

stream(
  "https://www.youtube.com/watch?v=xIKW3NKYBWw&ab_channel=MAPPACHANNEL"
).then((result) => {
  console.log({result});
});
