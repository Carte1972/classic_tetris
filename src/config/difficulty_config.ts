import type { PieceType } from '../engine/types';

/** Cómo cambia la probabilidad de una pieza con el nivel. */
export interface PieceWeightRule {
  /** Cambio del peso por cada nivel (el peso base es 1). */
  readonly perLevel: number;
  /** Límite del peso: máximo si `perLevel` es positivo, mínimo si es negativo. */
  readonly limit: number;
}

/**
 * Reglas de peso de las piezas que cambian con el nivel: cuanto más alto, más S y Z
 * (las más incómodas) y menos I. Las piezas que no aparecen mantienen peso 1.
 * En el nivel 10, S y Z pesan 1,5 e I 0,75: salen el doble.
 */
export const PIECE_WEIGHT_RULES: Readonly<Partial<Record<PieceType, PieceWeightRule>>> = {
  S: { perLevel: 0.05, limit: 2 },
  Z: { perLevel: 0.05, limit: 2 },
  I: { perLevel: -0.025, limit: 0.5 },
};

/** Frames que se restan al retardo de entrada (ARE) por cada nivel. */
export const ENTRY_DELAY_REDUCTION_PER_LEVEL = 1;

/** Retardo de entrada (ARE) mínimo en cualquier nivel. */
export const ENTRY_DELAY_MIN_FRAMES = 4;

/** Nivel a partir del cual deja de mostrarse la siguiente pieza. */
export const PREVIEW_HIDDEN_FROM_LEVEL = 15;

/** Líneas que pide el primer nivel de la partida. */
export const LEVEL_GOAL_BASE_LINES = 10;

/** Líneas más que pide cada nivel respecto al anterior. */
export const LEVEL_GOAL_STEP_LINES = 2;
