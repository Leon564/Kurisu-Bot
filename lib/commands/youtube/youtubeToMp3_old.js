const scrape = require("scrape-yt");
const ytmp3 = require("youtube-mp3-downloader");
const path = require("path");
const fs = require("fs");
const { rmSync, readFileSync } = require("fs-extra");
const { messages } = require("../../templates");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

async function youtubeMp3(kurisu, m) {
  if (!kurisu.outCommandMessage) return messages.errorNoSongName;
  const scraping = await scrape.search(kurisu.outCommandMessage, {
    type: "video",
    limit: 5,
  });
  const video = scraping.filter((vid) => vid.duration < 600)[0];
  if (!!!video) return messages.errorNoSong;
  const videoid = video.id;
  let dir = path.join(__dirname, "..", "..", "..", "temp", "song-");
  let tempdir = fs.mkdtempSync(dir);

  const downloadOptions = {
    outputPath: tempdir,
    youtubeVideoQuality: "highestaudio",
    queueParallelism: 1,
    progressTimeout: 2000,
    allowWebm: false,
  };

  return new Promise(async (resolve, reject) => {
    const downloader = new ytmp3(downloadOptions, video.title + ".mp3");
    downloader.on("error", async function (err) {
      console.log(err);
      return reject(messages.error);
    });
    downloader.on("progress", async function (p) {
      process.stdout.write("\033c");
      console.log(
        `song msg: ${video.title} \nProgress:${p.progress.percentage}%\n${p.progress.speed} kbps`
      );
    });

    downloader.download(videoid);
    downloader.on("finished", async function (err, data) {
      if (data.file) {
        const song = readFileSync(data.file);
        rmSync(tempdir, { recursive: true });

        const message = async () => {
          await kurisu.sendMessage(
            kurisu.from,
            {
              audio: song,
              mimetype: kurisu.device == "ios" ? "audio/mpeg" : "audio/mp4",
            },
            {
              quoted: {
                key: { participant: kurisu.botId },
                message: { conversation: video.title },
              },
            }
          );
          await kurisu.sendMessage(kurisu.from, {
            react: { text: "🎶", key: m.key },
          });
        };

        return resolve(message());
      }
    });
  });
}

module.exports = youtubeMp3;
