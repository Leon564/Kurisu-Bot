const scrape = require("scrape-yt");
const ytmp3 = require("youtube-mp3-downloader");
const path = require("path");
const fs = require("fs");
const { rmSync, readFileSync } = require("fs-extra");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

async function youtubeMp3(kurisu) {
  const scraping = await scrape.search(kurisu.outCommandMessage, {
    type: "video",
    limit: 5,
  });
  const video = scraping.filter((vid) => vid.duration < 600)[0];
  if (!!!video) return await callback("error");
  const videoid = video.id;
  let dir = path.join(__dirname, "..", "..", "..", "temp", "song-");
  let tempdir = fs.mkdtempSync(dir);

  const downloadOptions = {
    outputPath: tempdir,
    youtubeVideoQuality: "highestaudio",
    queueParallelism: 2,
    progressTimeout: 2000,
    allowWebm: false,
  };

  return new Promise(async (resolve, reject) => {
    const downloader = new ytmp3(downloadOptions, video.title + ".mp3");
    downloader.on("error", async function (err) {
      console.log(err);
      return reject({ text: "error" });
    });
    downloader.on("progress", async function (p) {
      process.stdout.write("\033c");
      console.log(
        `song msg: ${video.title} \nProgress:${p.progress.percentage}%`
      );
    });

    downloader.download(videoid);
    downloader.on("finished", async function (err, data) {
      if (data.file) {
        const song = readFileSync(data.file);
        rmSync(tempdir, { recursive: true });
        return resolve([
          {
            audio: song,
            mimetype: kurisu.device == "ios" ? "audio/mpeg" : "audio/mp4",
          },
          {
            quoted: {
              key: { participant: kurisu.botId },
              message: { conversation: video.title },
            },
          },
        ]);
      }
    });
  });
}

module.exports = youtubeMp3;
