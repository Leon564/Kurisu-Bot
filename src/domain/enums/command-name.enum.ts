import 'dotenv/config';
const prefix = process.env.PREFIX;

export const CommandName = {
  PING: `${prefix}ping`,
  HELP: `${prefix}help`,
  STICKER: `${prefix}sticker|${prefix}stiker`,
  GPT: `${prefix}gpt|${prefix}chat`,
  INSULT: `${prefix}insult`,
  PHRASE: `${prefix}frase`,
  GREETING: `${prefix}hola`,
};
