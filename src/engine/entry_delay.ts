import { TOTAL_ROWS } from '../config/board_config';
import {
  ENTRY_DELAY_MIN_FRAMES,
  ENTRY_DELAY_REDUCTION_PER_LEVEL,
} from '../config/difficulty_config';
import {
  ENTRY_DELAY_BASE_FRAMES,
  ENTRY_DELAY_BOTTOM_ROWS,
  ENTRY_DELAY_MAX_FRAMES,
  ENTRY_DELAY_ROWS_PER_STEP,
  ENTRY_DELAY_STEP_FRAMES,
} from '../config/timing_config';

/**
 * Retardo de entrada (ARE) de NES: 10 frames si la pieza se fija en las 2 filas más
 * bajas y 2 frames más por cada tramo de 4 filas por encima, hasta un máximo de 18.
 * Cada nivel resta 1 frame, sin bajar del mínimo.
 * @param pivotRow Fila del pivote de la pieza al fijarse.
 * @param level Nivel actual.
 * @returns Frames de espera antes de la siguiente pieza.
 */
export function getEntryDelayFrames(pivotRow: number, level: number): number {
  const rowsFromBottom = TOTAL_ROWS - 1 - pivotRow;
  const steps =
    rowsFromBottom < ENTRY_DELAY_BOTTOM_ROWS
      ? 0
      : Math.floor((rowsFromBottom - ENTRY_DELAY_BOTTOM_ROWS) / ENTRY_DELAY_ROWS_PER_STEP) + 1;
  const nesDelay = Math.min(
    ENTRY_DELAY_MAX_FRAMES,
    ENTRY_DELAY_BASE_FRAMES + steps * ENTRY_DELAY_STEP_FRAMES,
  );
  return Math.max(
    ENTRY_DELAY_MIN_FRAMES,
    nesDelay - ENTRY_DELAY_REDUCTION_PER_LEVEL * Math.max(0, level),
  );
}
