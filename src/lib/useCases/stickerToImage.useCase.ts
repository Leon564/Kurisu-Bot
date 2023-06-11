import sharp from 'sharp'
import { MessageData, SendData } from '../../shared/interfaces/types'

const stickerToImage = async (data: MessageData): Promise<SendData> => {
  if (data.message.type !== 'sticker')
    return { type: 'text', text: 'Este comando funciona solo con stickers' }
  const media = await data.message.downloadMedia()
  const buffer = await sharp(media!).png().toBuffer()
  return { type: 'image', media: buffer }
}

export default stickerToImage
