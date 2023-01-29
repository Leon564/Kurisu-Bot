import ytd from 'ytd'
import {
  MessageBody,
  MessageData,
  SendData
} from '../../shared/interfaces/types'

const music = async (m: MessageBody): Promise<SendData> => {
  const song = await ytd.get({ query: m.outCommandMessage! }).toMp3()

  return {
    type: 'audio',
    media: song.fileBuffer,
    fakeQuoted: song.title,
    reacttion: '🎵'
  }
}

export default music
