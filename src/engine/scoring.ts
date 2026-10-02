import { LEVEL_GOAL_BASE_LINES, LEVEL_GOAL_STEP_LINES } from '../config/difficulty_config';
import { LINE_CLEAR_BASE_POINTS } from '../config/scoring_config';

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
 * Líneas que pide un nivel: 10 el primero de la partida y 2 más cada nivel siguiente.
 * @param levelsCompleted Niveles ya superados en esta partida.
 * @returns Objetivo de líneas del nivel.
 */
export function getLevelGoal(levelsCompleted: number): number {
  return LEVEL_GOAL_BASE_LINES + LEVEL_GOAL_STEP_LINES * Math.max(0, levelsCompleted);
}
