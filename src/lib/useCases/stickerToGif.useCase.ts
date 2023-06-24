import { readFileSync } from 'fs'
import { MessageData, SendData } from '../../shared/interfaces/types'
import Ez, { Formats } from 'ezgif-converter'

const stickerToGif = async (data: MessageData): Promise<SendData> => {
  if (data.message.type !== 'sticker')
    return { type: 'text', text: 'Este comando funciona solo con stickers' }

  const messageMedia = await data.message.downloadMedia()
  const gif = await new Ez(messageMedia!)
    .setTargetFormat(Formats.MP4)
    .toBuffer()

  return { type: 'video', media: gif, gifPlayback: true }
}

export default stickerToGif