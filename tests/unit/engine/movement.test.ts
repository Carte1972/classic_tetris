import { describe, expect, it } from 'vitest';
import { BOARD_COLUMNS } from '../../../src/config/board_config';
import { PIECE_TYPES } from '../../../src/config/tetromino_config';
import { createEmptyBoard } from '../../../src/engine/board';
import { collides } from '../../../src/engine/collision';
import { tryMove, tryRotate } from '../../../src/engine/movement';
import { getPieceCells, getRotationCount, rotatePiece } from '../../../src/engine/tetrominoes';
import type { ActivePiece, PieceType } from '../../../src/engine/types';
import { boardWithBottomRows, filledRow } from './helpers';

const board = createEmptyBoard();
const MIDDLE_ROW = 10;

/** Pieza en la orientación dada, pegada a la pared indicada. */
function againstWall(type: PieceType, rotation: number, wall: 'left' | 'right'): ActivePiece {
  let piece: ActivePiece = { type, rotation, x: 5, y: MIDDLE_ROW };
  const dx = wall === 'left' ? -1 : 1;
  for (let moved = tryMove(board, piece, dx, 0); moved !== null;) {
    piece = moved;
    moved = tryMove(board, piece, dx, 0);
  }
  return piece;
}

describe('tryMove', () => {
  it('desplaza la pieza si hay sitio', () => {
    const piece: ActivePiece = { type: 'T', rotation: 0, x: 5, y: 5 };
    expect(tryMove(board, piece, -1, 0)).toEqual({ ...piece, x: 4 });
    expect(tryMove(board, piece, 0, 1)).toEqual({ ...piece, y: 6 });
  });

  it('devuelve null si el movimiento choca', () => {
    expect(tryMove(board, { type: 'T', rotation: 0, x: 1, y: 5 }, -1, 0)).toBeNull();
    expect(tryMove(board, { type: 'O', rotation: 0, x: 5, y: 20 }, 0, 1)).toBeNull();
  });

  it.each(PIECE_TYPES)('%s pegada a cada pared ocupa la primera o la última columna', (type) => {
    for (let rotation = 0; rotation < getRotationCount(type); rotation++) {
      const left = getPieceCells(againstWall(type, rotation, 'left'));
      const right = getPieceCells(againstWall(type, rotation, 'right'));
      expect(Math.min(...left.map((c) => c.x))).toBe(0);
      expect(Math.max(...right.map((c) => c.x))).toBe(BOARD_COLUMNS - 1);
    }
  });
});

describe('tryRotate en los bordes (rotación NES, sin wall kicks)', () => {
  it.each(PIECE_TYPES)('%s: junto a las paredes rota solo si cabe y nunca se desplaza', (type) => {
    for (const wall of ['left', 'right'] as const) {
      for (let rotation = 0; rotation < getRotationCount(type); rotation++) {
        const piece = againstWall(type, rotation, wall);
        for (const direction of [1, -1] as const) {
          const result = tryRotate(board, piece, direction);
          const expected = rotatePiece(piece, direction);
          if (collides(board, expected)) {
            expect(result).toBeNull();
          } else {
            expect(result).toEqual(expected);
          }
        }
      }
    }
  });

  it('la I vertical pegada a la pared izquierda no puede rotar', () => {
    const piece = againstWall('I', 1, 'left');
    expect(piece.x).toBe(0);
    expect(tryRotate(board, piece, 1)).toBeNull();
    expect(tryRotate(board, piece, -1)).toBeNull();
  });

  it('la I vertical pegada a la pared derecha sí puede rotar (ocupa x-2..x+1)', () => {
    const piece = { type: 'I', rotation: 1, x: 8, y: MIDDLE_ROW } as const;
    expect(tryRotate(board, piece, 1)).toEqual({ ...piece, rotation: 0 });
    const atWall = againstWall('I', 1, 'right');
    expect(atWall.x).toBe(9);
    expect(tryRotate(board, atWall, 1)).toBeNull();
  });

  it('la T vertical pegada a una pared no puede rotar hacia ella', () => {
    const leftPointing = againstWall('T', 1, 'right');
    expect(tryRotate(board, leftPointing, 1)).toBeNull();
    const rightPointing = againstWall('T', 3, 'left');
    expect(tryRotate(board, rightPointing, -1)).toBeNull();
  });

  it('la O no cambia al rotar', () => {
    const piece: ActivePiece = { type: 'O', rotation: 0, x: 1, y: MIDDLE_ROW };
    expect(tryRotate(board, piece, 1)).toEqual(piece);
  });

  it('no rota si la nueva orientación choca con bloques fijados', () => {
    const stacked = boardWithBottomRows([filledRow()]);
    const flat: ActivePiece = { type: 'I', rotation: 0, x: 5, y: 20 };
    expect(tryRotate(stacked, flat, 1)).toBeNull();
  });

  it('no rota si la nueva orientación se sale por el techo', () => {
    const flat: ActivePiece = { type: 'I', rotation: 0, x: 5, y: 0 };
    expect(tryRotate(board, flat, 1)).toBeNull();
  });
});
