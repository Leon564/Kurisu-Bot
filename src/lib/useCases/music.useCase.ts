import MediaTube, { MusicSearchParams } from "mediatube"
import { MessageData, SendData } from '../../shared/interfaces/types'

const music = async (data: MessageData): Promise<SendData> => {
    const media = await new MediaTube({ query: data.message.outCommandMessage }).toMp3()

    return {
        type: 'audio',
        media: media.file,
        fakeQuoted: media.title,
        reacttion: '🎵'
    }
}

export default music

