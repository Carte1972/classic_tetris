import { describe, expect, it } from 'vitest';
import { FIRST_ROLL_SIDES, PIECE_TYPES } from '../../../src/config/tetromino_config';
import { nextRandomInt, normalizeSeed } from '../../../src/engine/random';
import { rollNextPiece } from '../../../src/engine/randomizer';
import type { PieceType } from '../../../src/engine/types';

/** Busca una semilla cuya primera tirada dé el valor indicado. */
function seedWithFirstRoll(value: number): number {
  for (let seed = 0; seed < 100_000; seed++) {
    if (nextRandomInt(seed, FIRST_ROLL_SIDES).value === value) {
      return seed;
    }
  }
  throw new Error(`No se encontró semilla para la tirada ${value}`);
}

/** Genera una secuencia de piezas a partir de una semilla. */
function sequence(seed: number, length: number): PieceType[] {
  const pieces: PieceType[] = [];
  let state = normalizeSeed(seed);
  let previous: PieceType | null = null;
  for (let i = 0; i < length; i++) {
    const roll = rollNextPiece(state, previous);
    pieces.push(roll.piece);
    previous = roll.piece;
    state = roll.rngState;
  }
  return pieces;
}

describe('rollNextPiece', () => {
  it('produce la misma secuencia con la misma semilla', () => {
    expect(sequence(123, 50)).toEqual(sequence(123, 50));
  });

  it('produce secuencias distintas con semillas distintas', () => {
    expect(sequence(1, 50)).not.toEqual(sequence(2, 50));
  });

  it('acepta la primera tirada si es válida y no repite', () => {
    const seed = seedWithFirstRoll(0);
    const roll = rollNextPiece(seed, 'I');
    expect(roll.piece).toBe(PIECE_TYPES[0]);
    expect(roll.rngState).toBe(nextRandomInt(seed, FIRST_ROLL_SIDES).state);
  });

  it('repite la tirada si sale la pieza anterior', () => {
    const seed = seedWithFirstRoll(2);
    const first = nextRandomInt(seed, FIRST_ROLL_SIDES);
    const second = nextRandomInt(first.state, PIECE_TYPES.length);
    const roll = rollNextPiece(seed, PIECE_TYPES[2] ?? null);
    expect(roll.piece).toBe(PIECE_TYPES[second.value]);
    expect(roll.rngState).toBe(second.state);
  });

  it('repite la tirada si sale el valor inválido', () => {
    const seed = seedWithFirstRoll(PIECE_TYPES.length);
    const first = nextRandomInt(seed, FIRST_ROLL_SIDES);
    const second = nextRandomInt(first.state, PIECE_TYPES.length);
    expect(rollNextPiece(seed, null).piece).toBe(PIECE_TYPES[second.value]);
  });

  it('genera las 7 piezas y repite mucho menos que un sorteo uniforme', () => {
    const pieces = sequence(2024, 20_000);
    expect(new Set(pieces)).toEqual(new Set(PIECE_TYPES));
    const repeats = pieces.filter((piece, i) => i > 0 && piece === pieces[i - 1]).length;
    // Probabilidad teórica de repetición en NES: 2/8 × 1/7 ≈ 3,6 % (uniforme: 14,3 %).
    expect(repeats / pieces.length).toBeLessThan(0.06);
  });
});
