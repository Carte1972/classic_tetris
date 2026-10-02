import { describe, expect, it } from 'vitest';
import { TOTAL_ROWS } from '../../../src/config/board_config';
import { applyTestPatch, boardFromRows, parseTestOptions } from '../../../src/app/test_mode';
import { createInitialState } from '../../../src/engine/game_state';

describe('parseTestOptions', () => {
  it('lee la semilla y la API de test de la URL', () => {
    expect(parseTestOptions('?seed=123&test=1')).toEqual({ seed: 123, testApi: true });
    expect(parseTestOptions('')).toEqual({ seed: null, testApi: false });
  });

  it.each(['?seed=abc', '?seed=-5', '?seed=1.5', '?seed='])(
    'ignora la semilla no válida %s',
    (q) => {
      expect(parseTestOptions(q).seed).toBeNull();
    },
  );

  it('solo activa la API con test=1', () => {
    expect(parseTestOptions('?test=true').testApi).toBe(false);
  });
});

describe('boardFromRows', () => {
  it('coloca las filas en la parte inferior del tablero', () => {
    const board = boardFromRows(['I.........', 'TTTTTTTTT.']);
    expect(board).toHaveLength(TOTAL_ROWS);
    expect(board[TOTAL_ROWS - 2]?.[0]).toBe('I');
    expect(board[TOTAL_ROWS - 2]?.[1]).toBeNull();
    expect(board[TOTAL_ROWS - 1]?.[9]).toBeNull();
    expect(board[0]?.every((cell) => cell === null)).toBe(true);
  });

  it('rechaza filas mal formadas', () => {
    expect(() => boardFromRows(['corta'])).toThrow(RangeError);
    expect(() => boardFromRows(['X.........'])).toThrow(RangeError);
    expect(() => boardFromRows(Array.from({ length: TOTAL_ROWS + 1 }, () => '..........'))).toThrow(
      RangeError,
    );
  });
});

describe('applyTestPatch', () => {
  it('fijar una pieza activa pasa la partida a la fase de caída', () => {
    const state = {
      ...createInitialState({ seed: 1, startLevel: 0 }),
      phase: 'entryDelay' as const,
      activePiece: null,
      phaseFramesRemaining: 5,
    };
    const patched = applyTestPatch(state, {
      activePiece: { type: 'I', rotation: 1, x: 9, y: 19 },
    });
    expect(patched.phase).toBe('falling');
    expect(patched.phaseFramesRemaining).toBe(0);
    expect(patched.activePiece).toEqual({ type: 'I', rotation: 1, x: 9, y: 19 });
  });

  it('cambia solo los campos indicados', () => {
    const state = createInitialState({ seed: 1, startLevel: 0 });
    const patched = applyTestPatch(state, {
      score: 500,
      lines: 9,
      levelLines: 3,
      levelGoal: 14,
      nextPiece: 'I',
    });
    expect(patched).toEqual({
      ...state,
      score: 500,
      lines: 9,
      levelLines: 3,
      levelGoal: 14,
      nextPiece: 'I',
    });
    const withBoard = applyTestPatch(state, {
      boardRows: ['OO........'],
      activePiece: null,
      level: 3,
    });
    expect(withBoard.board[TOTAL_ROWS - 1]?.[0]).toBe('O');
    expect(withBoard.activePiece).toBeNull();
    expect(withBoard.level).toBe(3);
  });
});
