const translatte = require("translatte");
const languajes = require("translatte/languages.js");

async function translate({ outCommandMessage, messageContent }) { 
  let lang = "es";
  let message = outCommandMessage;
  if (outCommandMessage.split(" ")[0].startsWith("$")) {
    lang = outCommandMessage.split(" ")[0].replace("$", "");
    message = outCommandMessage.replace(outCommandMessage.split(" ")[0], "");
  }
  
  message =  message || messageContent?.message?.conversation ;
  if (!message || message.trim() == "")
    return { text: "No hay nada que traducir." };
  var result = "";
  await translatte(message, { to: lang })
    .then((res) => {
      result =
        "*Traduccion a " + languajes[lang.toLowerCase()] + ":*\n" + res.text;
    })
    .catch((err) => {
      result = err.message;
    });
  return { text: result };
}

module.exports = translate;
