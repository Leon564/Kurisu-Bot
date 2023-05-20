import { WABot } from './shared/utils/loader'
import socket from './shared/infrastructure/baileys/baileys'
import commandHandler from './lib/commands/commandHandler'

WABot.setup({
  bailey: socket,
  commandHandler: commandHandler
}).start()
