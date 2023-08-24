import { Injectable, Logger } from '@nestjs/common';
import Sticker from 'ws-sticker-maker';
import { Buffer } from 'buffer';
import EzGif, { Formats } from 'ez-converter';

interface IStickerOptions {
  packname: string | null;
  type: string | null;
  author: string | null;
}

@Injectable()
export class StickerService {
  async sticker(media: Buffer, options: IStickerOptions): Promise<Buffer> {
    const { packname, type, author } = options;
    return await new Sticker(media)
      .setAuthor(author)
      .setPack(packname)
      .setType(type)
      .toBuffer();
  }

  async gif(media: Buffer): Promise<Buffer> {
    try {
      return await new EzGif(media).setTargetFormat(Formats.MP4).toBuffer();
    } catch (e) {
      Logger.error(e);
      return null;
    }
  }

  async image(media: Buffer): Promise<Buffer> {
    return media;
  }
}
