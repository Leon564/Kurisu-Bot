// src/tasks/daily-task.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as moment from 'moment-timezone';
import { FirebaseService } from 'src/application/services/firebase.service';

@Injectable()
export class ClaroTaskService {
  constructor(private firebaseService: FirebaseService) {}

  private readonly logger = new Logger(ClaroTaskService.name);

  @Cron('0 0 * * * *') // Cada hora
  async handleDailyTask() {
    const now = moment().tz('America/El_Salvador'); //utc-6
    console.log(now.hour());

    //ejecutar a la 3:00 AM si no retornar null
    if (now.hour() !== 3 && now.minute() !== 0) return;

    this.logger.log('Tarea diaria ejecutada a la 1:00 AM');

    const getInitTokenFetch = await fetch('https://claro-token.onrender.com', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authorization: `Basic ${Buffer.from(
          `${process.env.CLARO_USER}:${process.env.CLARO_SECRET}`,
        ).toString('base64')}`,
      },
    });

    const initToken = await getInitTokenFetch.json();

    const requestAuth = await fetch(
      'https://paquetes.miclaro.com.sv/eiko-profile/Profile/SendPackage',
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-language':
            'es-419,es;q=0.9,es-ES;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5,es-US;q=0.4',
          authorization: `Bearer ${initToken['MCE:THE-TOKEN']}`,
          'content-type': 'application/json',
          priority: 'u=1, i',
          'sec-ch-ua':
            '"Microsoft Edge";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          cookie: 'cc=_NULL; PID=4333dce7-c068-4f06-8412-a6d8b7ed8ac3',
        },
        referrerPolicy: 'no-referrer',
        body: '50370649152',
        method: 'POST',
      },
    );

    const token = await requestAuth.json();

    const request = await fetch(
      'https://paquetes.miclaro.com.sv/eiko-offer/Packages?isAtlasTheme=true',
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-language':
            'es-419,es;q=0.9,es-ES;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5,es-US;q=0.4',
          authorization: `Bearer ${token}`,
          priority: 'u=1, i',
          'sec-ch-ua':
            '"Microsoft Edge";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'x-authorization': `Bearer ${token}`,
          cookie: 'cc=_NULL; PID=4333dce7-c068-4f06-8412-a6d8b7ed8ac3',
        },
        referrerPolicy: 'no-referrer',
        body: null,
        method: 'GET',
      },
    );
    console.log(request);
    const result = await request.json();

    const monthlyPromotions = result?.find(
      (x: { tabCategory: string; sliders: any }) =>
        x.tabCategory === 'Promociones del mes',
    );

    const promotions = monthlyPromotions?.sliders?.find(
      (x: any) => x.title === 'Superpack de Internet',
    );

    const ilimit = promotions?.packages?.filter((x: any) =>
      ['ilimitada', 'Navegación ilimitada'].some((y) => x.name.includes(y)),
    );

    const packages = ilimit?.map((x: any) => ({
      name: x.name,
      id: x.id,
      url: `https://paquetes.miclaro.com.sv/portal/generateFolio?packId=${x.id}&paymentId=b744642d-ecc0-4b41-9ffd-5600df9983ba`,
    }));

    if (packages.length === 0) return;

    await this.firebaseService.setPackages({
      data: packages,
      date: moment().tz('America/El_Salvador').toString(),
    });

    return packages;
  }
}
