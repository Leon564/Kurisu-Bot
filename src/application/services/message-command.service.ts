import { Injectable } from '@nestjs/common';
import { CommandName } from 'src/domain/enums/command-name.enum';
import { MessageResponseType } from 'src/domain/enums/message-response-type.enum';
import { MessageType } from 'src/domain/enums/message-type.enum';
import { RequestMessage } from 'src/domain/types/request-message.type';
import { ResponseMessage } from 'src/domain/types/response-message.type';
import { ChatService } from './chat.service';
import { FirebaseService } from './firebase.service';
import * as random from 'random-number';
import { StickerService } from './sticker.service';
import { RemoveBgService } from './remove-bg.service';
import { YoutubeService } from './youtube.service';
import { MenuService } from './menu.service';
import { MiscService } from './misc.service';
import { handleOptions } from 'src/domain/types/handle-options.type';

@Injectable()
export class MessageCommandService {
  constructor(
    private firebaseService: FirebaseService,
    private chatService: ChatService,
    private stickerService: StickerService,
    private removeBgService: RemoveBgService,
    private youtubeService: YoutubeService,
    private menuService: MenuService,
    private miscService: MiscService,
  ) {}

  async handle(payload: RequestMessage, options: handleOptions): Promise<any> {
    const text = payload?.message?.text || '';

    if (payload?.fromMe) return undefined;

    if (this.testPattern(CommandName.PING, text)) {
      options.setPresence('composing');
      return this.ping(payload);
    }

    if (this.testPattern(CommandName.HELP, text)) {
      options.setPresence('composing');
      return this.help(payload);
    }

    if (this.testPattern(CommandName.STICKERBG, text)) {
      options.setPresence('composing');
      return this.stickerbg(payload);
    }

    if (this.testPattern(CommandName.STICKER, text)) {
      options.setPresence('composing');
      return this.sticker(payload);
    }

    if (this.testPattern(CommandName.INSULT, text)) {
      options.setPresence('composing');
      return this.insult(payload);
    }

    if (this.testPattern(CommandName.GPT, text)) {
      options.setPresence('composing');
      return this.chat(payload);
    }

    if (this.testPattern(CommandName.PHRASE, text)) {
      options.setPresence('composing');
      return this.phrase(payload);
    }

    if (this.testPattern(CommandName.GREETING, text)) {
      options.setPresence('composing');
      return this.greeting(payload);
    }

    if (this.testPattern(CommandName.MUSIC, text)) {
      options.setPresence('recording');
      return this.music(payload);
    }

    if (this.testPattern(CommandName.VIDEO, text)) {
      options.setPresence('composing');
      return this.video(payload);
    }

    if (this.testPattern(CommandName.GIF, text)) {
      options.setPresence('composing');
      return this.gif(payload);
    }

    if (this.testPattern(CommandName.IMAGE, text)) {
      options.setPresence('composing');
      return this.image(payload);
    }

    if (this.testPattern(CommandName.ROLL, text)) {
      options.setPresence('composing');
      return this.roll(payload);
    }

    if (this.testPattern(CommandName.LYRICS, text)) {
      options.setPresence('composing');
      return this.lyrics(payload);
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
    const text = this.menuService.getMenu();
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
      const text = message.text?.replace(/^[^\s]+/, '').trim();
      const parts = text
        .split('$')
        .map((part) => part.trim())
        .filter((part) => part !== '');

      const validTypes = ['full', 'crop', 'circle'];
      const type = validTypes.includes(parts[0]?.toLowerCase())
        ? parts.shift()
        : null;
      const packname = parts.shift() || null;
      const author = parts.shift() || null;

      const media = await this.stickerService.sticker(message.media, {
        type,
        packname,
        author,
      });
      return {
        content: { conversationId, type: MessageResponseType.sticker, media },
      };
    }
    return undefined;
  }

  private async stickerbg(payload: RequestMessage): Promise<ResponseMessage> {
    const { conversationId, message } = payload;
    if (!payload.message.media) return undefined;
    if (payload.message.type === MessageType.image) {
      const text = message.text?.replace(/^[^\s]+/, '').trim();
      const parts = text
        .split('$')
        .map((part) => part.trim())
        .filter((part) => part !== '');

      const validTypes = ['full', 'crop', 'circle'];
      const type = validTypes.includes(parts[0]?.toLowerCase())
        ? parts.shift()
        : null;
      const packname = parts.shift() || null;
      const author = parts.shift() || null;

      const media = await this.removeBgService.removeBg(message.media);
      const sticker = await this.stickerService.sticker(media, {
        type,
        packname,
        author,
      });
      return {
        content: {
          conversationId,
          type: MessageResponseType.sticker,
          media: sticker,
        },
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
    const { conversationId } = payload;
    const phrases = await this.firebaseService.getPhrases();
    const index = random({ min: 0, max: phrases.length - 1, integer: true });
    const text = phrases[index];
    if (!text) return undefined;
    return {
      content: {
        conversationId,
        type: MessageResponseType.text,
        text,
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

  private async music(payload: RequestMessage): Promise<ResponseMessage> {
    const { conversationId, message } = payload;
    const text = message?.text;
    if (!text) return undefined;
    const prompt = text?.replace(/^[^\s]+/, '').trim();
    const response = await this.youtubeService.music(prompt);
    const mimetype = payload.device === 'android' ? 'audio/mp4' : 'audio/mpeg';
    return {
      content: {
        conversationId,
        type: MessageResponseType.audio,
        media: response.file as Buffer,
        mimetype,
      },
      options: {
        quoted: true,
      },
    };
  }

  private async video(payload: RequestMessage): Promise<ResponseMessage> {
    const { conversationId, message } = payload;
    const text = message?.text;
    if (!text) return undefined;
    const prompt = text?.replace(/^[^\s]+/, '').trim();
    const response = await this.youtubeService.video(prompt);
    return {
      content: {
        conversationId,
        type: MessageResponseType.video,
        media: response,
      },
      options: {
        quoted: true,
      },
    };
  }

  private async gif(payload: RequestMessage): Promise<ResponseMessage> {
    const { conversationId, message } = payload;
    const media = message?.media;
    if (!media) return undefined;
    const response = await this.stickerService.gif(media);
    return {
      content: {
        conversationId,
        type: MessageResponseType.gif,
        media: response,
      },
      options: {
        quoted: true,
      },
    };
  }

  private async image(payload: RequestMessage): Promise<ResponseMessage> {
    const { conversationId, message } = payload;
    const media = message?.media;
    if (!media) return undefined;
    const response = await this.stickerService.image(media);
    return {
      content: {
        conversationId,
        type: MessageResponseType.image,
        media: response,
      },
      options: {
        quoted: true,
      },
    };
  }

  private async roll(payload: RequestMessage): Promise<ResponseMessage> {
    const { conversationId } = payload;
    const dices = await this.firebaseService.getDices();
    const index = random({ min: 0, max: dices.length - 1, integer: true });
    const text = dices[index];
    if (!text) return undefined;
    return {
      content: {
        conversationId,
        type: MessageResponseType.sticker,
        media: text,
      },
    };
  }

  private async lyrics(payload: RequestMessage): Promise<ResponseMessage> {
    const { conversationId, message } = payload;
    const text = message?.text;
    if (!text) return undefined;
    const prompt = text?.replace(/^[^\s]+/, '').trim();
    const response = await this.miscService.lyric(prompt);
    const ResponseText = `*${response.title}*\n${response.artist}\n\n${response.lyrics}`;
    return {
      content: {
        conversationId,
        type: MessageResponseType.text,
        text: ResponseText,
      },
      options: {
        quoted: true,
      },
    };
  }
}
