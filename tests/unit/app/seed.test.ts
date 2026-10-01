import { describe, expect, it } from 'vitest';
import { createRandomSeed } from '../../../src/app/seed';

describe('createRandomSeed', () => {
  it('convierte la fuente aleatoria en un entero sin signo de 32 bits', () => {
    expect(createRandomSeed(() => 0)).toBe(0);
    expect(createRandomSeed(() => 0.5)).toBe(2 ** 31);
    expect(createRandomSeed(() => 0.999999999)).toBeLessThan(2 ** 32);
  });

  it('usa Math.random por defecto', () => {
    const seed = createRandomSeed();
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
  });
});
