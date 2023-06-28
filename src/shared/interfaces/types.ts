import WhatsAppSocket, { GroupMetadata, WAMessage, proto } from '@whiskeysockets/baileys'
import { Stream } from 'stream';

export type BaileysMessage = { messages: WAMessage[]; type: MessageType }
export type BaileysSocket = ReturnType<typeof WhatsAppSocket>
export type MessageType =
  | 'text'
  | 'listMessage'
  | 'image'
  | 'video'
  | 'sticker'
  | 'buttonsMessage'
  | 'unkown'
export type ResponseType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'buttonsMessage'
  | 'sticker'
  | 'mention'

export type Nullable = null | undefined

export type MessageBody = {
  type: MessageType
  text?: string
  media?: Buffer
  isCommand?: boolean
  isGroup?: boolean
  downloadMedia: () => Promise<Buffer | Nullable>
  getGroupMetadata: Promise<GroupMetadata | Nullable> | Nullable
  command?: string
  outCommandMessage: string | undefined
  timestamp: number | Long | Nullable
  userNumber: string | undefined
}

export type SendData = {
  type: ResponseType
  text?: string
  media?: Buffer | string | Stream
  quoted?: boolean
  reacttion?:
    | '❤️'
    | '👍'
    | '👎'
    | '😂'
    | '😮'
    | '😢'
    | '😡'
    | '🎵'
    | '✅'
    | '❌'
    | '🎲'
    | string
  fakeQuoted?: string
  ptt?: boolean
  gifPlayback?: boolean
  mentions?: string[]
  userId ?: string
  device ?: string
  socket ?: BaileysSocket
  messageReactKey?: string
}

export type MessageData = {
  id: string
  userId: string
  userName: string
  message: MessageBody
  socket: BaileysSocket
  device: string
}

export type Utils = {
  sendReply: (data: SendData) => Promise<void> | Nullable
}
