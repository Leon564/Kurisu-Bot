import { proto, downloadMediaMessage } from '@adiwajshing/baileys'
import {
  BaileysMessage,
  BaileysSocket,
  MessageBody,
  MessageData,
  MessageType,
  Nullable
} from '../../interfaces/types'
import { writeFileSync } from 'fs'
import config from '../configs/config'

export class MessageMapper {
  static toDomain ({
    data,
    socket
  }: {
    data: proto.IWebMessageInfo
    socket: BaileysSocket
  }): MessageData {
    const message = Message.create({ data })
    return {
      id: data.key.id!,
      userId: data.key.remoteJid!,
      userName: data.key.participant!,
      message,
      socket
    }
  }

  static replyFakeMessage ({ text, userId }: { text: string; userId?: string }) {
    return {
      quoted: {
        key: { participant: userId || '0@s.whatsapp.net' },
        message: { conversation: text }
      }
    }
  }
}

class Message implements MessageBody {
  type: MessageType
  text: string | undefined
  media: Buffer | undefined
  isCommand: boolean = false
  command: string | undefined
  outCommandMessage: string | undefined
  private message: proto.IMessage | Nullable
  private isReply: boolean = false

  private constructor ({ data }: { data: proto.IWebMessageInfo }) {
    this.type = this.getType(data.message)
    this.text = this.getText(data.message)
    if (config.prefix && this.text?.startsWith(config.prefix)) {
      this.isCommand = true
      this.command = this.text?.split(' ')[0].replace(config.prefix, '')
      this.outCommandMessage = this.text?.split(' ').slice(1).join(' ')
    }

    this.message = data.message
  }

  static create ({ data }: { data: proto.IWebMessageInfo }): Message {
    const message = new Message({ data })
    return message
  }

  private getType (message: proto.IMessage | Nullable): MessageType {
    const [type] = Object.keys(message || {})
    switch (type) {
      case 'conversation':
        return 'text'
      case 'videoMessage':
        return 'video'
      case 'imageMessage':
        return 'image'
      case 'extendedTextMessage': {
        this.isReply = true
        return this.getReplyType(message)
      }
      default:
        return 'unkown'
    }
  }

  private getText (message: proto.IMessage | Nullable): string | undefined {
    if (this.isReply) return message?.extendedTextMessage?.text || ''
    switch (this.type) {
      case 'text':
        return message?.conversation || ''
      case 'video':
        return message?.videoMessage?.caption || ''
      case 'image':
        return message?.imageMessage?.caption || ''
      default:
        return undefined
    }
  }

  private getReplyType (message: proto.IMessage | Nullable): MessageType {
    const [type] = Object.keys(
      message?.extendedTextMessage?.contextInfo?.quotedMessage || {}
    )
    switch (type) {
      case 'conversation':
        return 'text'
      case 'videoMessage':
        return 'video'
      case 'imageMessage':
        return 'image'
      default:
        return 'unkown'
    }
  }
  public async downloadMedia (): Promise<Buffer | Nullable> {
    if (!this.isCommand) return
    try {
      // validate type
      const validTypes = ['video', 'image']
      if (!validTypes.includes(this.type)) return
      let message = this.message
      if (this.isReply) {
        message = this.message?.extendedTextMessage?.contextInfo?.quotedMessage
      }
      // download media
      const buffer = await downloadMediaMessage(
        { message } as proto.IWebMessageInfo,
        'buffer',
        {},
        {
          logger: null as any,
          // pass this so that baileys can request a reupload of media
          // that has been deleted
          reuploadRequest: null as any
        }
      )
      writeFileSync(`./xd.jpg`, buffer as Buffer)
      return buffer as Buffer
    } catch (error) {
      console.log('error downloading media')
      return
    }
  }
}
