// Narración del vídeo, frase a frase, tal y como la lee la voz (guion aprobado,
// video/guion.md). Cada frase se genera como un clip independiente y la pausa que la
// sigue la pone el montaje. Todas van a la misma velocidad, para que la voz suene
// continua de principio a fin.

/**
 * Velocidad de la voz en todo el vídeo (palabras por minuto para `say -r`): la de la
 * primera frase. El autor pidió que todas las frases fueran a esta velocidad.
 */
export const VELOCIDAD = 170;

/**
 * @typedef {object} Frase
 * @property {string} id Número de la frase en el guion (por ejemplo, "3.4").
 * @property {string} texto Texto exacto para la síntesis de voz.
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
        pausaMs: 500,
      },
      {
        id: '2.2',
        texto: 'En la Academia de Ciencias, Alexéi Páshitnov crea un juego de bloques que caen...',
        pausaMs: 250,
      },
      { id: '2.3', texto: '¡Tetris!', pausaMs: 900 },
      {
        id: '2.4',
        texto:
          'En mil novecientos ochenta y nueve, las versiones de Guéim Boi y Nes lo llevan a todo el mundo.',
        pausaMs: 450,
      },
      {
        id: '2.5',
        texto: 'Por eso este Tetris se juega en su casa: ¡la Plaza Roja de Moscú!',
        pausaMs: 0,
      },
    ],
  },
  {
    escena: 3,
    frases: [
      { id: '3.1', texto: 'Caen piezas de siete formas.', pausaMs: 300 },
      {
        id: '3.2',
        texto: 'Gíralas, muévelas... y encájalas para completar líneas.',
        pausaMs: 300,
      },
      {
        id: '3.3',
        texto: 'Cada línea completa desaparece y suma puntos.',
        pausaMs: 350,
      },
      {
        id: '3.4',
        texto: '¿Y si haces cuatro a la vez? ¡Muchos más puntos!',
        pausaMs: 900,
      },
      {
        id: '3.5',
        texto: 'Pero cuidado: si las piezas llegan arriba... se acabó.',
        pausaMs: 650,
      },
      {
        id: '3.6',
        texto:
          'Cada nivel tiene un objetivo: diez líneas en el primero, y dos más en cada nivel siguiente.',
        pausaMs: 300,
      },
      {
        id: '3.7',
        texto: 'Al cumplirlo, pasas al siguiente con el tablero vacío.',
        pausaMs: 500,
      },
      { id: '3.8', texto: 'No hay final: se juega hasta perder.', pausaMs: 500 },
      {
        id: '3.9',
        texto:
          'Y cada nivel es más rápido, salen más piezas difíciles... y desde el nivel quince, ¡ya no ves la siguiente pieza!',
        pausaMs: 0,
      },
    ],
  },
  {
    escena: 4,
    frases: [
      { id: '4.1', texto: 'Las flechas mueven y bajan la pieza.', pausaMs: 400 },
      { id: '4.2', texto: 'La flecha arriba y la zeta, la giran.', pausaMs: 400 },
      { id: '4.3', texto: 'Y con la pe... ¡pausa!', pausaMs: 0 },
    ],
  },
  {
    escena: 5,
    frases: [
      {
        id: '5.1',
        texto:
          'Y mientras juegas, la Plaza Roja cambia con el día, el tiempo... ¡y las fiestas rusas!',
        pausaMs: 12000,
      },
      {
        id: '5.2',
        texto: 'De fondo suenan Korobéiniki y Kalinka, dos canciones populares rusas.',
        pausaMs: 0,
      },
    ],
  },
  {
    escena: 6,
    frases: [
      { id: '6.1', texto: '¿Y al superar cada nivel?', pausaMs: 300 },
      { id: '6.2', texto: 'Te espera una celebración...', pausaMs: 2800 },
      { id: '6.3', texto: '...y hay más sorpresas por descubrir.', pausaMs: 700 },
      {
        id: '6.4',
        texto: 'Tus diez mejores partidas quedan en los récords. ¿Te atreves a superarlas?',
        pausaMs: 0,
      },
    ],
  },
  {
    escena: 7,
    frases: [{ id: '7.1', texto: '¡Ven a jugar a Tetris en la Plaza Roja!', pausaMs: 0 }],
  },
];
