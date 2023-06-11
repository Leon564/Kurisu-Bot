import { MessageData, SendData } from '../../shared/interfaces/types'

const help = (data: MessageData): SendData => {
  return {
    type: 'text',
    text: '¡Hola! Soy Kurisu-Bot.\nActualmente, solo están disponibles los siguientes comandos:\n\n- !help\n- !sticker\n- !img\n- !gif\n- !music\n- !yt\n\n los demás comandos no están funcionando temporalmente.',
    quoted: true,
    reacttion: '🤖'
  }
}

export default help
