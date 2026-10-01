import { describe, expect, it } from 'vitest';
import { BOARD_COLUMNS, TOTAL_ROWS } from '../../../src/config/board_config';
import {
  createEmptyBoard,
  findFullRows,
  getCell,
  isInsideBoard,
  isRowFull,
  lockPiece,
  removeRows,
} from '../../../src/engine/board';
import { boardWithBottomRows, filledRow } from './helpers';

describe('board', () => {
  it('crea un tablero vacío de 10 × 22 (20 visibles + 2 ocultas)', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(TOTAL_ROWS);
    expect(TOTAL_ROWS).toBe(22);
    for (const row of board) {
      expect(row).toHaveLength(BOARD_COLUMNS);
      expect(row.every((cell) => cell === null)).toBe(true);
    }
  });

  it('distingue posiciones dentro y fuera del tablero', () => {
    expect(isInsideBoard(0, 0)).toBe(true);
    expect(isInsideBoard(9, 21)).toBe(true);
    expect(isInsideBoard(-1, 0)).toBe(false);
    expect(isInsideBoard(10, 0)).toBe(false);
    expect(isInsideBoard(0, -1)).toBe(false);
    expect(isInsideBoard(0, 22)).toBe(false);
  });

  it('considera vacías las celdas fuera del tablero', () => {
    expect(getCell(createEmptyBoard(), -1, -1)).toBeNull();
  });

  it('fija una pieza sin modificar el tablero original', () => {
    const board = createEmptyBoard();
    const locked = lockPiece(board, { type: 'O', rotation: 0, x: 1, y: 20 });
    expect(getCell(locked, 0, 20)).toBe('O');
    expect(getCell(locked, 1, 20)).toBe('O');
    expect(getCell(locked, 0, 21)).toBe('O');
    expect(getCell(locked, 1, 21)).toBe('O');
    expect(getCell(board, 0, 20)).toBeNull();
  });

  it('detecta filas completas', () => {
    expect(isRowFull(filledRow())).toBe(true);
    expect(isRowFull(filledRow([4]))).toBe(false);
    const board = boardWithBottomRows([filledRow(), filledRow([0]), filledRow()]);
    expect(findFullRows(board)).toEqual([19, 21]);
  });

  it.each([1, 2, 3, 4])('limpia %i líneas y baja las filas de encima', (count) => {
    const marker = filledRow([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    const full = Array.from({ length: count }, () => filledRow());
    const board = boardWithBottomRows([marker, ...full]);
    const cleared = removeRows(board, findFullRows(board));
    expect(cleared).toHaveLength(TOTAL_ROWS);
    expect(findFullRows(cleared)).toEqual([]);
    expect(cleared[TOTAL_ROWS - 1]).toEqual(marker);
    expect(cleared.slice(0, TOTAL_ROWS - 1).every((row) => row.every((c) => c === null))).toBe(
      true,
    );
  });

  it('limpia filas no contiguas conservando las intermedias', () => {
    const middle = filledRow([3]);
    const board = boardWithBottomRows([filledRow(), middle, filledRow()]);
    const cleared = removeRows(board, findFullRows(board));
    expect(cleared[TOTAL_ROWS - 1]).toEqual(middle);
    expect(findFullRows(cleared)).toEqual([]);
  });
});
