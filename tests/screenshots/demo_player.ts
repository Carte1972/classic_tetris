import { BOARD_COLUMNS } from '../../src/config/board_config';
import { findFullRows, lockPiece, removeRows } from '../../src/engine/board';
import { collides } from '../../src/engine/collision';
import { createSpawnPiece, getRotationCount } from '../../src/engine/tetrominoes';
import type { Board, PieceType } from '../../src/engine/types';

/** Jugada elegida para una pieza: orientación final y columna del pivote. */
export interface Placement {
  readonly rotation: number;
  readonly x: number;
}

/** Pesos de la heurística clásica para valorar un tablero. */
const WEIGHTS = { height: -0.51, lines: 0.76, holes: -0.36, bumpiness: -0.18 } as const;

/** Altura de cada columna del tablero. */
function columnHeights(board: Board): number[] {
  return Array.from({ length: BOARD_COLUMNS }, (_, x) => {
    const top = board.findIndex((row) => row[x] !== null);
    return top === -1 ? 0 : board.length - top;
  });
}

/** Huecos tapados por algún bloque encima. */
function countHoles(board: Board): number {
  let holes = 0;
  for (let x = 0; x < BOARD_COLUMNS; x++) {
    let covered = false;
    for (const row of board) {
      if (row[x] !== null) {
        covered = true;
      } else if (covered) {
        holes++;
      }
    }
  }
  return holes;
}

/** Valoración de un tablero tras colocar una pieza (más alto es mejor). */
function evaluate(board: Board, lines: number): number {
  const heights = columnHeights(board);
  const bumpiness = heights
    .slice(1)
    .reduce((sum, h, i) => sum + Math.abs(h - (heights[i] ?? 0)), 0);
  return (
    WEIGHTS.height * heights.reduce((sum, h) => sum + h, 0) +
    WEIGHTS.lines * lines +
    WEIGHTS.holes * countHoles(board) +
    WEIGHTS.bumpiness * bumpiness
  );
}

/**
 * Elige dónde soltar una pieza probando todas las orientaciones y columnas a las que
 * se llega desde la posición de aparición.
 */
export function choosePlacement(board: Board, type: PieceType): Placement {
  const spawn = createSpawnPiece(type);
  let best: { placement: Placement; score: number } | null = null;
  for (let rotation = 0; rotation < getRotationCount(type); rotation++) {
    for (let x = -2; x < BOARD_COLUMNS + 2; x++) {
      let piece = { ...spawn, rotation, x };
      if (collides(board, piece)) {
        continue;
      }
      while (!collides(board, { ...piece, y: piece.y + 1 })) {
        piece = { ...piece, y: piece.y + 1 };
      }
      const locked = lockPiece(board, piece);
      const full = findFullRows(locked);
      const score = evaluate(removeRows(locked, full), full.length);
      if (best === null || score > best.score) {
        best = { placement: { rotation, x }, score };
      }
    }
  }
  return best?.placement ?? { rotation: 0, x: spawn.x };
}
