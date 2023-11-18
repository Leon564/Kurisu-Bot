import { Inject, Injectable } from '@nestjs/common';
import { appConfig } from 'src/configs/app.config';
import { ConfigType } from '@nestjs/config';
import { convertImage } from 'C:/Users/nleon/NodeJs Projects/ws-sticker-maker/dist';

@Injectable()
export class RemoveBgService {
  constructor(
    @Inject(appConfig.KEY) private configs: ConfigType<typeof appConfig>,
  ) {}

  async removeBg(media: Buffer): Promise<Buffer> {
    const formData = new FormData();
    formData.append('size', 'auto');
    const image = await convertImage(media, { format: 'png' });
    const blob = new Blob([image], { type: 'image/png' });
    formData.append('image_file', blob, 'image.png');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': this.configs.removeBgApiKey,
      },
      body: formData,
    });
    const blobResponse = await response.blob();
    const buffer = await new Response(blobResponse).arrayBuffer();
    return Buffer.from(buffer);
  }
}
