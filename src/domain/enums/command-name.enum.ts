const prefix = process.env.PREFIX || '!';

export enum Command_Name {
  PING = 'ping',
  HELP = 'help',
  STICKER = 'sticker',
  CHAT = 'chat',
  INSULT = 'insult',
  PHRASE = 'frase',
}

export const CommandName: Record<Command_Name, string> = {
  [Command_Name.PING]: `${prefix}ping`,
  [Command_Name.HELP]: `${prefix}help`,
  [Command_Name.STICKER]: `${prefix}sticker`,
  [Command_Name.CHAT]: `${prefix}chat`,
  [Command_Name.INSULT]: `${prefix}insult`,
  [Command_Name.PHRASE]: `${prefix}frase`,
};
