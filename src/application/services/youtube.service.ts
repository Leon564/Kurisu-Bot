import { Injectable, Logger } from '@nestjs/common';
import MediaTube, { Mp3Response } from 'mediatube';
import { Stream } from 'stream';

@Injectable()
export class YoutubeService {
  private isProcessing: boolean;

  constructor() {
    this.isProcessing = false;
  }

  async video(query: string): Promise<Stream> {
    try {
      const mediaTube = await new MediaTube({
        VideoQuality: 'highestvideo',
        query,
        durationLimit: 600,
      }).toMp4();
      return mediaTube.fileStream;
    } catch (err) {
      Logger.error(err);
    }
  }
  async music(query: string): Promise<Mp3Response> {
    if (this.isProcessing) {
      // Si ya hay una petición en proceso, esperamos a que termine y devolvemos el resultado.
      await this.waitForProcessing();
    }

    try {
      this.isProcessing = true;
      const mediaTube = await new MediaTube({
        AudioQuality: 'highestaudio',
        query,
        cover: true,
      }).toMp3();

      return mediaTube;
    } finally {
      this.isProcessing = false;
    }
  }

  private waitForProcessing(): Promise<void> {
    return new Promise((resolve) => {
      const checkProcessing = () => {
        if (!this.isProcessing) {
          resolve();
        } else {
          setTimeout(checkProcessing, 100);
        }
      };

      checkProcessing();
    });
  }
}
