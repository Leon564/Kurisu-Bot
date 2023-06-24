import { BaileysSocket, Utils } from '../interfaces/types'
const doReplies = !process.argv.includes("--no-reply");

type Options = {
  bailey: () => Promise<BaileysSocket>
  commandHandler: any
}

export class WABot {
  constructor (private options: Options) {}

  static setup (options: Options): WABot {
    return new WABot(options)
  }

  async start () {
    const { bailey, commandHandler } = this.options
    const socket = await bailey()
    socket.ev.on('messages.upsert', ({ messages, type }: { messages: any, type:string }) => {
      if (type !== 'notify' && doReplies) return
      commandHandler.start(socket, messages[0])
    })
  }
}