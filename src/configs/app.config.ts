import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT) || 3001,
  waSessionId: process.env.WA_SESSION_ID || 'default',
  openAiApiKey: process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  prefix: process.env.PREFIX || '#',
  removeBgApiKey: process.env.REMOVE_BG_API_KEY,
}));
