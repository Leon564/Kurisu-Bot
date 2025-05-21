import 'dotenv/config';
const prefix = process.env.PREFIX;

export const CommandName = {
  PING: `${prefix}ping`,
  HELP: `${prefix}help`,
  STICKER: `${prefix}sticker|${prefix}stiker`,
  GPT: `${prefix}gpt|${prefix}chat|${prefix}ai|${prefix}gemini`,
  INSULT: `${prefix}insult`,
  PHRASE: `${prefix}frase`,
  GREETING: `${prefix}hola`,
  STICKERBG: `${prefix}stickerbg|${prefix}stikerbg`,
  MUSIC: `${prefix}music`,
  VIDEO: `${prefix}video|${prefix}yt`,
  GIF: `${prefix}gif`,
  IMAGE: `${prefix}image|${prefix}img`,
  ROLL: `${prefix}roll`,
  LYRICS: `${prefix}lyrics|${prefix}lyric`,
  TAGALL: `${prefix}tagall`,
};
