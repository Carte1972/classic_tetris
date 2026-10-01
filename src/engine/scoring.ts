import { LINE_CLEAR_BASE_POINTS, LINES_PER_LEVEL } from '../config/scoring_config';

/**
 * Puntos por limpiar líneas: 40 / 100 / 300 / 1200 × (nivel + 1).
 * @param linesCleared Líneas limpiadas a la vez (0–4).
 * @param level Nivel en el momento de limpiarlas.
 * @returns Puntos obtenidos.
 */
export function getLineClearScore(linesCleared: number, level: number): number {
  const basePoints = LINE_CLEAR_BASE_POINTS[linesCleared];
  if (basePoints === undefined) {
    throw new RangeError(`Número de líneas no válido: ${linesCleared}`);
  }
  return basePoints * (level + 1);
}

/**
 * Nivel según las líneas totales, como en NES: nunca por debajo del nivel inicial.
 * @param startLevel Nivel inicial elegido.
 * @param lines Líneas totales limpiadas.
 * @returns Nivel actual.
 */
export function calculateLevel(startLevel: number, lines: number): number {
  return Math.max(startLevel, Math.floor(lines / LINES_PER_LEVEL));
}
