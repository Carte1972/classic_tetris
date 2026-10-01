import { describe, expect, it } from 'vitest';
import { TOTAL_ROWS } from '../../../src/config/board_config';
import { LINE_CLEAR_BASE_POINTS } from '../../../src/config/scoring_config';
import { SPAWN_COLUMN, SPAWN_ROW } from '../../../src/config/tetromino_config';
import {
  FRAME_DURATION_MS,
  LINE_CLEAR_ANIMATION_FRAMES,
  SOFT_DROP_FRAMES_PER_ROW,
} from '../../../src/config/timing_config';
import { createEmptyRow, findFullRows } from '../../../src/engine/board';
import { createInitialState } from '../../../src/engine/game_state';
import { EMPTY_INPUT, step, tick } from '../../../src/engine/step';
import type { FrameInput, GameEvent, GameState } from '../../../src/engine/types';
import { boardWithBottomRows, filledRow } from './helpers';

const SOFT_DROP: FrameInput = { ...EMPTY_INPUT, softDrop: true };

/** Estado inicial con semilla fija y valores sobrescritos. */
function stateWith(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState({ seed: 1, startLevel: 0 }), ...overrides };
}

/** Ejecuta varios frames con la misma entrada y acumula los eventos. */
function runTicks(
  state: GameState,
  frames: number,
  input: FrameInput = EMPTY_INPUT,
): { state: GameState; events: GameEvent[] } {
  let current = state;
  const events: GameEvent[] = [];
  for (let i = 0; i < frames; i++) {
    const result = tick(current, input);
    current = result.state;
    events.push(...result.events);
  }
  return { state: current, events };
}

/** Ejecuta frames hasta salir de la fase actual (como máximo `limit`). */
function runUntilPhaseChanges(state: GameState, input: FrameInput = EMPTY_INPUT, limit = 2000) {
  let current = state;
  const events: GameEvent[] = [];
  for (let i = 0; i < limit && current.phase === state.phase; i++) {
    const result = tick(current, input);
    current = result.state;
    events.push(...result.events);
  }
  return { state: current, events };
}

/**
 * Estado con una I vertical sobre un pozo en la columna 9 y `lines` filas completas
 * salvo esa columna, a punto de fijarse y limpiar exactamente `lines` líneas.
 */
function wellState(lines: number, overrides: Partial<GameState> = {}): GameState {
  const rows = Array.from({ length: lines }, () => filledRow([9]));
  return stateWith({
    board: boardWithBottomRows(rows),
    activePiece: { type: 'I', rotation: 1, x: 9, y: TOTAL_ROWS - 2 },
    ...overrides,
  });
}

describe('createInitialState', () => {
  it('empieza con una pieza cayendo en la posición de spawn', () => {
    const state = createInitialState({ seed: 123, startLevel: 3 });
    expect(state.phase).toBe('falling');
    expect(state.activePiece).toMatchObject({ x: SPAWN_COLUMN, y: SPAWN_ROW, rotation: 0 });
    expect(state.level).toBe(3);
    expect(state.startLevel).toBe(3);
    expect(state.score).toBe(0);
    expect(state.lines).toBe(0);
  });

  it('es determinista para la misma semilla', () => {
    expect(createInitialState({ seed: 99, startLevel: 0 })).toEqual(
      createInitialState({ seed: 99, startLevel: 0 }),
    );
  });

  it('limita el nivel inicial al rango 0–9', () => {
    expect(createInitialState({ seed: 1, startLevel: 15 }).level).toBe(9);
    expect(createInitialState({ seed: 1, startLevel: -3 }).level).toBe(0);
  });
});

describe('tick: movimiento y rotación', () => {
  const base = stateWith({ activePiece: { type: 'T', rotation: 0, x: 5, y: 5 } });

  it('desplaza la pieza y emite pieceMoved', () => {
    const result = tick(base, { ...EMPTY_INPUT, moveLeft: true });
    expect(result.state.activePiece?.x).toBe(4);
    expect(result.events).toContainEqual({ type: 'pieceMoved' });
  });

  it('ignora izquierda y derecha pulsadas a la vez', () => {
    const result = tick(base, { ...EMPTY_INPUT, moveLeft: true, moveRight: true });
    expect(result.state.activePiece?.x).toBe(5);
    expect(result.events).toEqual([]);
  });

  it('no emite eventos si el movimiento choca', () => {
    const atWall = stateWith({ activePiece: { type: 'T', rotation: 0, x: 1, y: 5 } });
    const result = tick(atWall, { ...EMPTY_INPUT, moveLeft: true });
    expect(result.state.activePiece?.x).toBe(1);
    expect(result.events).toEqual([]);
  });

  it('rota en ambos sentidos y emite pieceRotated', () => {
    const clockwise = tick(base, { ...EMPTY_INPUT, rotateClockwise: true });
    expect(clockwise.state.activePiece?.rotation).toBe(1);
    expect(clockwise.events).toContainEqual({ type: 'pieceRotated' });
    const counter = tick(base, { ...EMPTY_INPUT, rotateCounterClockwise: true });
    expect(counter.state.activePiece?.rotation).toBe(3);
  });

  it('ignora las dos rotaciones pulsadas a la vez', () => {
    const result = tick(base, {
      ...EMPTY_INPUT,
      rotateClockwise: true,
      rotateCounterClockwise: true,
    });
    expect(result.state.activePiece?.rotation).toBe(0);
  });

  it('no hace nada si la fase falling no tiene pieza activa', () => {
    const empty = stateWith({ activePiece: null });
    expect(tick(empty, EMPTY_INPUT)).toEqual({ state: empty, events: [] });
  });
});

describe('tick: gravedad y soft drop', () => {
  it('en el nivel 0 la pieza baja una fila cada 48 frames', () => {
    const state = stateWith();
    const startRow = state.activePiece?.y ?? 0;
    expect(runTicks(state, 47).state.activePiece?.y).toBe(startRow);
    expect(runTicks(state, 48).state.activePiece?.y).toBe(startRow + 1);
  });

  it('en el nivel 29 la pieza baja una fila por frame', () => {
    const state = stateWith({ level: 29 });
    const startRow = state.activePiece?.y ?? 0;
    expect(runTicks(state, 3).state.activePiece?.y).toBe(startRow + 3);
  });

  it('el soft drop baja una fila cada 2 frames y suma 1 punto por celda', () => {
    const state = stateWith();
    const startRow = state.activePiece?.y ?? 0;
    const result = runTicks(state, SOFT_DROP_FRAMES_PER_ROW * 5, SOFT_DROP);
    expect(result.state.activePiece?.y).toBe(startRow + 5);
    expect(result.state.score).toBe(5);
  });

  it('soltar el soft drop reinicia su contador', () => {
    const state = stateWith();
    const half = tick(state, SOFT_DROP).state;
    expect(half.softDropFrames).toBe(1);
    expect(tick(half, EMPTY_INPUT).state.softDropFrames).toBe(0);
  });

  it('el soft drop no suma puntos cuando la pieza ya no puede bajar', () => {
    const state = stateWith({ activePiece: { type: 'O', rotation: 0, x: 5, y: 20 } });
    const result = runTicks(state, SOFT_DROP_FRAMES_PER_ROW, SOFT_DROP);
    expect(result.state.score).toBe(0);
    expect(result.events).toContainEqual({ type: 'pieceLocked' });
  });
});

describe('tick: fijar pieza, ARE y aparición', () => {
  it('fija la pieza al no poder bajar y espera el ARE antes de la siguiente', () => {
    const state = stateWith({ activePiece: { type: 'O', rotation: 0, x: 5, y: 20 } });
    const locked = runUntilPhaseChanges(state);
    expect(locked.events).toContainEqual({ type: 'pieceLocked' });
    expect(locked.state.phase).toBe('entryDelay');
    expect(locked.state.activePiece).toBeNull();
    expect(locked.state.phaseFramesRemaining).toBe(10);
    expect(locked.state.board[21]?.[4]).toBe('O');

    const spawned = runTicks(locked.state, 10);
    expect(spawned.state.phase).toBe('falling');
    expect(spawned.state.activePiece).toMatchObject({
      type: state.nextPiece,
      x: SPAWN_COLUMN,
      y: SPAWN_ROW,
    });
    expect(spawned.state.nextPiece).not.toBe(state.nextPiece);
  });

  it('el ARE es mayor cuanto más alto se fija la pieza', () => {
    const board = boardWithBottomRows(
      Array.from({ length: 14 }, () => filledRow([0, 1, 2, 3, 4, 5, 6])),
    );
    const state = stateWith({ board, activePiece: { type: 'O', rotation: 0, x: 8, y: 6 } });
    const locked = runUntilPhaseChanges(state);
    expect(locked.state.phaseFramesRemaining).toBe(18);
  });
});

describe('tick: limpieza de líneas', () => {
  it.each([1, 2, 3, 4])('limpia %i líneas con animación y puntúa', (lines) => {
    const locked = runUntilPhaseChanges(wellState(lines));
    expect(locked.state.phase).toBe('lineClear');
    expect(locked.state.clearingRows).toHaveLength(lines);
    expect(locked.events).toContainEqual({ type: 'linesCleared', count: lines });
    expect(locked.state.score).toBe(0);

    const cleared = runTicks(locked.state, LINE_CLEAR_ANIMATION_FRAMES);
    expect(cleared.state.phase).toBe('entryDelay');
    expect(cleared.state.lines).toBe(lines);
    expect(cleared.state.score).toBe(LINE_CLEAR_BASE_POINTS[lines]);
    expect(cleared.state.clearingRows).toEqual([]);
    expect(findFullRows(cleared.state.board)).toEqual([]);
  });

  it('la animación dura los frames configurados', () => {
    const locked = runUntilPhaseChanges(wellState(1));
    const almost = runTicks(locked.state, LINE_CLEAR_ANIMATION_FRAMES - 1);
    expect(almost.state.phase).toBe('lineClear');
    expect(almost.state.phaseFramesTotal).toBe(LINE_CLEAR_ANIMATION_FRAMES);
  });

  it('multiplica la puntuación por el nivel + 1', () => {
    const locked = runUntilPhaseChanges(wellState(4, { level: 5, startLevel: 5 }));
    const cleared = runTicks(locked.state, LINE_CLEAR_ANIMATION_FRAMES);
    expect(cleared.state.score).toBe(1200 * 6);
  });
});

describe('tick: cambio de nivel', () => {
  it('sube de nivel al llegar a 10 líneas y puntúa con el nivel anterior', () => {
    const locked = runUntilPhaseChanges(wellState(1, { lines: 9 }));
    const cleared = runTicks(locked.state, LINE_CLEAR_ANIMATION_FRAMES);
    expect(cleared.events).toContainEqual({ type: 'levelUp', level: 1 });
    expect(cleared.state.level).toBe(1);
    expect(cleared.state.score).toBe(40);
  });

  it('no sube de nivel si las líneas no superan el nivel inicial', () => {
    const locked = runUntilPhaseChanges(wellState(1, { lines: 9, level: 5, startLevel: 5 }));
    const cleared = runTicks(locked.state, LINE_CLEAR_ANIMATION_FRAMES);
    expect(cleared.events).not.toContainEqual(expect.objectContaining({ type: 'levelUp' }));
    expect(cleared.state.level).toBe(5);
  });

  it('la gravedad usa el nuevo nivel tras subir', () => {
    const locked = runUntilPhaseChanges(wellState(4, { lines: 8, level: 0 }));
    const cleared = runTicks(locked.state, LINE_CLEAR_ANIMATION_FRAMES);
    expect(cleared.state.level).toBe(1);
    const spawned = runUntilPhaseChanges(cleared.state);
    const startRow = spawned.state.activePiece?.y ?? 0;
    expect(runTicks(spawned.state, 43).state.activePiece?.y).toBe(startRow + 1);
  });
});

describe('tick: game over', () => {
  /** Tablero con la zona de aparición ocupada. */
  const blockedBoard = [filledRow([0, 1, 8, 9]), filledRow([0, 1, 8, 9])].concat(
    Array.from({ length: TOTAL_ROWS - 2 }, createEmptyRow),
  );

  it('termina la partida si la nueva pieza no cabe al aparecer', () => {
    const state = stateWith({
      board: blockedBoard,
      activePiece: null,
      phase: 'entryDelay',
      phaseFramesRemaining: 1,
    });
    const result = tick(state, EMPTY_INPUT);
    expect(result.state.phase).toBe('gameOver');
    expect(result.state.activePiece).toBeNull();
    expect(result.events).toEqual([{ type: 'gameOver' }]);
  });

  it('una vez terminada, la partida no cambia', () => {
    const over = stateWith({ phase: 'gameOver', activePiece: null });
    expect(tick(over, SOFT_DROP)).toEqual({ state: over, events: [] });
    expect(step(over, SOFT_DROP, FRAME_DURATION_MS * 10).events).toEqual([]);
  });

  it('una partida sin intervención acaba en game over', () => {
    let state = createInitialState({ seed: 5, startLevel: 9 });
    const events: GameEvent[] = [];
    for (let i = 0; i < 100_000 && state.phase !== 'gameOver'; i++) {
      const result = tick(state, EMPTY_INPUT);
      state = result.state;
      events.push(...result.events);
    }
    expect(state.phase).toBe('gameOver');
    expect(events.filter((e) => e.type === 'gameOver')).toHaveLength(1);
  });
});

describe('step: timestep fijo', () => {
  it('avanza tantos frames como quepan en dt y guarda el resto', () => {
    const state = stateWith({ level: 29 });
    const startRow = state.activePiece?.y ?? 0;
    const result = step(state, EMPTY_INPUT, FRAME_DURATION_MS * 2.5);
    expect(result.state.activePiece?.y).toBe(startRow + 2);
    expect(result.state.pendingMs).toBeCloseTo(FRAME_DURATION_MS / 2);
    const next = step(result.state, EMPTY_INPUT, FRAME_DURATION_MS / 2);
    expect(next.state.activePiece?.y).toBe(startRow + 3);
  });

  it('no avanza si dt es menor que un frame', () => {
    const state = stateWith();
    const result = step(state, { ...EMPTY_INPUT, moveLeft: true }, FRAME_DURATION_MS / 3);
    expect(result.state.activePiece).toEqual(state.activePiece);
    expect(result.events).toEqual([]);
  });

  it('aplica movimientos solo en el primer frame y el soft drop en todos', () => {
    const state = stateWith();
    const start = state.activePiece;
    const result = step(
      state,
      { ...EMPTY_INPUT, moveLeft: true, softDrop: true },
      FRAME_DURATION_MS * 4,
    );
    expect(result.state.activePiece?.x).toBe((start?.x ?? 0) - 1);
    expect(result.state.activePiece?.y).toBe((start?.y ?? 0) + 2);
    expect(result.events.filter((e) => e.type === 'pieceMoved')).toHaveLength(1);
  });
});
