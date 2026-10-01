/** Movimientos de la coreografía de celebración. */
export type DanceMovement = 'enter' | 'prisiadka' | 'jump' | 'exit';

/** Tramo de la coreografía. */
export interface ChoreographyStep {
  readonly movement: DanceMovement;
  /** Duración del tramo (ms). */
  readonly durationMs: number;
  /** Veces que se repiten los fotogramas del movimiento durante el tramo. */
  readonly cycles: number;
}

/**
 * Coreografía (4 s): entra desde un lateral, hace la prisiadka (dos ciclos de patadas
 * alternas), remata con un salto abierto tocándose las puntas de los pies y sale por el
 * otro lado saludando.
 */
export const CHOREOGRAPHY: readonly ChoreographyStep[] = [
  { movement: 'enter', durationMs: 1000, cycles: 1 },
  { movement: 'prisiadka', durationMs: 1600, cycles: 2 },
  { movement: 'jump', durationMs: 700, cycles: 1 },
  { movement: 'exit', durationMs: 700, cycles: 1 },
];

/** Duración total de la celebración (ms). */
export const CELEBRATION_DURATION_MS = CHOREOGRAPHY.reduce((total, s) => total + s.durationMs, 0);

/** Fotogramas distintos de cada movimiento. */
export const FRAMES_PER_MOVEMENT = 6;

/** Ancho del escenario en píxeles lógicos (16:9). */
export const STAGE_WIDTH = 213;

/** Alto del escenario en píxeles lógicos. */
export const STAGE_HEIGHT = 120;

/** Fila del suelo del escenario (donde apoyan los pies). */
export const STAGE_GROUND_Y = 104;

/** Grosor de la franja del suelo (px lógicos). */
export const STAGE_FLOOR_THICKNESS = 2;

/** Posición horizontal de entrada (fuera del escenario por la izquierda). */
export const ENTER_START_X = -24;

/** Posición horizontal donde baila el personaje. */
export const DANCE_CENTER_X = 106;

/** Posición horizontal de salida (fuera del escenario por la derecha). */
export const EXIT_END_X = 240;

/** Altura del salto en cada fotograma del movimiento `jump` (px lógicos). */
export const JUMP_HEIGHTS: readonly number[] = [0, 8, 18, 24, 16, 0];

/** Balanceo lateral de la bailarina durante la prisiadka, por fotograma (px lógicos). */
export const WOBBLE_OFFSETS: readonly number[] = [0, 1, -1, 2, -1, 0];

/** Momento en que la matrioska se abre (ms desde el inicio, a mitad del baile). */
export const MATRYOSHKA_OPEN_AT_MS = 1800;

/** Duración de la animación de las dos mitades de la matrioska al abrirse (ms). */
export const MATRYOSHKA_SHELL_MS = 500;

/** Desplazamiento máximo de las mitades de la matrioska al abrirse (px lógicos). */
export const MATRYOSHKA_SHELL_TRAVEL = 30;

/**
 * Posición del balón del gigante respecto a sus pies en cada fotograma de cada
 * movimiento: `x` hacia la derecha e `y` (altura del balón) hacia arriba.
 */
export const BALL_OFFSETS: Readonly<Record<DanceMovement, readonly { x: number; y: number }[]>> = {
  enter: [
    { x: 12, y: 12 },
    { x: 12, y: 6 },
    { x: 12, y: 0 },
    { x: 12, y: 6 },
    { x: 12, y: 12 },
    { x: 12, y: 6 },
  ],
  prisiadka: [
    { x: 16, y: 0 },
    { x: 16, y: 6 },
    { x: 16, y: 12 },
    { x: 16, y: 6 },
    { x: 16, y: 0 },
    { x: 16, y: 6 },
  ],
  jump: [
    { x: 8, y: 34 },
    { x: 6, y: 40 },
    { x: 4, y: 44 },
    { x: 2, y: 36 },
    { x: 2, y: 18 },
    { x: 4, y: 2 },
  ],
  exit: [
    { x: 10, y: 18 },
    { x: 10, y: 18 },
    { x: 10, y: 18 },
    { x: 10, y: 18 },
    { x: 10, y: 18 },
    { x: 10, y: 18 },
  ],
};

/** Ancho de la matriz donde se compone cada fotograma de un bailarín (px lógicos). */
export const FIGURE_WIDTH = 48;

/** Alto de la matriz donde se compone cada fotograma de un bailarín (px lógicos). */
export const FIGURE_HEIGHT = 56;
