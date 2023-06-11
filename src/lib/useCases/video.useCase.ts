import MediaTube, { MusicSearchParams } from "mediatube"
import { MessageData, SendData } from '../../shared/interfaces/types'

const video = async (data: MessageData): Promise<SendData> => {
    const media = await new MediaTube({ query: data.message.outCommandMessage }).toMp4()
    return {
        type: 'video',
        media: media.fileStream,
        fakeQuoted: media.title,
        reacttion: '🤖'
    }
}

export default video

