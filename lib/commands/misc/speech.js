const path = require("path");
const gTTS = require("gtts");
const { readFileSync, unlinkSync } = require("fs-extra");
const translatte = require("translatte");
const { messages } = require("../../templates");

const speech = async (kurisu) => {
  let text = kurisu.outCommandMessage;
  let lang = "es";
  if (text.split(" ")[0].includes("$")) {
    lang = text.split(" ")[0].replace("$", "");
    text = text.slice(text.split(" ")[0].length + 1);
  }

  let result = { text };
  try {
    result = await translatte(text, { to: lang });
  } catch (err) {
    console.log(err);
    return messages.error;
  }

  let gtts = new gTTS(result.text, lang);
  let file = path.join(__dirname, "..", "..", "..", "/temp/${Date.now()}.mp3");
  return new Promise(async (resolve, reject) => {
    gtts.save(file, function (err) {
      if (err) {
        console.log(err);
        return reject(messages.error);
      }
      const audio = readFileSync(file);
      unlinkSync(file);
      return resolve(
        messages.audioBuffer(
          audio,
          kurisu.device == "ios" ? "audio/mpeg" : "audio/mp4"
        )
      );
    });
  });
};
module.exports = speech;
