import { Injectable, Logger } from '@nestjs/common';
import MediaTube, { Mp3Response, Mp4Response } from 'mediatube';
import { Stream } from 'stream';

@Injectable()
export class YoutubeService {
  private isProcessing: boolean;
  private queue: any[];

  constructor() {
    this.isProcessing = false;
    this.queue = [];
  }

  async video(query: string): Promise<Stream> {
    if (this.isProcessing) {
      await this.waitForProcessing();
    }

    try {
      this.isProcessing = true;
      const mediaTube: Mp4Response = (await new MediaTube({
        VideoQuality: 'highestvideo',
        query,
        limit: 1,
        type: 'mp4',
      }).download()) as any;
      return mediaTube.fileStream;
    } catch (err) {
      Logger.error(err);
    } finally {
      this.isProcessing = false;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  async music(query: string): Promise<Mp3Response> {
    if (this.isProcessing) {
      await new Promise((resolve) => {
        this.queue.push(resolve);
      });
    }

    try {
      this.isProcessing = true;
      const mediaTube: Mp3Response = (await new MediaTube({
        AudioQuality: 'highestaudio',
        query,
        cover: true,
        type: 'mp3',
      }).download()) as any;
      return mediaTube;
    } catch (err) {
      Logger.error(err);
    } finally {
      this.isProcessing = false;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  private waitForProcessing(): Promise<void> {
    return new Promise((resolve) => {
      const checkProcessing = () => {
        if (!this.isProcessing) {
          resolve();
        } else {
          setTimeout(checkProcessing, 1000);
        }
      };

      checkProcessing();
    });
  }
}
