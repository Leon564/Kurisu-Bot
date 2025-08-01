import { Injectable, Logger } from '@nestjs/common';
import MediaTube, { Mp3Response, Mp4Response } from 'mediatube';
import { Stream } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class YoutubeService {
  private isProcessing: boolean;
  private queue: any[];
  private cookies: any[] | undefined;

  constructor() {
    this.isProcessing = false;
    this.queue = [];
    this.loadCookies();
  }

  private loadCookies(): void {
    try {
      const cookiesPath = path.join(
        process.cwd(),
        'auth_info',
        'youtube-cookies.json',
      );

      if (fs.existsSync(cookiesPath)) {
        const cookiesArray = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
        this.cookies = cookiesArray;
        Logger.log('YouTube cookies loaded successfully');
      }
    } catch (error) {
      Logger.warn('Failed to load YouTube cookies, proceeding without them');
    }
  }

  async video(query: string): Promise<Stream> {
    if (this.isProcessing) {
      await this.waitForProcessing();
    }

    try {
      this.isProcessing = true;
      const config: any = {
        VideoQuality: 'highestvideo',
        query,
        limit: 1,
        type: 'mp4',
      };

      if (this.cookies) {
        config.cookies = this.cookies;
      }

      const mediaTube: Mp4Response = (await new MediaTube(
        config,
      ).download()) as any;
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
      const config: any = {
        AudioQuality: 'highestaudio',
        query,
        cover: true,
        type: 'mp3',
      };

      if (this.cookies) {
        config.cookies = this.cookies;
      }

      const mediaTube: Mp3Response = (await new MediaTube(
        config,
      ).download()) as any;
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
