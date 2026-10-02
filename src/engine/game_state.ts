import { MAX_START_LEVEL, MIN_START_LEVEL } from '../config/scoring_config';
import { createEmptyBoard } from './board';
import { normalizeSeed } from './random';
import { rollNextPiece } from './randomizer';
import { getLevelGoal } from './scoring';
import { createSpawnPiece } from './tetrominoes';
import type { GameState } from './types';

/** Opciones para empezar una partida. */
export interface NewGameOptions {
  /** Semilla del generador aleatorio (fija = partida reproducible). */
  readonly seed: number;
  /** Nivel inicial (0–9). */
  readonly startLevel: number;
}

/**
 * Crea el estado inicial de una partida con la primera pieza ya cayendo.
 * @param options Semilla y nivel inicial.
 * @returns Estado inicial.
 */
export function createInitialState(options: NewGameOptions): GameState {
  const startLevel = clampStartLevel(options.startLevel);
  const first = rollNextPiece(normalizeSeed(options.seed), null, startLevel);
  const next = rollNextPiece(first.rngState, first.piece, startLevel);
  return {
    board: createEmptyBoard(),
    activePiece: createSpawnPiece(first.piece),
    nextPiece: next.piece,
    rngState: next.rngState,
    phase: 'falling',
    startLevel,
    level: startLevel,
    lines: 0,
    levelLines: 0,
    levelGoal: getLevelGoal(0),
    score: 0,
    gravityFrames: 0,
    softDropFrames: 0,
    softDropReleaseRequired: false,
    phaseFramesRemaining: 0,
    phaseFramesTotal: 0,
    clearingRows: [],
    entryDelayFrames: 0,
    pendingMs: 0,
  };
}

/**
 * Limita el nivel inicial al rango seleccionable.
 * @param level Nivel pedido.
 * @returns Nivel dentro de [0, 9].
 */
function clampStartLevel(level: number): number {
  return Math.min(Math.max(Math.trunc(level), MIN_START_LEVEL), MAX_START_LEVEL);
}
