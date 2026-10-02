import { PIECE_WEIGHT_RULES, PREVIEW_HIDDEN_FROM_LEVEL } from '../config/difficulty_config';
import { PIECE_TYPES } from '../config/tetromino_config';
import type { PieceType } from './types';

/** Peso base de cada pieza en el sorteo. */
const BASE_WEIGHT = 1;

/**
 * Peso de cada pieza en el sorteo según el nivel (más S y Z y menos I cuanto más alto).
 * @param level Nivel actual.
 * @returns Peso de cada pieza, en el orden de `PIECE_TYPES`.
 */
export function getPieceWeights(level: number): readonly number[] {
  const safeLevel = Math.max(0, level);
  return PIECE_TYPES.map((type) => {
    const rule = PIECE_WEIGHT_RULES[type];
    if (rule === undefined) {
      return BASE_WEIGHT;
    }
    const weight = BASE_WEIGHT + rule.perLevel * safeLevel;
    return rule.perLevel >= 0 ? Math.min(weight, rule.limit) : Math.max(weight, rule.limit);
  });
}

/**
 * Indica si se muestra la siguiente pieza en un nivel (desaparece en niveles altos).
 * @param level Nivel actual.
 * @returns `true` si la vista previa es visible.
 */
export function isNextPieceVisible(level: number): boolean {
  return level < PREVIEW_HIDDEN_FROM_LEVEL;
}

/**
 * Elige un índice de pieza a partir de un número en [0, 1) y los pesos.
 * @param value Número aleatorio en [0, 1).
 * @param weights Pesos de cada pieza.
 * @returns La pieza elegida.
 */
export function pickWeightedPiece(value: number, weights: readonly number[]): PieceType {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let threshold = value * total;
  for (let index = 0; index < PIECE_TYPES.length; index++) {
    threshold -= weights[index] ?? 0;
    const piece = PIECE_TYPES[index];
    if (threshold < 0 && piece !== undefined) {
      return piece;
    }
  }
  const last = PIECE_TYPES[PIECE_TYPES.length - 1];
  if (last === undefined) {
    throw new Error('No hay piezas definidas');
  }
  return last;
}
