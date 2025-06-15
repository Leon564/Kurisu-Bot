import { Injectable, Logger } from '@nestjs/common';
import Lyrics, { SearchData } from 'lyricsverse';
import { FirebaseService } from './firebase.service';
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

  async claro(firebaseService: FirebaseService): Promise<string> {
    const packages = await firebaseService.getPackages();
    if (packages?.data?.length === 0 || !packages?.data) {
      return 'No hay paquetes disponibles';
    }

    let message = `*Claro*: ${packages.data.length} paquetes disponibles`;

    packages.data.forEach((pack) => {
      message += `\n\n${pack.name}: ${pack.url}`;
    });

    return message;
  }
}
