/**
 * Frames por fila de caída según el nivel, como en NES a 60 fps.
 * El índice es el nivel; a partir del último se usa el último valor.
 */
export const GRAVITY_FRAMES_BY_LEVEL: readonly number[] = [
  48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1,
];
