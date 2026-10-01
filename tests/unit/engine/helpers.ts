import { BOARD_COLUMNS, TOTAL_ROWS } from '../../../src/config/board_config';
import { createEmptyRow } from '../../../src/engine/board';
import type { Board, BoardRow } from '../../../src/engine/types';

/** Fila con todas las celdas ocupadas salvo las columnas indicadas. */
export function filledRow(holes: readonly number[] = []): BoardRow {
  return Array.from({ length: BOARD_COLUMNS }, (_, x) => (holes.includes(x) ? null : 'O'));
}

/** Tablero vacío salvo las filas inferiores indicadas (la última del array es la del fondo). */
export function boardWithBottomRows(bottomRows: readonly BoardRow[]): Board {
  const emptyCount = TOTAL_ROWS - bottomRows.length;
  return [...Array.from({ length: emptyCount }, createEmptyRow), ...bottomRows];
}
