import { MessageData, SendData } from '../../shared/interfaces/types'

const greets = [
  'Hola',
  'Holis',
  'Holiwis',
  'Sakese',
  'Hola fe@',
  'Hola wap@',
  'Fue divertido saludarte pero ya no me hables',
  'Hola, como te va',
  'Hola soy Kurisu, como te va?',
  'Hola, no gustas beber una dr. pepper a mi lado?',
  'sabias que la teoría de la relatividad es tan romántica... y a la vez... tan triste.',
  'Hola, te dire mi frase favorita, Los sentimientos son recuerdos que cruzan el tiempo. Los sentimientos son recuerdos que han alcanzado la puerta del destino.',
  'Sabes que pienso, pienso que un mundo donde nadie te recuerda, eso es más cruel aún que la muerte.',
  'No me molestes, estoy ocupada',
  'Oye, que no tienes nada mejor que hacer?'
]

const greet = (data: MessageData): SendData => {
  //select a random greet and return it
  const greet = greets[Math.floor(Math.random() * greets.length)]
  return { type: 'text', text: greet, quoted: true }
}
export default greet
