import greet from '../useCases/greetings.useCase'
import dice from '../useCases/dice.useCase'
import sticker from '../useCases/sticker.useCase'
import stickerToImage from '../useCases/stickerToImage.useCase'
import stickerToGif from '../useCases/stickerToGif.useCase'
import getElapsedSeconds from '../useCases/ping.useCase'
import { Utils } from '../../shared/interfaces/types'
import help from '../useCases/help.usecase'

export class commands {
  private comandos: { [key: string]: Function } = {}
  constructor (private data: any) {
    this.comandos = {
      greet,
      roll: dice,
      hola: greet,
      sticker: sticker,
      stiker: sticker,
      image: stickerToImage,
      imagen: stickerToImage,
      gif: stickerToGif,
      ping: getElapsedSeconds,
      help: help
    }
  }

  static execute (data: any) {
    return new commands(data).getCommand()
  }

  async getCommand () {
    const command = this.data.message.command
    if (this.comandos[command]) {
      //console.log(this.data)
      const response = await this.comandos[command]({
        data: this.data
      })
      return response
    }
  }
}
