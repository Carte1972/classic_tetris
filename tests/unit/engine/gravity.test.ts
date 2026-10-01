import { describe, expect, it } from 'vitest';
import { getGravityFrames } from '../../../src/engine/gravity';

describe('getGravityFrames (tabla de NES a 60 fps)', () => {
  it.each([
    [0, 48],
    [1, 43],
    [2, 38],
    [3, 33],
    [4, 28],
    [5, 23],
    [6, 18],
    [7, 13],
    [8, 8],
    [9, 6],
    [10, 5],
    [12, 5],
    [13, 4],
    [15, 4],
    [16, 3],
    [18, 3],
    [19, 2],
    [28, 2],
    [29, 1],
  ])('nivel %i: %i frames por fila', (level, frames) => {
    expect(getGravityFrames(level)).toBe(frames);
  });

  it('a partir del nivel 29 mantiene 1 frame por fila', () => {
    expect(getGravityFrames(30)).toBe(1);
    expect(getGravityFrames(99)).toBe(1);
  });

  it('trata niveles negativos como el nivel 0', () => {
    expect(getGravityFrames(-1)).toBe(48);
  });
});
