module.exports = (m) => {
  let messageType = Object.keys(m.message)[0];

  let message = null;
  let lowerMessage = null;
  let outPrefixMessage = null;
  let args = null;
  let media = null;
  let canonicalUrl = null;
  let mentions = null;
  let command = null;

  var from = m.key.remoteJid;
  const isGroup = from.includes("g.us");

  if (messageType == "conversation") {
    message = m.message.conversation;
  } else if (messageType == "imageMessage") {
    message = m.message.imageMessage.caption;
    media = m.message.imageMessage;
  } else if (messageType == "videoMessage") {
    message = m.message.videoMessage.caption;
    media = m.message.videoMessage;
  } else if (messageType == "stickerMessage") {
    media = m.message.stickerMessage;
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
        }
      }
    }
  }
  lowerMessage = message ? message.toLocaleLowerCase() : null;
  command = lowerMessage ? lowerMessage.split(" ")[0].slice(1) : null;
  outPrefixMessageLower = lowerMessage
    ? lowerMessage.substring(command.length + 2)
    : null;
  outPrefixMessage = message
    ? message.slice(message.split(" ")[0].length + 1)
    : null;
  args = outPrefixMessage ? outPrefixMessage.split(" ") : null;

  return {
    messageType,
    message,
    media,
    mentions,
    outPrefixMessage,
    outPrefixMessageLower,
    lowerMessage,
    command,
    args,
    canonicalUrl,
    from,
    isGroup,
  };
};
