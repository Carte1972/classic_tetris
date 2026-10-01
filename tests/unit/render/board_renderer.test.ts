import { describe, expect, it } from 'vitest';
import { TOTAL_ROWS } from '../../../src/config/board_config';
import {
  BOARD_BACKGROUND_COLOR,
  BOARD_FLASH_COLOR,
  PIECE_COLORS,
} from '../../../src/config/palette';
import { createEmptyRow } from '../../../src/engine/board';
import { createInitialState } from '../../../src/engine/game_state';
import type { BoardRow, GameState } from '../../../src/engine/types';
import { drawBoard } from '../../../src/render/board_renderer';
import { createFakeContext } from './fake_context';

/** Rectángulos que dibuja cada bloque (relleno + 4 biseles + brillo). */
const RECTS_PER_BLOCK = 6;

const base = createInitialState({ seed: 1, startLevel: 0 });

/** Tablero con una fila inferior parcial de 3 bloques J. */
function boardWithPartialRow(): readonly BoardRow[] {
  const bottom: BoardRow = ['J', 'J', 'J', null, null, null, null, null, null, null];
  return [...Array.from({ length: TOTAL_ROWS - 1 }, createEmptyRow), bottom];
}

/** Número de bloques dibujados (sin contar el fondo). */
function blocksDrawn(calls: readonly { fillStyle: string }[]): number {
  return (calls.length - 1) / RECTS_PER_BLOCK;
}

describe('drawBoard', () => {
  it('empieza siempre pintando el fondo del pozo', () => {
    const { ctx, calls } = createFakeContext();
    drawBoard(ctx, base, { hidden: false });
    expect(calls[0]).toMatchObject({ fillStyle: BOARD_BACKGROUND_COLOR, x: 0, y: 0 });
  });

  it('no dibuja la pieza mientras está en las filas ocultas', () => {
    const { ctx, calls } = createFakeContext();
    drawBoard(ctx, base, { hidden: false });
    expect(blocksDrawn(calls)).toBe(0);
  });

  it('dibuja bloques fijados y la pieza activa visible', () => {
    const { ctx, calls } = createFakeContext();
    const state: GameState = {
      ...base,
      board: boardWithPartialRow(),
      activePiece: { type: 'O', rotation: 0, x: 5, y: 10 },
    };
    drawBoard(ctx, state, { hidden: false });
    expect(blocksDrawn(calls)).toBe(3 + 4);
    expect(calls.filter((c) => c.fillStyle === PIECE_COLORS.O.fill)).toHaveLength(4);
  });

  it('oculta las piezas cuando se pide (pausa)', () => {
    const { ctx, calls } = createFakeContext();
    drawBoard(ctx, { ...base, board: boardWithPartialRow() }, { hidden: true });
    expect(calls).toHaveLength(1);
  });

  it('va ocultando las celdas de las filas que se limpian', () => {
    const full: BoardRow = Array.from({ length: 10 }, () => 'L' as const);
    const board = [...Array.from({ length: TOTAL_ROWS - 1 }, createEmptyRow), full];
    const clearing = (remaining: number): GameState => ({
      ...base,
      board,
      activePiece: null,
      phase: 'lineClear',
      clearingRows: [TOTAL_ROWS - 1],
      phaseFramesRemaining: remaining,
      phaseFramesTotal: 20,
    });
    const counts = [20, 10, 1].map((remaining) => {
      const { ctx, calls } = createFakeContext();
      drawBoard(ctx, clearing(remaining), { hidden: false });
      return blocksDrawn(calls);
    });
    expect(counts[0]).toBe(10);
    expect(counts[1]).toBeLessThan(10);
    expect(counts[2]).toBeLessThan(counts[1] ?? 0);
  });

  it('usa el color de destello al limpiar 4 líneas', () => {
    const colors = Array.from({ length: 20 }, (_, i) => {
      const { ctx, calls } = createFakeContext();
      drawBoard(
        ctx,
        {
          ...base,
          activePiece: null,
          phase: 'lineClear',
          clearingRows: [18, 19, 20, 21],
          phaseFramesRemaining: 20 - i,
          phaseFramesTotal: 20,
        },
        { hidden: false },
      );
      return calls[0]?.fillStyle;
    });
    expect(colors).toContain(BOARD_FLASH_COLOR);
    expect(colors).toContain(BOARD_BACKGROUND_COLOR);
  });
});
