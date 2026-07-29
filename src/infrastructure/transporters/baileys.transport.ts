import WhatsAppSocket, {
  AuthenticationState,
  DisconnectReason,
  GroupParticipant,
  WAMessageContent,
  WAMessageKey,
  WAPresence,
  WASocket,
  isJidGroup,
  jidNormalizedUser,
  proto,
  fetchLatestBaileysVersion,
} from 'baileys';
import * as QRCode from 'qrcode';
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
import { MessageResponseType } from 'src/domain/enums/message-response-type.enum';

type Options = {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
};

export class BaileysTransport
  extends Server
  implements CustomTransportStrategy
{
  private socket: WASocket | null = null;

  constructor(private options: Options) {
    super();
  }

  private printQRInTerminal(qr: string): void {
    QRCode.toString(
      qr,
      {
        type: 'terminal',
        small: true,
        width: 40,
      },
      (err: any, qrString: string) => {
        if (err) {
          console.log('Error generando QR:', err);
          // Fallback: mostrar la URL como antes
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
            qr,
          )}`;
          console.log('📱 Abre esta URL en tu navegador para ver el QR:');
          console.log(qrUrl);
        } else {
          console.log('\n🔗 Código QR para WhatsApp (compacto):\n');
          console.log(qrString);
          console.log(
            'Escanéalo con tu aplicación de WhatsApp para conectarte\n',
          );
        }
      },
    );
  }

  async listen() {
    const parent = this;

    // this.store?.readFromFile('./baileys_store_multi.json');
    // // save every 10s
    // setInterval(() => {
    //   this.store?.writeToFile('./baileys_store_multi.json');
    // }, 10_000);

    console.log('baileys started');
    //const { version } = await fetchLatestBaileysVersion();
    const socket = WhatsAppSocket({
      auth: this.options.state,
      // printQRInTerminal: true, // Deprecated - removido
      //syncFullHistory: false,
      version: [2, 3000, 1043430842],
      // msgRetryCounterCache: new NodeCache(),
      // getMessage: this.getMessage,
    });

    // Asignar el socket a la propiedad de clase
    this.socket = socket;

    socket.ev.on('creds.update', this.options.saveCreds);

    socket.ev.on('connection.update', (data) => {
      const { connection, lastDisconnect, qr } = data;

      // Manejar QR manualmente
      if (qr) {
        this.printQRInTerminal(qr);
      }

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
                tagAll: () =>
                  this.tagAll(message.conversationId, message.userId, socket),
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

  /**
   * Every id a participant may be addressed by. Groups are LID-addressed since
   * v7, so metadata ids and message keys can each arrive as a LID or a phone
   * number and won't compare equal unless we check both forms.
   */
  private participantIds(p: GroupParticipant): string[] {
    return [p.id, p.lid, p.phoneNumber]
      .filter(Boolean)
      .map((jid) => jidNormalizedUser(jid));
  }

  //tag all participants in a group
  private async tagAll(chatId: string, userId: string, socket: WASocket) {
    const data = await socket.groupMetadata(chatId);
    const isGroup = isJidGroup(chatId);
    if (!isGroup) return;

    const sender = jidNormalizedUser(userId);
    // our own identity is a phone number, but `p.id` is a LID in v7 groups —
    // comparing only against `user.id` would leave the bot tagging itself
    const me = [socket.user?.id, socket.user?.lid]
      .filter(Boolean)
      .map((jid) => jidNormalizedUser(jid));

    const isAdmin = data.participants.filter(
      (p) => this.participantIds(p).includes(sender) && p?.admin,
    );

    const participants = data.participants.filter((p) => {
      const ids = this.participantIds(p);
      return !ids.includes(sender) && !ids.some((id) => me.includes(id));
    });

    let messageBody = {
      conversationId: chatId,
      type: MessageResponseType.text,
      text: 'No tienes acceso a este comando o no hay participantes en el grupo',
      mentions: undefined,
    };
    if (isAdmin.length > 0 && participants.length > 0) {
      const mentions = participants.map((p) => p.id);
      // mention the id WA expects, but render the phone number: `p.id` is a LID
      // in v7 groups and would show up as an opaque string of digits
      const mentionsText = participants
        .map((p) => `@${(p.phoneNumber || p.id).split('@')[0]}`)
        .join(' ');

      messageBody = {
        conversationId: chatId,
        type: MessageResponseType.text,
        text: mentionsText,
        mentions,
      };
    }

    this.sendMessage({
      socket,
      body: messageBody,
    });

    Logger.log(JSON.stringify({ type: 'tagAll', chatId, userId }));
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
    // if (this.store) {
    //   const msg = await this.store.loadMessage(key.remoteJid, key.id);
    //   return msg?.message || undefined;
    // }

    // only if store is present
    return proto.Message.create({});
  }

  // Métodos requeridos por la nueva versión de NestJS
  on<
    EventKey extends string = string,
    EventCallback extends Function = Function,
  >(event: EventKey, callback: EventCallback): any {
    // Implementación mínima para satisfacer la interface
    return this;
  }

  unwrap(): any {
    // Retorna el socket de WhatsApp o null si no está disponible
    return this.socket || null;
  }
}
