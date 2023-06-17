import Sticker from 'ws-sticker-maker'
import { MessageData, SendData } from '../../shared/interfaces/types'
const SRICKER_TYPES = ['full', 'crop', 'circle', 'default']

const sticker = async (data: MessageData): Promise<SendData> => {
  const media = await data.message.downloadMedia()
  if (!media) return { type: 'text', text: 'Se neceita una imagen o video para crear el sticker.', quoted: true, reacttion: '❌' }
  const { stickerType, msg } = detectAndRemoveStickerType(data.message.text || '')
  const { author, pack } = detectAuthorAndPack(msg)
  const stk = await new Sticker(media).setAuthor(author).setType(stickerType).setPack(pack).toBuffer()
  return {
    type: 'sticker',
    media: stk,
    quoted: true,
    reacttion: '✅'
  }
}

function detectAndRemoveStickerType(msg: string) {
  for (let i = 0; i < SRICKER_TYPES.length; i++) {
    const stickerType = SRICKER_TYPES[i]
    if (msg.includes(stickerType)) {
      msg = msg.replace(`$${stickerType}`, '')
      msg = msg.replace(/\$\s*$/, '')
      msg = msg.trim()
      return { stickerType, msg }
    }
  }

  return { stickerType: 'default', msg }
}

function detectAuthorAndPack(msg: string) {
  const values = msg.split('$').slice(1)
  return { author: values[1], pack: values[0], msg }
}

export default sticker
