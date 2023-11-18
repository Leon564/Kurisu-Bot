import {
  AnyMessageContent,
  DownloadableMessage,
  downloadContentFromMessage,
  getDevice,
  isJidGroup,
  proto,
  WAMessage,
} from '@whiskeysockets/baileys';
import {
  MessageBody,
  RequestMessage,
} from 'src/domain/types/request-message.type';
import { MessageType } from 'src/domain/enums/message-type.enum';
import { ResponseMessageContent } from 'src/domain/types/response-message.type';
import { getFileType } from 'src/libs/utils';
import { Stream } from 'stream';

type Nullable = undefined | null;
export type BaileysMessage = { messages: WAMessage[]; type: any };

export class SendMessageMapper {
  static async toDomain(data: BaileysMessage): Promise<RequestMessage> {
    const { messages } = data;
    const [message] = messages;

    const [userId] = message.key.remoteJid.split('@');
    let userNumber = userId;
    if (isJidGroup(message.key.remoteJid)) {
      const [participant] = message.key.participant.split('@');
      userNumber = participant;
    }

    return {
      id: message?.key?.id || '',
      conversationId: message?.key?.remoteJid || '',
      userId: message?.key?.participant || message?.key?.remoteJid || '',
      userNumber,
      device: getDevice(message?.key?.remoteJid || ''),
      fromMe: message?.key?.fromMe || false,
      userName: message?.pushName || 'user',
      message: await Message.create(message),
    };
  }

  static toSocket(data: ResponseMessageContent): AnyMessageContent {
    let media: any = {};

    if (data.media) {
      if (Buffer.isBuffer(data.media)) {
        media = data.media;
      } else if (data.media instanceof Stream) {
        media = { stream: data.media };
      } else if (typeof data.media === 'string') {
        media = { url: data.media };
      }
    }

    const commonContent = {
      caption: data?.text || '',
    };

    switch (data.type) {
      case 'text':
        return { text: data.text || '', mentions: data?.mentions };
      case 'sticker':
        return { sticker: media || Buffer.from([]) };
      case 'audio':
        return {
          audio: media || Buffer.from([]),
          mimetype: data?.mimetype || 'audio/mp4',
          ptt: data?.ptt || false,
          ...commonContent,
        };
      case 'video':
        return {
          video: media || Buffer.from([]),
          ...commonContent,
        };
      case 'image':
        return {
          image: media || Buffer.from([]),
          ...commonContent,
        };
      case 'gif':
        return {
          video: media || Buffer.from([]),
          gifPlayback: true,
          ...commonContent,
        };
    }
  }
}

class Message implements MessageBody {
  type: MessageType;
  text: string | undefined;
  media: Buffer | undefined;
  mentions: string[] = [];
  private message: proto.IMessage | Nullable;
  private isReply = false;

  private constructor(data: proto.IWebMessageInfo) {
    this.type = this.getType(data.message);
    this.text = this.getText(data.message);
    this.mentions = this.getMentions(data.message);
    this.message = data.message;
  }

  static async create(data: proto.IWebMessageInfo): Promise<Message> {
    const message = new Message(data);
    await message.downloadMedia();
    return message;
  }

  private getType(message: proto.IMessage | Nullable): MessageType {
    let type = Object.keys(message || {})[0];

    if (type === 'senderKeyDistributionMessage') {
      const keys = Object.keys(message || {});
      type = keys[keys.length - 1];
    }

    switch (type) {
      case 'conversation':
        return MessageType.text;
      case 'videoMessage':
        return MessageType.video;
      case 'imageMessage':
        return MessageType.image;
      case 'extendedTextMessage': {
        this.isReply = true;
        return this.getReplyType(message);
      }
      default:
        return MessageType.unkown;
    }
  }

  private getReplyType(message: proto.IMessage | Nullable): MessageType {
    const [type] = Object.keys(
      message?.extendedTextMessage?.contextInfo?.quotedMessage || {},
    );
    switch (type) {
      case 'conversation':
        return MessageType.text;
      case 'videoMessage':
        return MessageType.video;
      case 'imageMessage':
        return MessageType.image;
      case 'stickerMessage':
        return MessageType.sticker;
      case 'documentMessage':
        return MessageType.document;
      default:
        return MessageType.unkown;
    }
  }

  private getText(message: proto.IMessage | Nullable): string | undefined {
    if (this.isReply) return message?.extendedTextMessage?.text || '';
    switch (this.type) {
      case 'text':
        return message?.conversation || '';
      case 'video':
        return message?.videoMessage?.caption || '';
      case 'image':
        return message?.imageMessage?.caption || '';
      case 'document':
        return message?.documentMessage?.caption || '';
      default:
        return undefined;
    }
  }

  private getMentions(message: proto.IMessage | Nullable): string[] {
    if (this.isReply)
      return message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    return [];
  }

  private async downloadMedia(): Promise<void> {
    try {
      // validate type
      const validTypes = ['video', 'image', 'sticker', 'document'];

      if (!validTypes.includes(this.type)) return;

      const type = `${this.type}Message`;
      // set media message origin
      let message = <DownloadableMessage>this.message?.[type];
      if (this.isReply) {
        message = <DownloadableMessage>(
          this.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[type]
        );
      }
      // get media stream
      const stream = await downloadContentFromMessage(message, <any>this.type);
      this.media = Buffer.from([]);
      for await (const chunk of stream)
        this.media = Buffer.concat([this.media, chunk]);

      if (this.type === 'document') {
        const { mime } = await getFileType(this.media);
        this.type = mime.includes('video')
          ? MessageType.video
          : mime.includes('image')
          ? MessageType.image
          : MessageType.unkown;
      }
    } catch (err: unknown) {
      console.log({ err });
      this.media = undefined;
    }
  }
}
