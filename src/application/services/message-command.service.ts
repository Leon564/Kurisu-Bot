import { Injectable } from '@nestjs/common';
import { Command_Name } from 'src/domain/enums/command-name.enum';
import { MessageResponseType } from 'src/domain/enums/message-response-type.enum';
import { MessageType } from 'src/domain/enums/message-type.enum';
import { RequestMessage } from 'src/domain/types/request-message.type';
import { ResponseMessage } from 'src/domain/types/response-message.type';
import { ChatService } from './chat.service';
import { FirebaseService } from './firebase.service';
import { MediaService } from './media.service';
import * as random from 'random-number';
import { StickerService } from './sticker.service';

@Injectable()
export class MessageCommandService {
  constructor(
    private firebaseService: FirebaseService,
    private chatService: ChatService,
    private mediaService: MediaService,
    private stickerService: StickerService,
  ) {}

  async handle(payload: RequestMessage): Promise<any> {
    const text = payload?.message?.text || '';

    if (payload?.fromMe) return undefined;

    if (this.testPattern(Command_Name.PING, text)) {
      return this.ping(payload);
    }

    if (this.testPattern(Command_Name.HELP, text)) {
      return this.help(payload);
    }

    if (this.testPattern(Command_Name.STICKER, text)) {
      return this.sticker(payload);
    }

    if (this.testPattern(Command_Name.INSULT, text)) {
      return this.insult(payload);
    }

    if (this.testPattern(Command_Name.CHAT, text)) {
      return this.chat(payload);
    }

    if (this.testPattern(Command_Name.PHRASE, text)) {
      return this.phrase(payload);
    }
    return undefined;
  }

  private escapeRegExp(pattern: string): string {
    return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private testPattern(pattern: string, text: string): boolean {
    const escapedPattern = this.escapeRegExp(pattern);
    const validator = new RegExp(escapedPattern, 'gi');
    return validator.test(text);
  }

  private ping(payload: RequestMessage): ResponseMessage {
    const { conversationId } = payload;
    return {
      content: {
        conversationId,
        type: MessageResponseType.text,
        text: 'pong 🏓',
      },
    };
  }

  private help(payload: RequestMessage): ResponseMessage {
    const { conversationId } = payload;
    const commands = [
      '*!ping*: _Envia una respuesta del servidor._',
      '*!help*: _Muestra el menu de commandos._',
      '*!sticker*: _Convierte cualquier imagen, gif, video en sticker._',
      '*!chat*: _Puedes conversar con chatgpt, (necesitas pedir acceso)(beta)._',
      '*!insult*: _Envia un instulto a la persona que mencionas._',
      '*!frase*: _Envia una frase de algun anime._',
    ].join(`\n`);
    const text = `⌘⌘⌘⌘⌘ *MENU* ⌘⌘⌘⌘⌘\n\n${commands}\n\n⌘⌘⌘⌘⌘⌘⌘⌘⌘⌘⌘⌘⌘⌘`;
    return {
      content: { conversationId, type: MessageResponseType.text, text },
      options: { quoted: true, reaction: '🤖' },
    };
  }

  private async sticker(payload: RequestMessage): Promise<ResponseMessage> {
    const { conversationId, message } = payload;
    if (!payload.message.media) return undefined;
    if (
      payload.message.type === MessageType.image ||
      payload.message.type === MessageType.video
    ) {
      const media = await this.stickerService.sticker(message.media);
      return {
        content: { conversationId, type: MessageResponseType.sticker, media },
      };
    }
    return undefined;
  }

  private async insult(payload: RequestMessage): Promise<ResponseMessage> {
    const { conversationId } = payload;
    const phrases = await this.firebaseService.getPhrases();
    const index = random({ min: 0, max: phrases.length - 1, integer: true });
    const text = phrases[index];
    if (!text) return undefined;
    return {
      content: { conversationId, type: MessageResponseType.text, text },
    };
  }
  private async phrase(payload: RequestMessage): Promise<ResponseMessage> {
    const { conversationId, message } = payload;
    const { mentions } = message;
    const people = mentions?.map((item) => '@' + item?.split('@')[0]);
    const insults = await this.firebaseService.getInsults();
    const index = random({ min: 0, max: insults.length - 1, integer: true });
    const text = `${insults[index]} ${people.join(' ')}`;
    if (!text) return undefined;
    return {
      content: {
        conversationId,
        type: MessageResponseType.text,
        text,
        mentions,
      },
      options: { quoted: true },
    };
  }

  private async chat(payload: RequestMessage): Promise<ResponseMessage> {
    const { conversationId, message } = payload;
    const text = message?.text || '';
    const whitelist: string[] = await this.firebaseService.getWhiteList();
    const [conversationNumber] = payload?.conversationId?.split('@');
    const [userNumber] = payload?.userId?.split('@');
    const prompt = text?.replace(Command_Name.CHAT, '').trim();
    const isConversationNumber = whitelist?.includes(conversationNumber);
    const isUserNumber = whitelist?.includes(userNumber);
    if (isConversationNumber || isUserNumber) {
      const response = await this.chatService.send(prompt);
      return {
        content: {
          conversationId,
          type: MessageResponseType.text,
          text: response,
        },
      };
    }
    return undefined;
  }
}
