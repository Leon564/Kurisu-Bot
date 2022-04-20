const { prefix } = require("../config");
const makeWASocket = require("@adiwajshing/baileys");
module.exports = (m) => {
  let messageType = Object.keys(m.message)[0];
  let device = makeWASocket.getDevice(m.key.id);
  let messageTimeStamp = m.messageTimestamp;
  let message = null;
  let lowerMessage = null;
  let outCommandMessage = null;
  let outPrefixMessage = null;
  let outPrefixMessageLower = null;
  let args = null;
  let media = null;
  let mediaType = null;
  let canonicalUrl = null;
  let mentions = null;
  let command = null;
  let outCommandMessageLower = null;
  let isCommand = null;
  let from = m.key.remoteJid;
  const isGroup = from.includes("g.us");

  if (messageType == "conversation") {
    message = m.message.conversation;
  } else if (messageType == "imageMessage") {
    message = m.message.imageMessage.caption;
    media = m.message.imageMessage;
    mediaType = "image";
  } else if (messageType == "videoMessage") {
    message = m.message.videoMessage.caption;
    media = m.message.videoMessage;
    mediaType = "video";
  } else if (messageType == "stickerMessage") {
    media = m.message.stickerMessage;
    mediaType = "sticker";
  } else if (
    messageType == "listResponseMessage" ||
    messageType == "messageContextInfo"
  ) {
    if (m.message.listResponseMessage) {
      message = m.message.listResponseMessage.singleSelectReply.selectedRowId;
    }
  } else if (messageType == "buttonsResponseMessage") {
    message = m.message.buttonsResponseMessage.selectedButtonId;
  } else if (messageType == "messageContextInfo") {
    message = m.message.buttonsResponseMessage
      ? m.message.buttonsResponseMessage.selectedButtonId
      : "";
  } else if (messageType == "extendedTextMessage") {
    message = m.message.extendedTextMessage.text;

    canonicalUrl = m.message.extendedTextMessage.canonicalUrl
      ? m.message.extendedTextMessage.canonicalUrl
      : false;

    if (m.message.extendedTextMessage.contextInfo) {
      if (
        m.message.extendedTextMessage.contextInfo &&
        m.message.extendedTextMessage.contextInfo.mentionedJid
      ) {
        mentions = m.message.extendedTextMessage.contextInfo.mentionedJid;
      }
      if (m.message.extendedTextMessage.contextInfo.quotedMessage) {
        messageType = Object.keys(
          m.message.extendedTextMessage.contextInfo.quotedMessage
        )[0];

        if (
          m.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage
        ) {
          media =
            m.message.extendedTextMessage.contextInfo.quotedMessage
              .stickerMessage;
          messageType = "stickerMessage";
          mediaType = "sticker";
        }
        if (
          m.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage
        ) {
          media =
            m.message.extendedTextMessage.contextInfo.quotedMessage
              .imageMessage;
          messageType = "imageMessage";
          mediaType = "image";
        }
        if (
          m.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage
        ) {
          media =
            m.message.extendedTextMessage.contextInfo.quotedMessage
              .videoMessage;
          messageType = "videoMessage";
          mediaType = "video";
        }
      }
    }
  }

  lowerMessage = message ? message.toLocaleLowerCase() : null;
  outPrefixMessage = message ? message.replace(prefix, "") : null;
  outPrefixMessageLower = outPrefixMessage
    ? outPrefixMessage.toLocaleLowerCase()
    : null;
  command = lowerMessage ? lowerMessage.split(" ")[0].slice(1) : null;
  outCommandMessageLower = lowerMessage
    ? lowerMessage.substring(command.length + 2)
    : null;
  outCommandMessage = message
    ? message.slice(message.split(" ")[0].length + 1)
    : null;
  args = outCommandMessage ? outCommandMessage.split(" ") : null;
  args = args ? args.filter((arg) => arg !== "") : [];
  isCommand = lowerMessage ? lowerMessage.startsWith(prefix) : null;

  return {
    messageType,
    message,
    media,
    mentions,
    outPrefixMessage,
    outPrefixMessageLower,
    outCommandMessage,
    outCommandMessageLower,
    lowerMessage,
    command,
    args,
    canonicalUrl,
    from,
    isGroup,
    isCommand,
    mediaType,
    device,
    messageTimeStamp,
  };
};
