import { Injectable } from '@nestjs/common';
import Sticker from 'ws-sticker-maker';
@Injectable()
export class StickerService {
  async sticker(media: Buffer): Promise<Buffer> {
    return await new Sticker(media).toBuffer();
  }
}
