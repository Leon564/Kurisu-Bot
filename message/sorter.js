const { prefix } = require("../config");
const makeWASocket = require("@adiwajshing/baileys");

const sorter = (m) => {
  const content = {
    message: null,
    messageContent: null,
    canonicalUrl: null,
    mentions: null,
    command: null,
    outCommandMessage: null,
    outCommandMessageLower: null,
    isCommand: null,
    from: null,
    participant: null,
    isGroup: null,
    messageTimeStamp: null,
    messageType: null,
    mediaType: null,
    device: null,
    lowerMessage: null,
    outPrefixMessage: null,
    outPrefixMessageLower: null,
    args: null,
  };

  content.messageTimeStamp = m.messageTimestamp;
  content.messageType = Object.keys(m.message)[0];
  content.device = makeWASocket.getDevice(m.key.id);
  content.from = m.key.remoteJid;
  content.participant = m.key?.participant?.includes(":")
    ? `${m.key.participant.split(":")[0]}@s.whatsapp.net`
    : m.key?.participant;
  content.isGroup = m.key.remoteJid.includes("g.us");

  switch (content.messageType) {
    case "conversation":
      content.message = m.message.conversation;
      break;
    case "imageMessage":
      content.message = m.message.imageMessage.caption;
      content.messageContent = m;
      content.mediaType = "image";
      break;
    case "videoMessage":
      content.message = m.message.videoMessage.caption;
      content.messageContent = m;
      content.mediaType = "video";
      break;
    case "stickerMessage":
      content.messageContent = m;
      content.mediaType = "sticker";
      break;
    case "listResponseMessage":
    case "messageContextInfo":
      content.message = m.message.buttonsResponseMessage;
      if (m.message.listResponseMessage) {
        content.message =
          m.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
      }
      if (m.message.buttonsResponseMessage) {
        content.message = m.message?.buttonsResponseMessage?.selectedButtonId;
      }
      break;
    case "buttonsResponseMessage":
      content.message = m.message.buttonsResponseMessage.selectedButtonId;
      break;
    case "extendedTextMessage":
      content.message = m.message.extendedTextMessage?.text;
      content.canonicalUrl = m.message.extendedTextMessage?.canonicalUrl;
      content.mentions =
        m.message.extendedTextMessage?.contextInfo?.mentionedJid;

      if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
        content.messageType = Object.keys(
          m.message.extendedTextMessage.contextInfo.quotedMessage
        )[0];
        switch (content.messageType) {        
          case "imageMessage":
            content.messageContent = {
              message: {
                ...m.message.extendedTextMessage?.contextInfo?.quotedMessage,
              },
            };
            content.messageType = "imageMessage";
            content.mediaType = "image";
            break;
          case "videoMessage":
            content.messageContent = {
              message: {
                ...m.message.extendedTextMessage?.contextInfo?.quotedMessage,
              },
            };
            content.messageType = "videoMessage";
            content.mediaType = "video";
            break;
          case "stickerMessage":
            content.messageContent = {
              message: {
                ...m.message.extendedTextMessage?.contextInfo?.quotedMessage,
              },
            };
            content.messageType = "stickerMessage";
            content.mediaType = "sticker";
            break;
          case "documentMessage":
            content.mediaType =
              m.message.extendedTextMessage.contextInfo.quotedMessage?.documentMessage?.mimetype?.split(
                "/"
              )[0];
            content.messageType = "documentMessage";
            content.messageContent = {
              message: {
                ...m.message.extendedTextMessage.contextInfo.quotedMessage,
              },
            };

            break;
        }
      }
      break;
  }

  content.lowerMessage = content.message?.toLowerCase();
  content.outPrefixMessage = content.message?.replace(prefix, "");
  content.outPrefixMessageLower = content.lowerMessage?.replace(prefix, "");
  content.isCommand = content.message?.startsWith(prefix);
  content.command = content.isCommand
    ? content.outPrefixMessageLower.split(' ')[0]
    : null;  
  content.outCommandMessage = content.message?.slice(
    content.message.split(" ")[0].length + 1
  );
  content.args = content.outCommandMessage?.split(" ");
  content.outCommandMessageLower = content.outCommandMessage?.toLowerCase();

  return content;
};

module.exports = sorter;
