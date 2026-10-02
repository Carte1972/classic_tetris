// Narración del vídeo, frase a frase, tal y como la lee la voz (guion aprobado,
// video/guion.md). Cada frase se genera como un clip independiente con su velocidad
// (`say -r`), y la pausa que la sigue la pone el montaje.

/**
 * @typedef {object} Frase
 * @property {string} id Número de la frase en el guion (por ejemplo, "3.4").
 * @property {string} texto Texto exacto para la síntesis de voz.
 * @property {number} velocidad Palabras por minuto para `say -r`.
 * @property {number} pausaMs Silencio después de la frase dentro de la escena (ms).
 */

/**
 * @typedef {object} EscenaNarrada
 * @property {number} escena Número de la escena.
 * @property {Frase[]} frases Frases en orden.
 */

/** @type {EscenaNarrada[]} */
export const NARRACION = [
  {
    escena: 2,
    frases: [
      {
        id: '2.1',
        texto: 'Moscú... mil novecientos ochenta y cuatro.',
        velocidad: 170,
        pausaMs: 500,
      },
      {
        id: '2.2',
        texto: 'En la Academia de Ciencias, Alexéi Páshitnov crea un juego de bloques que caen...',
        velocidad: 175,
        pausaMs: 250,
      },
      { id: '2.3', texto: '¡Tetris!', velocidad: 190, pausaMs: 900 },
      {
        id: '2.4',
        texto:
          'En mil novecientos ochenta y nueve, las versiones de Guéim Boi y Nes lo llevan a todo el mundo.',
        velocidad: 180,
        pausaMs: 450,
      },
      {
        id: '2.5',
        texto: 'Por eso este Tetris se juega en su casa: ¡la Plaza Roja de Moscú!',
        velocidad: 175,
        pausaMs: 0,
      },
    ],
  },
  {
    escena: 3,
    frases: [
      { id: '3.1', texto: 'Caen piezas de siete formas.', velocidad: 195, pausaMs: 300 },
      {
        id: '3.2',
        texto: 'Gíralas, muévelas... y encájalas para completar líneas.',
        velocidad: 195,
        pausaMs: 300,
      },
      {
        id: '3.3',
        texto: 'Cada línea completa desaparece y suma puntos.',
        velocidad: 195,
        pausaMs: 350,
      },
      {
        id: '3.4',
        texto: '¿Y si haces cuatro a la vez? ¡Muchos más puntos!',
        velocidad: 200,
        pausaMs: 900,
      },
      {
        id: '3.5',
        texto: 'Pero cuidado: si las piezas llegan arriba... se acabó.',
        velocidad: 180,
        pausaMs: 650,
      },
      {
        id: '3.6',
        texto:
          'Cada nivel tiene un objetivo: diez líneas en el primero, y dos más en cada nivel siguiente.',
        velocidad: 185,
        pausaMs: 300,
      },
      {
        id: '3.7',
        texto: 'Al cumplirlo, pasas al siguiente con el tablero vacío.',
        velocidad: 190,
        pausaMs: 500,
      },
      { id: '3.8', texto: 'No hay final: se juega hasta perder.', velocidad: 175, pausaMs: 500 },
      {
        id: '3.9',
        texto:
          'Y cada nivel es más rápido, salen más piezas difíciles... y desde el nivel quince, ¡ya no ves la siguiente pieza!',
        velocidad: 205,
        pausaMs: 0,
      },
    ],
  },
  {
    escena: 4,
    frases: [
      { id: '4.1', texto: 'Las flechas mueven y bajan la pieza.', velocidad: 200, pausaMs: 400 },
      { id: '4.2', texto: 'La flecha arriba y la zeta, la giran.', velocidad: 200, pausaMs: 400 },
      { id: '4.3', texto: 'Y con la pe... ¡pausa!', velocidad: 200, pausaMs: 0 },
    ],
  },
  {
    escena: 5,
    frases: [
      {
        id: '5.1',
        texto:
          'Y mientras juegas, la Plaza Roja cambia con el día, el tiempo... ¡y las fiestas rusas!',
        velocidad: 180,
        pausaMs: 12000,
      },
      {
        id: '5.2',
        texto: 'De fondo suenan Korobéiniki y Kalinka, dos canciones populares rusas.',
        velocidad: 180,
        pausaMs: 0,
      },
    ],
  },
  {
    escena: 6,
    frases: [
      { id: '6.1', texto: '¿Y al superar cada nivel?', velocidad: 175, pausaMs: 300 },
      { id: '6.2', texto: 'Te espera una celebración...', velocidad: 175, pausaMs: 4000 },
      { id: '6.3', texto: '...y hay más sorpresas por descubrir.', velocidad: 170, pausaMs: 700 },
      {
        id: '6.4',
        texto: 'Tus diez mejores partidas quedan en los récords. ¿Te atreves a superarlas?',
        velocidad: 190,
        pausaMs: 0,
      },
    ],
  },
  {
    escena: 7,
    frases: [
      { id: '7.1', texto: '¡Ven a jugar a Tetris en la Plaza Roja!', velocidad: 180, pausaMs: 0 },
    ],
  },
];
