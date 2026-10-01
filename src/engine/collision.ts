import { getCell, isInsideBoard } from './board';
import { getPieceCells } from './tetrominoes';
import type { ActivePiece, Board } from './types';

/**
 * Indica si una pieza se sale del tablero o se solapa con bloques fijados.
 * @param board Tablero.
 * @param piece Pieza a comprobar.
 * @returns `true` si hay colisión.
 */
export function collides(board: Board, piece: ActivePiece): boolean {
  return getPieceCells(piece).some(
    (cell) => !isInsideBoard(cell.x, cell.y) || getCell(board, cell.x, cell.y) !== null,
  );
}
