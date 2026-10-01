import { describe, expect, it } from 'vitest';
import { createEmptyBoard } from '../../../src/engine/board';
import { collides } from '../../../src/engine/collision';
import { boardWithBottomRows, filledRow } from './helpers';

describe('collides', () => {
  const board = createEmptyBoard();

  it('no hay colisión dentro del tablero vacío', () => {
    expect(collides(board, { type: 'T', rotation: 0, x: 5, y: 5 })).toBe(false);
  });

  it('choca con la pared izquierda y la derecha', () => {
    expect(collides(board, { type: 'T', rotation: 0, x: 0, y: 5 })).toBe(true);
    expect(collides(board, { type: 'T', rotation: 0, x: 1, y: 5 })).toBe(false);
    expect(collides(board, { type: 'T', rotation: 0, x: 9, y: 5 })).toBe(true);
    expect(collides(board, { type: 'T', rotation: 0, x: 8, y: 5 })).toBe(false);
  });

  it('choca con el suelo y con el techo', () => {
    expect(collides(board, { type: 'T', rotation: 0, x: 5, y: 21 })).toBe(true);
    expect(collides(board, { type: 'T', rotation: 0, x: 5, y: 20 })).toBe(false);
    expect(collides(board, { type: 'I', rotation: 1, x: 5, y: 1 })).toBe(true);
    expect(collides(board, { type: 'I', rotation: 1, x: 5, y: 2 })).toBe(false);
  });

  it('choca con bloques fijados', () => {
    const stacked = boardWithBottomRows([filledRow([0])]);
    expect(collides(stacked, { type: 'O', rotation: 0, x: 5, y: 20 })).toBe(true);
    expect(collides(stacked, { type: 'O', rotation: 0, x: 5, y: 19 })).toBe(false);
    expect(collides(stacked, { type: 'I', rotation: 1, x: 0, y: 20 })).toBe(false);
  });
});
