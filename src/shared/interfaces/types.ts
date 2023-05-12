import WhatsAppSocket, { GroupMetadata, WAMessage, proto } from '@adiwajshing/baileys'
import { Ytmp3 } from '../../../../mediatube/dist';

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
}

export type SendData = {
  type: ResponseType
  text?: string
  media?: Buffer | string
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
  mp3Downloader: Ytmp3
  sendReply: (data: SendData) => Promise<void> | Nullable
}

export type UseCaseParams = {
  data: MessageData
  utils: Utils
}