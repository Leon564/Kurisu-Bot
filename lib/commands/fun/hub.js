const { imageDownloadAndResize } = require("../../tools");
const { messages } = require("../../templates");
const hub = async (kurisu) => {  
  const logohub = await imageDownloadAndResize(    
    `https://logohub.appspot.com/${kurisu.args[0] || "Fun"}-${kurisu.args[1] || "Hub"}.png`
  );
  if (logohub) return messages.imageBuffer(logohub);
  return messages.error;
};

module.exports = hub;
