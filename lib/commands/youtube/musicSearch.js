const scrape = require("scrape-yt");
const templates = require("../../templates");
const musicSearch = async (kurisu) => {
  return new Promise(async (resolve, reject) => {
    const scraping = await scrape.search(kurisu.outCommandMessage, {
      type: "video",
      limit: 5,
    });
    if (!scraping[0]) reject({ text: "error" });
    let videos = scraping.filter((vid) => vid.duration < 600);
    if (videos.length < 1) reject({ text: "error" });
    videos = videos.map((x) => ({
      title: x.title,
      thumbnail: x.thumbnail,
      id: "https://www.youtube.com/watch?v=" + x.id,
    }));
    return resolve(templates.youtube(videos, kurisu.outCommandMessage));
  });
};

module.exports = musicSearch;
