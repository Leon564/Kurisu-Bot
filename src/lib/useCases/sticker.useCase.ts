import Sticker from 'ws-sticker-maker'

import { MessageData, SendData } from '../../shared/interfaces/types'
const stickerTypes = ['full', 'crop', 'circle', 'default']

function detectAndRemoveStickerType(msg: string) {
  for (let i = 0; i < stickerTypes.length; i++) {
    const stickerType = stickerTypes[i]
    if (msg.includes(stickerType)) {
      msg = msg.replace(stickerType, '')
      msg = msg.replace(/\$\s*$/, '')
      msg = msg.trim()
      return { stickerType, msg }
    }
  }

  return { stickerType: 'default', msg }
}

const detectAuthorAndPack = (msg: string) => {
  const values = msg.split('$').slice(1)
  return { author: values[1], pack: values[0], msg }
}

const sticker = async (data: MessageData): Promise<SendData> => {
  const media = await data.message.downloadMedia()
  if (!media) return { type: 'text', text: 'Se neceita una imagen o video para crear el sticker.', quoted: true, reacttion: '❌' }
  const stk = await new Sticker().toBuffer()
  return {
    type: 'sticker',
    media: stk,
    quoted: true,
    reacttion: '✅'
  }
}

export default sticker
