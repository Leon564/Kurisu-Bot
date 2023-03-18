import greet from '../useCases/greetings.useCase'
import dice from '../useCases/dice.useCase'
import music from '../useCases/music.useCase'
import sticker from '../useCases/sticker.useCase'
import stickerToImage from '../useCases/stickerToImage.useCase'
import stickerToGif from '../useCases/stickerToGif.useCase'
import getElapsedSeconds from '../useCases/ping.useCase'

export class commands {
  private comandos: { [key: string]: Function } = {}
  constructor (private data: any) {
    this.comandos = {
      greet,
      roll: dice,
      hola: greet,
      music: music,
      sticker: sticker,
      stiker: sticker,
      image:stickerToImage,
      imagen:stickerToImage,
      gif:stickerToGif,
      ping:getElapsedSeconds
    }
  }

  static execute (data: any) {
    return new commands(data).getCommand()
  }

  async getCommand () {
    const command = this.data.message.command
    if (this.comandos[command]) {
      const response = await this.comandos[command](this.data.message)
      return response
    }
  }
}
