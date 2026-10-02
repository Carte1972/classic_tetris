import { describe, expect, it } from 'vitest';
import { PIECE_TYPES } from '../../../src/config/tetromino_config';
import { getPieceWeights, pickWeightedPiece } from '../../../src/engine/difficulty';
import { nextRandom, normalizeSeed } from '../../../src/engine/random';
import { rollNextPiece } from '../../../src/engine/randomizer';
import type { PieceType } from '../../../src/engine/types';

/** Busca una semilla cuya primera tirada (nivel 0) dé la pieza indicada. */
function seedWithFirstPiece(piece: PieceType): number {
  for (let seed = 0; seed < 100_000; seed++) {
    if (pickWeightedPiece(nextRandom(seed).value, getPieceWeights(0)) === piece) {
      return seed;
    }
  }
  throw new Error(`No se encontró semilla para ${piece}`);
}

/** Genera una secuencia de piezas a partir de una semilla en un nivel. */
function sequence(seed: number, length: number, level = 0): PieceType[] {
  const pieces: PieceType[] = [];
  let state = normalizeSeed(seed);
  let previous: PieceType | null = null;
  for (let i = 0; i < length; i++) {
    const roll = rollNextPiece(state, previous, level);
    pieces.push(roll.piece);
    previous = roll.piece;
    state = roll.rngState;
  }
  return pieces;
}

/** Frecuencia relativa de cada pieza en una secuencia. */
function frequencies(pieces: readonly PieceType[]): Record<PieceType, number> {
  const counts = Object.fromEntries(PIECE_TYPES.map((type) => [type, 0])) as Record<
    PieceType,
    number
  >;
  for (const piece of pieces) {
    counts[piece] += 1 / pieces.length;
  }
  return counts;
}

describe('rollNextPiece', () => {
  it('produce la misma secuencia con la misma semilla', () => {
    expect(sequence(123, 50)).toEqual(sequence(123, 50));
  });

  it('produce secuencias distintas con semillas distintas', () => {
    expect(sequence(1, 50)).not.toEqual(sequence(2, 50));
  });

  it('acepta la primera tirada si no repite la pieza anterior', () => {
    const seed = seedWithFirstPiece('T');
    const roll = rollNextPiece(seed, 'I', 0);
    expect(roll.piece).toBe('T');
    expect(roll.rngState).toBe(nextRandom(seed).state);
  });

  it('si sale la pieza anterior, sortea otra vez y acepta el resultado', () => {
    const seed = seedWithFirstPiece('L');
    const first = nextRandom(seed);
    const second = nextRandom(first.state);
    const roll = rollNextPiece(seed, 'L', 0);
    expect(roll.piece).toBe(pickWeightedPiece(second.value, getPieceWeights(0)));
    expect(roll.rngState).toBe(second.state);
  });

  it('genera las 7 piezas y repite mucho menos que un sorteo uniforme', () => {
    const pieces = sequence(2024, 20_000);
    expect(new Set(pieces)).toEqual(new Set(PIECE_TYPES));
    const repeats = pieces.filter((piece, i) => i > 0 && piece === pieces[i - 1]).length;
    // Con segunda tirada, la repetición teórica es 1/7 × 1/7 ≈ 2 % (uniforme: 14,3 %).
    expect(repeats / pieces.length).toBeLessThan(0.04);
  });

  it('en el nivel 0 todas las piezas salen con frecuencia parecida', () => {
    const freq = frequencies(sequence(7, 30_000, 0));
    for (const type of PIECE_TYPES) {
      expect(freq[type]).toBeGreaterThan(0.12);
      expect(freq[type]).toBeLessThan(0.17);
    }
  });

  it('en el nivel 10 las S y Z salen aproximadamente el doble que las I', () => {
    const freq = frequencies(sequence(7, 30_000, 10));
    expect(freq.S / freq.I).toBeGreaterThan(1.7);
    expect(freq.S / freq.I).toBeLessThan(2.3);
    expect(freq.Z / freq.I).toBeGreaterThan(1.7);
  });
});

describe('getPieceWeights', () => {
  const weightOf = (level: number, type: PieceType) =>
    getPieceWeights(level)[PIECE_TYPES.indexOf(type)];

  it('en el nivel 0 todas pesan 1', () => {
    expect(getPieceWeights(0)).toEqual(PIECE_TYPES.map(() => 1));
  });

  it('S y Z ganan peso y la I lo pierde con el nivel', () => {
    expect(weightOf(10, 'S')).toBeCloseTo(1.5);
    expect(weightOf(10, 'Z')).toBeCloseTo(1.5);
    expect(weightOf(10, 'I')).toBeCloseTo(0.75);
    expect(weightOf(10, 'T')).toBe(1);
  });

  it('los pesos tienen un límite', () => {
    expect(weightOf(40, 'S')).toBe(2);
    expect(weightOf(40, 'I')).toBe(0.5);
  });

  it('trata los niveles negativos como el nivel 0', () => {
    expect(getPieceWeights(-5)).toEqual(getPieceWeights(0));
  });
});

describe('pickWeightedPiece', () => {
  it('reparte el intervalo [0, 1) según los pesos', () => {
    const weights = getPieceWeights(0);
    expect(pickWeightedPiece(0, weights)).toBe(PIECE_TYPES[0]);
    expect(pickWeightedPiece(0.999_999, weights)).toBe(PIECE_TYPES.at(-1));
    expect(pickWeightedPiece(1 / 7 + 0.001, weights)).toBe(PIECE_TYPES[1]);
  });

  it('con pesos nulos devuelve la última pieza', () => {
    expect(
      pickWeightedPiece(
        0.5,
        PIECE_TYPES.map(() => 0),
      ),
    ).toBe(PIECE_TYPES.at(-1));
  });
});
