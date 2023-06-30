import { Injectable } from '@nestjs/common';
import { CommandName } from 'src/domain/enums/command-name.enum';
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

    if (this.testPattern(CommandName.PING, text)) {
      return this.ping(payload);
    }

    if (this.testPattern(CommandName.HELP, text)) {
      return this.help(payload);
    }

    if (this.testPattern(CommandName.STICKER, text)) {
      return this.sticker(payload);
    }

    if (this.testPattern(CommandName.INSULT, text)) {
      return this.insult(payload);
    }

    if (this.testPattern(CommandName.GPT, text)) {
      return this.chat(payload);
    }

    if (this.testPattern(CommandName.PHRASE, text)) {
      return this.phrase(payload);
    }

    if (this.testPattern(CommandName.GREETING, text)) {
      return this.greeting(payload);
    }
    return undefined;
  }

  private testPattern(pattern: string, text: string): boolean {
    const validator = new RegExp(`${pattern}\\b`, 'gi');
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
      '*!hola*: _Recibe un saludo, o no..._',
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
    const { conversationId, message } = payload;
    const insults = await this.firebaseService.getInsults();
    const index = random({ min: 0, max: insults.length - 1, integer: true });
    const { mentions } = message;
    const people = mentions?.map((item) => '@' + item?.split('@')[0]);
    const text = `${people.join(' ')} ${insults[index]}`.trim();
    if (!text) return undefined;
    return {
      content: {
        conversationId,
        type: MessageResponseType.text,
        text,
        mentions,
      },
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
    const prompt = text?.replace(/^[^\s]+/, '').trim();
    const isConversationNumber = whitelist?.includes(payload.userNumber);

    if (isConversationNumber) {
      const response = await this.chatService.send(prompt);
      return {
        content: {
          conversationId,
          type: MessageResponseType.text,
          text: response,
        },
      };
    }
    return {
      content: {
        conversationId,
        type: MessageResponseType.text,
        text: 'No tienes acceso a este comando',
      },
      options: { quoted: true },
    };
  }

  private async greeting(payload: RequestMessage): Promise<ResponseMessage> {
    const { conversationId } = payload;
    const phrases = await this.firebaseService.getGreetings();
    const index = random({ min: 0, max: phrases.length - 1, integer: true });
    const text = phrases[index];
    if (!text) return undefined;
    return {
      content: { conversationId, type: MessageResponseType.text, text },
    };
  }
}
