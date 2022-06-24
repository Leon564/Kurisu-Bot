const { amadeus } = require("../../providers");
const {messages}=require("../../templates"); 
const WebShot = async (kurisu) => {
  const fullpage = kurisu.outCommandMessage.includes("$full");
  let url = kurisu.outCommandMessage
    .replace(/[$]full/gi, "")
    .replace(/ /gi, "");
  url = url.includes("www.") ? url : `www.${url}`;
  url = url.includes("http") ? url : `https://${url}`;
  let result = await amadeus.webShot(url, fullpage);
  if (!result) return messages.error;  
  return messages.imageUrl(result);
};

module.exports = WebShot;
