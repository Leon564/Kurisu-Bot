import { readFileSync } from 'fs'
import { MessageBody, SendData } from '../../shared/interfaces/types'
import Ez, { Formats } from 'ezgif-converter'

const stickerToGif = async (m: MessageBody): Promise<SendData> => {
  if (m.type !== 'sticker')
    return { type: 'text', text: 'Este comando funciona solo con stickers' }

  const messageMedia = await m.downloadMedia()
  const gif = await new Ez(messageMedia!)
    .setTargetFormat(Formats.MP4)
    .toBuffer()

  return { type: 'video', media: gif, gifPlayback: true }
}

export default stickerToGif
