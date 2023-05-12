import { WABot } from './shared/utils/loader'
import socket from './shared/infrastructure/baileys/baileys'
import commandHandler from './lib/commands/commandHandler'
import MediaTube from 'C:/Users/nleon/nodejs projects/mediatube'

WABot.setup({
  bailey: socket,
  commandHandler: commandHandler,
  utils: {
    mp3Downloader: new MediaTube({
      path: './',
      AudioQuality: 'highestaudio'
    }).Mp3Downloader(),
    sendReply: null as any

  }
}).start()
