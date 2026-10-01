import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../../src/engine/game_state';
import type { GameState } from '../../../src/engine/types';
import { getPhaseProgress, isBoardFlashing, isColumnCleared } from '../../../src/render/line_clear';

const base = createInitialState({ seed: 1, startLevel: 0 });

/** Estado en plena limpieza de líneas. */
function clearing(rows: number, remaining: number): GameState {
  return {
    ...base,
    phase: 'lineClear',
    activePiece: null,
    clearingRows: Array.from({ length: rows }, (_, i) => 21 - i),
    phaseFramesRemaining: remaining,
    phaseFramesTotal: 20,
  };
}

describe('getPhaseProgress', () => {
  it('va de 0 a 1 a lo largo de la fase', () => {
    expect(getPhaseProgress(clearing(1, 20))).toBe(0);
    expect(getPhaseProgress(clearing(1, 10))).toBe(0.5);
    expect(getPhaseProgress(clearing(1, 0))).toBe(1);
  });

  it('una fase sin duración se considera terminada', () => {
    expect(getPhaseProgress(base)).toBe(1);
  });
});

describe('isColumnCleared', () => {
  it('al empezar no ha desaparecido ninguna columna', () => {
    for (let column = 0; column < 10; column++) {
      expect(isColumnCleared(column, 0)).toBe(false);
    }
  });

  it('borra desde el centro hacia los lados', () => {
    const progress = 2 / 6;
    expect([3, 4, 5, 6].every((c) => isColumnCleared(c, progress))).toBe(true);
    expect([0, 1, 2, 7, 8, 9].some((c) => isColumnCleared(c, progress))).toBe(false);
  });

  it('al terminar han desaparecido todas', () => {
    for (let column = 0; column < 10; column++) {
      expect(isColumnCleared(column, 1)).toBe(true);
    }
  });
});

describe('isBoardFlashing', () => {
  it('destella en frames alternos solo al limpiar 4 líneas', () => {
    const flashes = Array.from({ length: 20 }, (_, i) => isBoardFlashing(clearing(4, 20 - i)));
    expect(flashes).toContain(true);
    expect(flashes).toContain(false);
    expect(isBoardFlashing(clearing(3, 7))).toBe(false);
    expect(isBoardFlashing(base)).toBe(false);
  });
});
