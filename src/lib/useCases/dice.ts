import { SendData } from '../../shared/interfaces/types'

const dice = (data: any, sides: number = 6): SendData => {
  const roll = Math.floor(Math.random() * sides) + 1
  return {
    type: 'text',
    text: `You rolled a ${roll}`,
    quoted: true,
    reacttion: '🎲'
  }
}

export default dice
