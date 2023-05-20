import Sticker from 'ws-sticker-maker'

import { SendData, UseCaseParams } from '../../shared/interfaces/types'

const sticker = async ({data,utils}: UseCaseParams): Promise<SendData> => {
  const media = await data.message.downloadMedia()
  if (!media) return { type: 'text', text: 'Se neceita una imagen o video para crear el sticker.', quoted: true, reacttion: '❌' }
  const stk = await new Sticker(media).toBuffer()
  return {
    type: 'sticker',
    media: stk,
    quoted: true,
    reacttion: '✅'
  }
}

export default sticker
