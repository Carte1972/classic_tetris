import { BOARD_COLUMNS } from '../config/board_config';
import { FLASH_LINE_COUNT, FLASH_PERIOD_FRAMES } from '../config/render_config';
import type { GameState } from '../engine/types';

/**
 * Progreso de la fase en curso, de 0 (recién empezada) a 1 (terminada).
 * @param state Estado del juego.
 * @returns Progreso en [0, 1].
 */
export function getPhaseProgress(state: GameState): number {
  if (state.phaseFramesTotal <= 0) {
    return 1;
  }
  return (state.phaseFramesTotal - state.phaseFramesRemaining) / state.phaseFramesTotal;
}

/**
 * Indica si una columna de una fila que se está limpiando ya ha desaparecido. Las
 * columnas se borran por parejas desde el centro hacia los lados.
 * @param column Columna (0–9).
 * @param progress Progreso de la animación en [0, 1].
 * @returns `true` si la celda ya no debe dibujarse.
 */
export function isColumnCleared(column: number, progress: number): boolean {
  const half = BOARD_COLUMNS / 2;
  const clearedPairs = Math.min(half, Math.floor(progress * (half + 1)));
  const distanceFromCenter = column < half ? half - 1 - column : column - half;
  return distanceFromCenter < clearedPairs;
}

/**
 * Indica si el fondo del pozo debe destellar (al limpiar 4 líneas, en frames alternos).
 * @param state Estado del juego.
 * @returns `true` si el fondo debe dibujarse con el color de destello.
 */
export function isBoardFlashing(state: GameState): boolean {
  if (state.phase !== 'lineClear' || state.clearingRows.length < FLASH_LINE_COUNT) {
    return false;
  }
  return Math.floor(state.phaseFramesRemaining / FLASH_PERIOD_FRAMES) % 2 === 1;
}
