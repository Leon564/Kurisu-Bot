import Sticker from 'ws-sticker-maker'

import { MessageBody, SendData } from '../../shared/interfaces/types'

const sticker = async (m: MessageBody): Promise<SendData> => {
  const media = await m.downloadMedia()
  const stk = await new Sticker(media!).toBuffer()
  return {
    type: 'sticker',
    media: stk,
    quoted: true,
    reacttion: '✅'
  }
}

export default sticker
