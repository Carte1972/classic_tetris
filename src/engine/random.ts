/** Incremento del estado de mulberry32. */
const MULBERRY32_INCREMENT = 0x6d2b79f5;

/** Constante de mezcla de mulberry32. */
const MULBERRY32_MIX = 61;

/** Rango de un entero sin signo de 32 bits (2^32). */
const UINT32_RANGE = 4294967296;

/** Resultado de una tirada del generador pseudoaleatorio. */
export interface RandomResult {
  /** Valor obtenido. */
  readonly value: number;
  /** Nuevo estado del generador. */
  readonly state: number;
}

/**
 * Convierte cualquier número en un estado válido del generador (entero sin signo de 32 bits).
 * @param seed Semilla arbitraria.
 * @returns Estado inicial del generador.
 */
export function normalizeSeed(seed: number): number {
  return Math.trunc(seed) >>> 0;
}

/**
 * Genera un número en [0, 1) con mulberry32, un PRNG pequeño y determinista.
 * @param state Estado actual del generador.
 * @returns El número generado y el nuevo estado.
 */
export function nextRandom(state: number): RandomResult {
  const nextState = (state + MULBERRY32_INCREMENT) >>> 0;
  let mixed = nextState;
  mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | MULBERRY32_MIX);
  const value = ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE;
  return { value, state: nextState };
}

/**
 * Genera un entero en [0, maxExclusive).
 * @param state Estado actual del generador.
 * @param maxExclusive Límite superior (excluido).
 * @returns El entero generado y el nuevo estado.
 */
export function nextRandomInt(state: number, maxExclusive: number): RandomResult {
  const result = nextRandom(state);
  return { value: Math.floor(result.value * maxExclusive), state: result.state };
}
