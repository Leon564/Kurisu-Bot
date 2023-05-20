import { SendData, UseCaseParams } from '../../shared/interfaces/types'

const help = ({ data, utils }: UseCaseParams): SendData => {
  return {
    type: 'text',
    text: '¡Hola! Soy Kurisu-Bot.\nActualmente, solo están disponibles los siguientes comandos:\n\n- !help\n- !sticker\n- !img\n- !gif\n\nLamentablemente,(el comando !music produce un error que apaga el bot) los demás comandos no están funcionando temporalmente.',
    quoted: true,
    reacttion: '🤖'
  }
}

export default help
