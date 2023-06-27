import { proto } from "@whiskeysockets/baileys";
import {
  BaileysSocket,
  MessageData,
  SendData
} from "../../shared/interfaces/types";
import { MessageMapper } from "../../shared/infrastructure/baileys/baileys.mapper";
import { commands } from "./commands";

class commandHandler {
  constructor(
    private socket: BaileysSocket,
    private message: proto.IWebMessageInfo,
    private messageData: MessageData
  ) {}

  static async start(socket: BaileysSocket, message: proto.IWebMessageInfo) {
    const messageData = MessageMapper.toDomain({ data: message, socket });
    if (!messageData.message.command) return;
    const handler = new commandHandler(socket, message, messageData);
    return handler.messageHandler();
  }

  async messageHandler() {
    const { messageData, socket, message } = this;
    if (messageData.message.isCommand) {
      await socket.sendPresenceUpdate("composing", messageData.userId);
      const reply = await commands.execute(messageData);
      if (reply) await this.sendReply(reply);
      await socket.sendPresenceUpdate("paused", messageData.userId);
    }
  }

  async sendReply(data: SendData) {
    const { userId, device, socket } = this.messageData;

    //quoting
    let quoted: any = data.quoted ? { quoted: this.message } : {};
    if (data.fakeQuoted) {
      quoted = MessageMapper.replyFakeMessage({
        text: data.fakeQuoted || "hola",
        userId: socket.user!.id.includes(":")
          ? socket.user!.id.split(":")[0] + "@s.whatsapp.net"
          : socket.user!.id,
      });
    }

    const messageContent = MessageMapper.toSocket(data, device);
    await this.socket.sendMessage(data.userId || userId, messageContent, {
      ...quoted,
    });

    if (data.reacttion)
      await this.socket.sendMessage(userId, {
        react: { text: data.reacttion, key: this.message.key },
      });
  }

  async sendDReply(data: SendData) {
    let quoted: {} = {};
    if (data.fakeQuoted) {
      quoted = MessageMapper.replyFakeMessage({
        text: data.fakeQuoted || "hola",
      });
    }

    const messageContent = MessageMapper.toSocket(
      data,
      data.device || "Android"
    );

    await data.socket!.sendMessage(data.userId!, messageContent, { ...quoted });

    if (data.reacttion && data.messageReactKey)
      await data.socket!.sendMessage(data.userId!, {
        react: { text: data.reacttion, key: data.messageReactKey as any },
      });
  }
}

export default commandHandler;
