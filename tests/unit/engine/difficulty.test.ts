import { describe, expect, it } from 'vitest';
import { isNextPieceVisible } from '../../../src/engine/difficulty';

describe('isNextPieceVisible', () => {
  it('muestra la siguiente pieza hasta el nivel 14 y la oculta desde el 15', () => {
    expect(isNextPieceVisible(0)).toBe(true);
    expect(isNextPieceVisible(14)).toBe(true);
    expect(isNextPieceVisible(15)).toBe(false);
    expect(isNextPieceVisible(29)).toBe(false);
  });
});
