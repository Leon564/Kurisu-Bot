import mediaTube from 'mediatube'
import fs from 'fs'
import { SendData, UseCaseParams } from '../../shared/interfaces/types'

const music = async ({ data, utils }: UseCaseParams): Promise<SendData> => {
  const { mp3Downloader, sendReply } = utils
  //const tmpDir = fs.mkdtempSync(`tmp-${Date.now()}`)
  try {
    if (!data.message.outCommandMessage)
      return { type: 'text', text: 'No se ha solicitado ninguna canción' }
    const song = await mediaTube
      .get({ query: data.message.outCommandMessage! })
      .search()
    const tempFilename = `${Date.now()}-${song.title}.mp3`
    mp3Downloader.download(song.id, tempFilename)
    console.log('userId', data.userId)
    return new Promise((resolve, reject) => {
      mp3Downloader.on('progress', function (progress: any) {})
      mp3Downloader.on('finished', async (err: any, result: any) => {
        if (err) return reject(err)

        if (result.file.includes(tempFilename)) {
          const buffer = fs.readFileSync(result.file)
          fs.rmSync(result.file, { recursive: true })
          //fs.unlinkSync(data.file)

          utils.sendReply({
            type: 'audio',
            userId: data.userId,
            media: buffer,
            fakeQuoted: song.title,
            quoted: true,
            reacttion: '🎵',
            ptt: false,
            socket: data.socket
          })
        }
      })
    })
  } catch (e) {
    console.log(e)
    return { type: 'text', text: 'Error al descargar la canción' }
  }
}

export default music
