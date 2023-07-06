import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { appConfig } from 'src/configs/app.config';

@Injectable()
export class MenuService {
  constructor(
    @Inject(appConfig.KEY) private configs: ConfigType<typeof appConfig>,
  ) {}

  getMenu() {
    const prefix = this.configs.prefix;
    const commands = [
      `*${prefix}hola*: _Recibe un saludo, o no..._`,
      `*${prefix}ping*: _Envia una respuesta del servidor._`,
      `*${prefix}help*: _Muestra el menu de commandos._`,
      `*${prefix}sticker*: _Convierte cualquier imagen, gif, video en sticker._`,
      `*${prefix}stickerbg*: _Convierte cualquier imagen en sticker con fondo transparente._`,
      `*${prefix}gif*: _Convierte cualquier sticker en gif._`,
      `*${prefix}image*: _Convierte cualquier sticker en imagen._`,
      `*${prefix}chat*: _Puedes conversar con chatgpt, (necesitas pedir acceso)(beta)._`,
      `*${prefix}insult*: _Envia un instulto a la persona que mencionas._`,
      `*${prefix}frase*: _Envia una frase de algun anime._`,
      `*${prefix}music*: _Busca y recibe una cancion de youtube._`,
      `*${prefix}video*: _Busca y recibe un video de youtube._`,
      `*${prefix}roll*: _Tira un dado de 6 caras._`,
    ].join('\n');
    const text = `⌘⌘⌘⌘⌘ *MENU* ⌘⌘⌘⌘⌘\n\n${commands}\n\n⌘⌘⌘⌘⌘⌘⌘⌘⌘⌘⌘⌘⌘⌘`;
    return text;
  }
}
