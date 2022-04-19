const makeWASocket = require("@adiwajshing/baileys");
const mediaMessageToBuffer = async (media, mediaType) => {
  stream = await makeWASocket.downloadContentFromMessage(media, mediaType);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  return buffer;
};
module.exports = mediaMessageToBuffer;
