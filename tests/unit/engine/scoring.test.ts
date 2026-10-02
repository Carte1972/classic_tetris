import { describe, expect, it } from 'vitest';
import { getLevelGoal, getLineClearScore } from '../../../src/engine/scoring';

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

describe('getLevelGoal', () => {
  it('el primer nivel pide 10 líneas y cada uno siguiente 2 más', () => {
    expect(getLevelGoal(0)).toBe(10);
    expect(getLevelGoal(1)).toBe(12);
    expect(getLevelGoal(2)).toBe(14);
    expect(getLevelGoal(10)).toBe(30);
  });

  it('trata valores negativos como el primer nivel', () => {
    expect(getLevelGoal(-1)).toBe(10);
  });
});
