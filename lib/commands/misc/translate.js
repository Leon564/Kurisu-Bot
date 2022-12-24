const translatte = require("translatte");
const languajes = require("translatte/languages.js");

async function translate({ outCommandMessage }) {
    let lang = "es"
    let message = outCommandMessage;
    if (outCommandMessage.split(" ")[0].startsWith("$")) {
        lang = outCommandMessage.split(" ")[0].replace("$", "")
        message = outCommandMessage.replace(outCommandMessage.split(" ")[0], "")
    }
  var result = "";
  await translatte(message, { to: lang })
    .then((res) => {
      result = "Traduccion a " + languajes[lang.toLowerCase()] + ": " + res.text;
    })
    .catch((err) => {
      result = err.message;
    });
  return {text: result};
}

module.exports = translate;
