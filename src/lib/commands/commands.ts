import greet from '../useCases/greetings.useCase'
import dice from '../useCases/dice'
import music from '../useCases/music.useCase'

export class commands {
  private comandos: { [key: string]: Function } = {}
  constructor (private data: any) {
    this.comandos = {
      greet,
      dice,
      hola: greet,
      music: music
    }
  }

  static execute (data: any) {
    return new commands(data).getCommand()
  }

  async getCommand  () {
    const command = this.data.message.command
    if (this.comandos[command]) {
      const response = await this.comandos[command](this.data.message)
      return response
    }
  }
}
