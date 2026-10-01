import { collides } from './collision';
import { rotatePiece, type RotationDirection } from './tetrominoes';
import type { ActivePiece, Board } from './types';

/**
 * Intenta desplazar una pieza.
 * @param board Tablero.
 * @param piece Pieza a mover.
 * @param dx Desplazamiento horizontal en columnas.
 * @param dy Desplazamiento vertical en filas.
 * @returns La pieza desplazada, o `null` si el movimiento choca.
 */
export function tryMove(
  board: Board,
  piece: ActivePiece,
  dx: number,
  dy: number,
): ActivePiece | null {
  const moved = { ...piece, x: piece.x + dx, y: piece.y + dy };
  return collides(board, moved) ? null : moved;
}

/**
 * Intenta rotar una pieza con la rotación de NES: sin wall kicks, si choca se descarta.
 * @param board Tablero.
 * @param piece Pieza a rotar.
 * @param direction Sentido de la rotación.
 * @returns La pieza rotada, o `null` si la rotación choca.
 */
export function tryRotate(
  board: Board,
  piece: ActivePiece,
  direction: RotationDirection,
): ActivePiece | null {
  const rotated = rotatePiece(piece, direction);
  return collides(board, rotated) ? null : rotated;
}
