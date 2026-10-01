/** Rango de semillas posibles (enteros sin signo de 32 bits). */
const SEED_RANGE = 2 ** 32;

/**
 * Genera una semilla aleatoria para una partida normal (no reproducible).
 * @param random Fuente de aleatoriedad en [0, 1) (inyectable para tests).
 * @returns Semilla entera sin signo de 32 bits.
 */
export function createRandomSeed(random: () => number = Math.random): number {
  return Math.floor(random() * SEED_RANGE) >>> 0;
}
