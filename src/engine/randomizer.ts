import { getPieceWeights, pickWeightedPiece } from './difficulty';
import { nextRandom } from './random';
import type { PieceType } from './types';

/** Resultado de elegir la siguiente pieza. */
export interface PieceRoll {
  /** Pieza elegida. */
  readonly piece: PieceType;
  /** Nuevo estado del generador. */
  readonly rngState: number;
}

/**
 * Elige la siguiente pieza con un sorteo ponderado por nivel (sin 7-bag). Como en el
 * generador clásico, si sale la misma pieza que la anterior se sortea una segunda vez y
 * ese resultado se acepta siempre.
 * @param rngState Estado actual del generador.
 * @param previous Pieza anterior, o `null` si es la primera de la partida.
 * @param level Nivel actual (determina los pesos).
 * @returns La pieza elegida y el nuevo estado del generador.
 */
export function rollNextPiece(
  rngState: number,
  previous: PieceType | null,
  level: number,
): PieceRoll {
  const weights = getPieceWeights(level);
  const first = nextRandom(rngState);
  const firstPiece = pickWeightedPiece(first.value, weights);
  if (firstPiece !== previous) {
    return { piece: firstPiece, rngState: first.state };
  }
  const second = nextRandom(first.state);
  return { piece: pickWeightedPiece(second.value, weights), rngState: second.state };
}
