import { BOARD_COLUMNS, TOTAL_ROWS, VISIBLE_ROWS } from '../config/board_config';
import { getPieceCells } from './tetrominoes';
import type { ActivePiece, Board, BoardRow, Cell } from './types';

/**
 * Crea una fila vacía.
 * @returns Fila sin bloques.
 */
export function createEmptyRow(): BoardRow {
  return Array.from({ length: BOARD_COLUMNS }, (): Cell => null);
}

/**
 * Crea un tablero vacío con las filas ocultas y visibles.
 * @returns Tablero sin bloques.
 */
export function createEmptyBoard(): Board {
  return Array.from({ length: TOTAL_ROWS }, createEmptyRow);
}

/**
 * Indica si una posición está dentro de los límites del tablero.
 * @param x Columna.
 * @param y Fila.
 * @returns `true` si la posición es válida.
 */
export function isInsideBoard(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_COLUMNS && y >= 0 && y < TOTAL_ROWS;
}

/**
 * Contenido de una celda; fuera del tablero se considera vacía.
 * @param board Tablero.
 * @param x Columna.
 * @param y Fila.
 * @returns El contenido de la celda.
 */
export function getCell(board: Board, x: number, y: number): Cell {
  return board[y]?.[x] ?? null;
}

/**
 * Fija una pieza en el tablero.
 * @param board Tablero actual.
 * @param piece Pieza que se fija.
 * @returns Nuevo tablero con las celdas de la pieza ocupadas.
 */
export function lockPiece(board: Board, piece: ActivePiece): Board {
  const cells = getPieceCells(piece);
  return board.map((row, y) =>
    row.map((cell, x) => (cells.some((c) => c.x === x && c.y === y) ? piece.type : cell)),
  );
}

/**
 * Indica si una fila está completa.
 * @param row Fila a comprobar.
 * @returns `true` si no tiene huecos.
 */
export function isRowFull(row: BoardRow): boolean {
  return row.every((cell) => cell !== null);
}

/**
 * Índices de las filas completas, de arriba abajo.
 * @param board Tablero.
 * @returns Índices de fila.
 */
export function findFullRows(board: Board): readonly number[] {
  return board.flatMap((row, y) => (isRowFull(row) ? [y] : []));
}

/**
 * Elimina filas y desplaza hacia abajo las de encima, añadiendo filas vacías arriba.
 * @param board Tablero.
 * @param rows Índices de las filas a eliminar.
 * @returns Nuevo tablero.
 */
export function removeRows(board: Board, rows: readonly number[]): Board {
  const remaining = board.filter((_, y) => !rows.includes(y));
  const emptyRows = Array.from({ length: board.length - remaining.length }, createEmptyRow);
  return [...emptyRows, ...remaining];
}

/**
 * Altura de la pila en filas visibles: distancia desde el fondo hasta la fila más alta
 * con algún bloque (0 si el tablero está vacío).
 * @param board Tablero.
 * @returns Altura de la pila.
 */
export function getStackHeight(board: Board): number {
  const highestRow = board.findIndex((row) => row.some((cell) => cell !== null));
  if (highestRow === -1) {
    return 0;
  }
  return Math.min(board.length - highestRow, VISIBLE_ROWS);
}
