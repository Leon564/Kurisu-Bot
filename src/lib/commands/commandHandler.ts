import { proto } from '@adiwajshing/baileys'
import {
  BaileysSocket,
  MessageData,
  SendData
} from '../../shared/interfaces/types'
import { MessageMapper } from '../../shared/infrastructure/baileys/baileys.mapper'
import { commands } from './commands'

class commandHandler {
  constructor (
    private socket: BaileysSocket,
    private message: proto.IWebMessageInfo,
    private messageData: MessageData
  ) {}

  static async start (socket: BaileysSocket, message: proto.IWebMessageInfo) {
    const messageData = MessageMapper.toDomain({ data: message, socket })
    const handler = new commandHandler(socket, message, messageData)
    return handler.messageHandler()
  }

  messageHandler () {
    const { messageData, socket, message } = this
    if (messageData.message.isCommand) {
      const reply = commands.execute(messageData)
      console.log(reply)
      this.sendReply(reply)
    }
  }

  async sendReply (data: SendData) {
    const { userId } = this.messageData

    //quoting
    let quoted = data.quoted ? { quoted: this.message } : {}
    if (data.fakeQuoted) {
      quoted = MessageMapper.replyFakeMessage({
        text: data.fakeQuoted || 'hola'
      })
    }

    //mediatype
    let media: any = data.media ? { url: data.media } : {}
    if (data.media && Buffer.isBuffer(data.media)) {
      media = data.media
    }

    switch (data.type) {
      case 'text':
        await this.socket.sendMessage(
          userId,
          { text: data.text! },
          { ...quoted }
        )
        break
      case 'image':
        await this.socket.sendMessage(
          userId,
          { image: media, caption: data.text },
          {
            ...quoted
          }
        )
        break
    }

    if (data.reacttion)
      await this.socket.sendMessage(userId, {
        react: { text: data.reacttion, key: this.message.key }
      })
  }
}

export default commandHandler
