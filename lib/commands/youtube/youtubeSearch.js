const scrape = require("scrape-yt");
const templates = require("../../templates");

const youtubeSearch = async (kurisu, duration) => {
  return new Promise(async (resolve, reject) => {
    const scraping = await scrape.search(kurisu.outCommandMessage, {
      type: "video",
      limit: 5,
    });

    if (!scraping[0]) reject(null);
    let videos = scraping.filter((vid) => vid.duration < duration);
    if (videos.length < 1) reject(null);
    videos = videos.map((x) => ({
      title: x.title,
      thumbnail: x.thumbnail,
      url: `https://www.youtube.com/watch?v=${x.id}`,
      id: x.id,
      channel: x.channel.name,
    }));
    resolve(videos);
  });
};
const musicSearch = async (kurisu) => {
  return youtubeSearch(kurisu, 600).then((videos) => {
    if (!videos) return templates.messages.error;
    return templates.youtube.buttonMessage(videos, kurisu.outCommandMessage);
  });
};

module.exports = {
  musicSearch: (kurisu) => musicSearch(kurisu),
  search: (kurisu) => youtubeSearch(kurisu, 1800),
};
