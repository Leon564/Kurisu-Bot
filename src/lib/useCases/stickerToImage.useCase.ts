import sharp from 'sharp'
import { MessageBody, SendData } from '../../shared/interfaces/types'

const stickerToImage = async (m: MessageBody): Promise<SendData> => {
  if (m.type !== 'sticker')
    return { type: 'text', text: 'Este comando funciona solo con stickers' }
  const media = await m.downloadMedia()
  const buffer = await sharp(media!).png().toBuffer()
  return { type: 'image', media: buffer }
}

export default stickerToImage
