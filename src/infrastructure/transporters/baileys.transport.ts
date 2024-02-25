import WhatsAppSocket, {
  AuthenticationState,
  DisconnectReason,
  WAMessageContent,
  WAMessageKey,
  WAPresence,
  WASocket,
  makeInMemoryStore,
  proto,
} from '@whiskeysockets/baileys';
import {
  Server,
  CustomTransportStrategy,
  BaseRpcContext,
} from '@nestjs/microservices';
import { RequestMessage } from 'src/domain/types/request-message.type';
import {
  ResponseMessage,
  ResponseMessageContent,
  ResponseMessageOptions,
} from 'src/domain/types/response-message.type';
import { SendMessageMapper } from './baileys.mapper';
import { Logger } from '@nestjs/common';
import * as NodeCache from 'node-cache';

type Options = {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
};

export class BaileysTransport
  extends Server
  implements CustomTransportStrategy
{
  constructor(private options: Options) {
    super();
  }

  listen() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const parent = this;

    this.store?.readFromFile('./baileys_store_multi.json');
    // save every 10s
    setInterval(() => {
      this.store?.writeToFile('./baileys_store_multi.json');
    }, 10_000);

    console.log('baileys started');

    const socket = WhatsAppSocket({
      auth: this.options.state,
      printQRInTerminal: true,
      syncFullHistory: false,
      version: [2, 2349, 2],
      msgRetryCounterCache: new NodeCache(),
      getMessage: this.getMessage,
    });

    socket.ev.on('creds.update', this.options.saveCreds);

    socket.ev.on('connection.update', (data) => {
      const { connection, lastDisconnect } = data;

      if (connection === 'open') console.log('opened connection');

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.error(lastDisconnect?.error);
        console.info('reconnecting:', shouldReconnect);
        if (shouldReconnect) process.exit();
      }
    });

    // socket.ev.on('group-participants.update', async (data) => {
    //   console.log('group-participants.update', data);
    //   try {
    //     const message = { ...data, conversationId: data?.id };
    //     const pattern = 'group-participants';
    //     const handler = parent.messageHandlers.get(pattern);
    //     const ctx = new BaseRpcContext(<any>{});
    //     if (handler) {
    //       const payload = { pattern, data: message, options: {} };
    //       const result: ResponseMessageContent[] = await handler(payload, ctx);
    //       if (result && result?.length) {
    //         const responseMessages: ResponseMessage[] = result.map((msg) => {
    //           return { content: msg };
    //         });
    //         responseMessages.forEach((msg) => this.sendMessage(socket, msg.content));
    //       }
    //     }
    //   } catch (err) {
    //     console.log(err);
    //   }
    // });

    socket.ev.on('messages.upsert', async (data) => {
      try {
        // const MY_CONVERSATION = 'xxxxxxxxxxxxxxxxxx@g.us';
        const message = await SendMessageMapper.toDomain(data);

        // if (MY_CONVERSATION === message.conversationId) {
        if (!message?.fromMe) {
          this.logMessage(message);
          const pattern = 'message';
          const handler = parent.messageHandlers.get(pattern);
          const ctx = new BaseRpcContext(<any>{});
          if (handler) {
            const payload = {
              pattern,
              data: message,
              options: {
                setPresence: (state: WAPresence) =>
                  this.setPresence(state, message.conversationId, socket),
              },
            };
            const resutl: ResponseMessage = await handler(payload, ctx);
            resutl?.content &&
              this.sendMessage({
                socket,
                body: resutl.content,
                options: resutl.options,
                message: data.messages[0],
              });
          }
        }
      } catch (err) {
        console.log(err);
      }
    });
  }

  close() {
    console.log('baileys closed');
  }

  private async sendMessage(m: {
    socket: any;
    body: ResponseMessageContent;
    options?: ResponseMessageOptions;
    message?: proto.IWebMessageInfo;
  }): Promise<void> {
    const payload = SendMessageMapper.toSocket(m.body);
    const quoted = this.setQuoted(m.options, m.message);
    await m.socket.sendMessage(m.body.conversationId, payload, {
      ...quoted,
      backgroundColor: '#fff',
    });
    if (m.options?.reaction)
      await m.socket.sendMessage(m.body.conversationId, {
        react: { text: m.options.reaction, key: m.message.key },
      });
  }

  private setQuoted(options, message): any {
    return options?.quoted
      ? { quoted: message }
      : options?.fakeQuoted
      ? {
          quoted: {
            key: { fromMe: true },
            message: { conversation: 'xd' },
          },
        }
      : undefined;
  }

  //change the bot status to "online, typing, paused, offline"
  private async setPresence(
    status: WAPresence,
    chatId: string,
    socket: WASocket,
  ) {
    await socket.sendPresenceUpdate(status, chatId);
  }

  private logMessage(message: RequestMessage): void {
    const { conversationId, message: msg } = message;
    const { type, text } = msg;
    const raw = JSON.stringify({ conversationId, type, text });
    Logger.log(raw);
  }

  private async getMessage(
    key: WAMessageKey,
  ): Promise<WAMessageContent | undefined> {
    if (this.store) {
      const msg = await this.store.loadMessage(key.remoteJid, key.id);
      return msg?.message || undefined;
    }

    // only if store is present
    return proto.Message.fromObject({});
  }

  private store = !process.argv.includes('--no-store')
    ? makeInMemoryStore({})
    : undefined;
}
