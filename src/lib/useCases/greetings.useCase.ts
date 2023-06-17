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
  'Oye, que no tienes nada mejor que hacer?',
  "¡Tuturu! (Un saludo peculiar de mi personaje)",
  "¡Hola! ¿Cómo estás?",
  "¡Saludos terrestres!",
  "¡Encantada de conocerte!",
  "¡Un saludo científicamente comprobado!",
  "¡Hola, miembro del laboratorio!",
  "¡Saludos desde el mundo de las ecuaciones!",
  "¡Un saludo digno de una cerebrito como yo!",
  "¡Hola, ser humano curioso!",
  "¡Un saludo enviado a través del tiempo y el espacio!",
  "¡Hola, viajero/a del tiempo!",
  "¡Saludos, lector/a de las líneas de Steins;Gate!",
  "¡Saludos, amo/a de las paradojas!",
  "¡Hola, aliado/a de la ciencia y el caos controlado!",
  "¡Saludos, portador/a del poder de Steins;Gate!",
  "¡Un saludo lleno de enigmas y misterios!",
  "¡Hola, explorador/a de posibilidades infinitas!",
  "¡Saludos, compañero/a en este laberinto de realidades alternativas!"
]

const greet = (data: MessageData): SendData => {
  //select a random greet and return it
  const greet = greets[Math.floor(Math.random() * greets.length)]
  return { type: 'text', text: greet, quoted: true, reacttion: '✅' }
}
export default greet
