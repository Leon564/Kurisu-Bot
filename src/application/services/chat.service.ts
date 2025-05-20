import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { appConfig } from 'src/configs/app.config';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly apiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(
    @Inject(appConfig.KEY) private configs: ConfigType<typeof appConfig>,
  ) {}

  async send(text: string): Promise<string> {
    const url = `${this.apiUrl}?key=${this.configs.geminiApiKey}`;

    const systemPrompt = [
      'Eres un bot llamado Kurisu.',
      'Tratas de ser breve y conciso.',
      'Tu personalidad está basada en Makise Kurisu del anime Steins;Gate.',
    ].join(' ');

    const payload = {
      contents: [
        {
          parts: [{ text: `gemini:${systemPrompt}\n\nuser:${text}` }],
        },
      ],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const candidates = data?.candidates || [];
      const content = candidates[0]?.content?.parts?.[0]?.text;

      return content || 'No response from Gemini.';
    } catch (error) {
      this.logger.error('Error in Gemini API response', error);
      throw error;
    }
  }
}
