import { describe, expect, it } from 'vitest';
import { calculateLevel, getLineClearScore } from '../../../src/engine/scoring';

describe('getLineClearScore', () => {
  it.each([
    [1, 0, 40],
    [2, 0, 100],
    [3, 0, 300],
    [4, 0, 1200],
    [1, 9, 400],
    [4, 9, 12000],
    [2, 19, 2000],
    [0, 5, 0],
  ])('%i líneas en el nivel %i dan %i puntos', (lines, level, points) => {
    expect(getLineClearScore(lines, level)).toBe(points);
  });

  it('rechaza un número de líneas imposible', () => {
    expect(() => getLineClearScore(5, 0)).toThrow(RangeError);
  });
});

describe('calculateLevel', () => {
  it('sube un nivel cada 10 líneas', () => {
    expect(calculateLevel(0, 0)).toBe(0);
    expect(calculateLevel(0, 9)).toBe(0);
    expect(calculateLevel(0, 10)).toBe(1);
    expect(calculateLevel(0, 25)).toBe(2);
    expect(calculateLevel(0, 290)).toBe(29);
  });

  it('nunca baja del nivel inicial (regla de NES)', () => {
    expect(calculateLevel(5, 0)).toBe(5);
    expect(calculateLevel(5, 59)).toBe(5);
    expect(calculateLevel(5, 60)).toBe(6);
    expect(calculateLevel(9, 99)).toBe(9);
    expect(calculateLevel(9, 100)).toBe(10);
  });
});
