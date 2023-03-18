import { MessageBody, SendData } from '../../shared/interfaces/types'

const dices = [
  'https://i.ibb.co/MRNM54z/1.webp',
  'https://i.ibb.co/8NrTNXP/2.webp',
  'https://i.ibb.co/ngmCmjN/3.webp',
  'https://i.ibb.co/vcp6NKL/4.webp',
  'https://i.ibb.co/hDj6Sm4/5.webp',
  'https://i.ibb.co/zbS79jQ/6.webp'
]

const dice = (m: MessageBody): SendData => {
  return {
    type: 'sticker',
    media: dices[Math.floor(Math.random() * dices.length)],
    quoted: true,
    reacttion: '🎲'
  }
}

export default dice
