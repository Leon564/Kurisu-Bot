import { BaileysSocket, Utils } from '../interfaces/types'

type Options = {
  bailey: () => Promise<BaileysSocket>
  commandHandler: any
  utils?: Utils
}

export class WABot {
  constructor (private options: Options) {}

  static setup (options: Options): WABot {
    return new WABot(options)
  }

  async start () {
    const { bailey, commandHandler } = this.options
    const socket = await bailey()
    socket.ev.on('messages.upsert', ({ messages }: { messages: any }) =>
      commandHandler.start(socket, messages[0], this.options.utils)
    )
  }
}
