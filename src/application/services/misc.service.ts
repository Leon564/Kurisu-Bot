import { Injectable, Logger } from '@nestjs/common';
import Lyrics, { SearchData } from 'lyricsverse';
import { FirebaseService } from './firebase.service';
import * as moment from 'moment-timezone';
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
    moment.locale('es');

    const packages = await firebaseService.getPackages();
    if (packages?.data?.length === 0 || !packages?.data) {
      return 'No hay paquetes disponibles';
    }

    let message = `*Claro*: ${
      packages.data.length
    } paquetes disponibles\nFecha de actualización: ${moment
      .tz(new Date(packages.date), 'America/El_Salvador')
      .format('dddd D [de] MMMM [de] YYYY')}`;

    packages.data.forEach((pack) => {
      message += `\n\n${pack.name}: ${pack.url}`;
    });

    return message;
  }
}
