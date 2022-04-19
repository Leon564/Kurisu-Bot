const { imageDownloadAndResize } = require("../../tools");
const hub = async (kurisu) => {  
  const logohub = await imageDownloadAndResize(    
    `https://logohub.appspot.com/${kurisu.args[0] || "Fun"}-${kurisu.args[1] || "Hub"}.png`
  );
  if (logohub) return { image: logohub };
  return { text: "No pude completar la opracion." };
};

module.exports = hub;
