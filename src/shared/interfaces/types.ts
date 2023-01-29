import WhatsAppSocket, { WAMessage, proto } from '@adiwajshing/baileys'

export type BaileysMessage = { messages: WAMessage[]; type: MessageType }
export type BaileysSocket = ReturnType<typeof WhatsAppSocket>
export type MessageType =
  | 'text'
  | 'listMessage'
  | 'image'
  | 'video'
  | 'buttonsMessage'
  | 'unkown'
export type ResponseType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'buttonsMessage'
  | 'sticker'
export type Nullable = null | undefined
export type MessageBody = {
  type: MessageType
  text?: string
  media?: Buffer
  isCommand?: boolean
  downloadMedia: () => Promise<Buffer | Nullable>
  command?: string
  outCommandMessage: string | undefined
  // message: proto.IMessage
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
  fakeQuoted?: string
}

export type MessageData = {
  id: string
  userId: string
  userName: string
  message: MessageBody
  socket: BaileysSocket
}
