/**
 * Letras (cirílicas) del título dibujadas con bloques: cada letra es una matriz de 5 × 5 en la que
 * `#` es un bloque y `.` un hueco.
 */
export const TITLE_GLYPHS: Readonly<Record<string, readonly string[]>> = {
  Т: ['#####', '..#..', '..#..', '..#..', '..#..'],
  Е: ['#####', '#....', '####.', '#....', '#####'],
  Р: ['####.', '#...#', '####.', '#....', '#....'],
  И: ['#...#', '#..##', '#.#.#', '##..#', '#...#'],
  С: ['.####', '#....', '#....', '#....', '.####'],
};

/** Columnas de separación entre letras del título. */
export const TITLE_LETTER_SPACING = 1;

/** Factor de escala con el que se muestra el título en pantalla. */
export const TITLE_SCALE = 2;
