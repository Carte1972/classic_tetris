import { TOTAL_ROWS } from '../config/board_config';
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
 * @param pivotRow Fila del pivote de la pieza al fijarse.
 * @returns Frames de espera antes de la siguiente pieza.
 */
export function getEntryDelayFrames(pivotRow: number): number {
  const rowsFromBottom = TOTAL_ROWS - 1 - pivotRow;
  const steps =
    rowsFromBottom < ENTRY_DELAY_BOTTOM_ROWS
      ? 0
      : Math.floor((rowsFromBottom - ENTRY_DELAY_BOTTOM_ROWS) / ENTRY_DELAY_ROWS_PER_STEP) + 1;
  return Math.min(
    ENTRY_DELAY_MAX_FRAMES,
    ENTRY_DELAY_BASE_FRAMES + steps * ENTRY_DELAY_STEP_FRAMES,
  );
}
