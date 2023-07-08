import { Injectable, Logger } from '@nestjs/common';
import Lyrics, { SearchData } from 'lyricsverse';
@Injectable()
export class MiscService {
  lyrics: Lyrics;
  constructor() {
    this.lyrics = new Lyrics();
  }

  async lyric(query: string): Promise<SearchData> {
    try {
      const data = await this.lyrics.search(query);
      return data;
    } catch (e) {
      Logger.error(e);
      return null;
    }
  }
}
