import { Injectable, Logger } from '@nestjs/common';
import Sticker from 'ws-sticker-maker';
import { Buffer } from 'buffer';
import EzGif, { Formats } from 'ez-converter';

@Injectable()
export class StickerService {
  async sticker(media: Buffer): Promise<Buffer> {
    return await new Sticker(media).toBuffer();
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
