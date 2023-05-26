import { proto } from '@adiwajshing/baileys'
import {
  BaileysSocket,
  MessageData,
  SendData,
  Utils
} from '../../shared/interfaces/types'
import { MessageMapper } from '../../shared/infrastructure/baileys/baileys.mapper'
import { commands } from './commands'
import { readFileSync } from 'fs'

class commandHandler {
  constructor (
    private socket: BaileysSocket,
    private message: proto.IWebMessageInfo,
    private messageData: MessageData
  ) {}

  static async start (socket: BaileysSocket, message: proto.IWebMessageInfo) {
    //console.log('message', message.message?.chat?.displayName)
    const messageData = MessageMapper.toDomain({ data: message, socket })
    console.log('messageData', messageData.message.command)
    const handler = new commandHandler(socket, message, messageData)
    return handler.messageHandler()
  }

  async messageHandler () {
    const { messageData, socket, message } = this
    if (messageData.message.isCommand) {
      await socket.sendPresenceUpdate('composing', messageData.userId) 
      const reply = await commands.execute(messageData)
      if (reply) await this.sendReply(reply)
    }
  }

  async sendReply (data: SendData) {
    const { userId, device, socket } = this.messageData

    //quoting
    let quoted: any = data.quoted ? { quoted: this.message } : {}
    if (data.fakeQuoted) {
      quoted = MessageMapper.replyFakeMessage({
        text: data.fakeQuoted || 'hola',
        userId: socket.user.id.includes(":")
        ? socket.user.id.split(":")[0] + "@s.whatsapp.net"
        : socket.user.id
      })
    }

    const messageContent = MessageMapper.toSocket(data, device)
    console.log(data.userId)
    console.log({ userId, usd: data.userId })
    await this.socket.sendMessage(data.userId || userId, messageContent, {
      ...quoted
    })
    //await this.socket.sendMessage(userId, {image:{url:'https://ezgif.com/save/ezgif-2-b94f67342f.gif'}}, { ...quoted })

    if (data.reacttion)
      await this.socket.sendMessage(userId, {
        react: { text: data.reacttion, key: this.message.key }
      })
  }

  async sendDReply (data: SendData) {
    //const { userId, device } = this.messageData

    //quoting
    let quoted: {} = {}
    if (data.fakeQuoted) {
      quoted = MessageMapper.replyFakeMessage({
        text: data.fakeQuoted || 'hola'
      })
    }

    const messageContent = MessageMapper.toSocket(
      data,
      data.device || 'Android'
    )
    console.log(data.userId)
    //console.log({userId, usd: data.userId})
    await data.socket.sendMessage(data.userId, messageContent, { ...quoted })
    //await this.socket.sendMessage(userId, {image:{url:'https://ezgif.com/save/ezgif-2-b94f67342f.gif'}}, { ...quoted })

    if (data.reacttion && data.messageReactKey)
      await data.socket.sendMessage(data.userId, {
        react: { text: data.reacttion, key: data.messageReactKey }
      })
  }
}

export default commandHandler
