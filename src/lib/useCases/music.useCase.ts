//import MediaTube, {MusicSearchParams} from "mediatube"
import MediaTube from "C:/Users/nleon/NodeJs Projects/mediatube"
import { SendData, UseCaseParams } from '../../shared/interfaces/types'

const music = async ({ data, utils }: UseCaseParams): Promise<SendData> => {
    const media = await new MediaTube({query: data.message.outCommandMessage}).toMp3()

    return { 
        type: 'audio',
        media: media.file,
        fakeQuoted: media.title,
        reacttion: '🤖'
    }
}

export default music

