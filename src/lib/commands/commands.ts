import greet from '../useCases/greetings'
import dice from '../useCases/dice'

export class commands {
  private comandos: { [key: string]: Function } = {}
  constructor (private data: any) {
    this.comandos = {
      greet,
      dice,
      hola: greet
    }
  }

  static execute (data: any) {
    return new commands(data).getCommand()
  }

  getCommand () {
    const command = this.data.message.command
    if (this.comandos[command]) {
      const response = this.comandos[command](this.data.message)
      return response
    }
  }
}
