import { describe, expect, it } from 'vitest';
import { nextRandom, nextRandomInt, normalizeSeed } from '../../../src/engine/random';

describe('random', () => {
  it('es determinista para la misma semilla', () => {
    expect(nextRandom(123)).toEqual(nextRandom(123));
  });

  it('genera valores en [0, 1)', () => {
    let state = normalizeSeed(42);
    for (let i = 0; i < 1000; i++) {
      const result = nextRandom(state);
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThan(1);
      state = result.state;
    }
  });

  it('genera enteros en el rango pedido', () => {
    let state = normalizeSeed(7);
    for (let i = 0; i < 1000; i++) {
      const result = nextRandomInt(state, 8);
      expect(Number.isInteger(result.value)).toBe(true);
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThan(8);
      state = result.state;
    }
  });

  it('normaliza semillas a enteros sin signo de 32 bits', () => {
    expect(normalizeSeed(-1)).toBe(4294967295);
    expect(normalizeSeed(3.9)).toBe(3);
    expect(normalizeSeed(2 ** 32 + 5)).toBe(5);
  });
});
