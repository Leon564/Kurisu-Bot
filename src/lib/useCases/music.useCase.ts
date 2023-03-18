import ytd from 'mediatube'
import {
  MessageBody,
  MessageData,
  SendData
} from '../../shared/interfaces/types'

const music = async (m: MessageBody): Promise<SendData> => {
  try{
    const song = await ytd.get({ query: m.outCommandMessage! }).toMp3()
  return {
    type: 'audio',
    media: song.fileBuffer,
    fakeQuoted: song.title,
    reacttion: '🎵',
    ptt:false
  }
  } catch (e) {
    console.log(e)
    return { type: 'text', text: 'Error al descargar la canción' }
  }
}

export default music
