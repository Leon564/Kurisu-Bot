const makeWASocket = require("@adiwajshing/baileys");
const mediaMessageToBuffer = async (kurisu) => {
  const buffer = await makeWASocket
    .downloadMediaMessage(
      kurisu.messageContent,
      "buffer",
      {},
      {
        reuploadRequest: kurisu.updateMediaMessage,
      }
    )
    .catch((err) => {
      console.log(err);
      return null;
    });
  return buffer;
};
module.exports = mediaMessageToBuffer;
