import { describe, expect, it } from 'vitest';
import {
  INITIAL_AUTOPILOT_STATE,
  nextAutopilotInput,
  type AutopilotState,
} from '../../../src/ai/autopilot';
import { findBestPlacement, type PlacementChoice } from '../../../src/ai/dellacherie';
import { applyTestPatch, boardFromRows } from '../../../src/app/test_mode';
import { FRAME_DURATION_MS } from '../../../src/config/timing_config';
import { lockPiece } from '../../../src/engine/board';
import { collides } from '../../../src/engine/collision';
import { createInitialState } from '../../../src/engine/game_state';
import { EMPTY_INPUT, startNextLevel, tick } from '../../../src/engine/step';
import { createSpawnPiece } from '../../../src/engine/tetrominoes';
import type {
  ActivePiece,
  Board,
  GamePhase,
  GameState,
  StepResult,
} from '../../../src/engine/types';
import { REAL_BOARDS } from './fixtures';

/** Semillas de las partidas completas (nivel inicial 0). */
const SEEDS = [42, 123, 2026] as const;

/**
 * Umbrales de las partidas completas, fijados tras medir con estas semillas (3 de octubre
 * de 2026): en 500 piezas el piloto hizo 183, 175 y 174 líneas, superó 9 niveles en las
 * tres y tardó unos 0,8 ms de media por decisión. Sin límite de piezas llegó al nivel 29
 * (1 frame por fila) y siguió jugando más de 3000 piezas sin perder.
 */
const MAX_PIECES = 500;
const MIN_LINES = 150;
const MIN_LEVEL_UPS = 7;

/**
 * Límite holgado para el tiempo medio de una decisión: un frame. Medido, una decisión tarda
 * unos 0,8 ms, pero con la instrumentación de cobertura (la que usa el CI) sube a unos
 * 3,7 ms, y la máquina del CI puede ser más lenta.
 */
const DECISION_TIME_LIMIT_MS = FRAME_DURATION_MS;

/** Tiempo máximo de los tests de partidas completas (con cobertura, cada una tarda unos 4 s). */
const FULL_GAME_TIMEOUT_MS = 60_000;

/** Frames de sobra para que una pieza se fije en cualquier nivel. */
const PIECE_FRAME_LIMIT = 2000;

/** Tablero real de fin de partida (el de `forceGameOver` en los e2e). */
const GAME_OVER_ROWS = Array.from({ length: 20 }, () => 'OOOOOOOOO.');

/** Un frame del motor conducido por el piloto. */
interface PilotFrame {
  readonly result: StepResult;
  readonly autopilot: AutopilotState;
  readonly input: ReturnType<typeof nextAutopilotInput>['input'];
}

/**
 * Avanza un frame con la entrada del piloto.
 * @param state Estado del motor.
 * @param autopilot Estado del piloto.
 * @returns El frame jugado.
 */
function pilotTick(state: GameState, autopilot: AutopilotState): PilotFrame {
  const step = nextAutopilotInput(autopilot, state);
  return { result: tick(state, step.input), autopilot: step.autopilot, input: step.input };
}

/**
 * Juega con el piloto hasta que la partida llega a una fase.
 * @param initial Estado de partida.
 * @param phase Fase buscada.
 * @returns El primer estado en esa fase.
 */
function playUntilPhase(initial: GameState, phase: GamePhase): GameState {
  let state = initial;
  let autopilot = INITIAL_AUTOPILOT_STATE;
  for (let frame = 0; frame < PIECE_FRAME_LIMIT && state.phase !== phase; frame++) {
    const played = pilotTick(state, autopilot);
    state = played.result.state;
    autopilot = played.autopilot;
  }
  expect(state.phase).toBe(phase);
  return state;
}

/** Lo que pasa con una pieza conducida por el piloto hasta que se fija. */
interface PieceRun {
  /** Tablero justo después de fijarla (antes de borrar líneas). */
  readonly lockedBoard: Board;
  /** Entradas enviadas, frame a frame. */
  readonly inputs: readonly PilotFrame['input'][];
  /** Objetivos distintos que ha tenido el piloto. */
  readonly targets: readonly PlacementChoice[];
  /** Puntuación al fijarla. */
  readonly score: number;
}

/**
 * Conduce con el piloto la pieza activa hasta que se fija.
 * @param initial Estado en fase `falling`.
 * @returns Lo ocurrido con la pieza.
 */
function runPiece(initial: GameState): PieceRun {
  let state = initial;
  let autopilot = INITIAL_AUTOPILOT_STATE;
  const inputs: PilotFrame['input'][] = [];
  const targets: PlacementChoice[] = [];
  for (let frame = 0; frame < PIECE_FRAME_LIMIT; frame++) {
    const played = pilotTick(state, autopilot);
    inputs.push(played.input);
    const target = played.autopilot.target;
    if (target !== null && target !== targets.at(-1)) {
      targets.push(target);
    }
    state = played.result.state;
    autopilot = played.autopilot;
    if (played.result.events.some((event) => event.type === 'pieceLocked')) {
      return { lockedBoard: state.board, inputs, targets, score: state.score };
    }
  }
  throw new Error('La pieza no se ha fijado');
}

/** Resumen de una partida completa jugada por el piloto. */
interface GameRun {
  readonly finalState: GameState;
  readonly pieces: number;
  readonly levelUps: number;
  /** Tablero y pieza en el momento de aparecer cada pieza. */
  readonly spawns: readonly { readonly board: Board; readonly piece: ActivePiece }[];
  /** Si alguna colocación elegida chocaba con el tablero en el que se eligió. */
  readonly invalidTargets: number;
}

/**
 * Juega una partida completa con el motor real: el piloto conduce `tick` y, al superar un
 * nivel, se llama a `startNextLevel` como hace el controlador tras la celebración.
 * @param seed Semilla.
 * @returns Resumen de la partida.
 */
function playGame(seed: number): GameRun {
  let state = createInitialState({ seed, startLevel: 0 });
  let autopilot = INITIAL_AUTOPILOT_STATE;
  let pieces = 0;
  let levelUps = 0;
  let invalidTargets = 0;
  let wasFalling = false;
  const spawns: { board: Board; piece: ActivePiece }[] = [];
  while (state.phase !== 'gameOver' && pieces < MAX_PIECES) {
    if (state.phase === 'levelComplete') {
      state = startNextLevel(state);
      levelUps++;
      continue;
    }
    const falling = state.phase === 'falling' && state.activePiece !== null;
    if (falling && !wasFalling && state.activePiece !== null) {
      spawns.push({ board: state.board, piece: state.activePiece });
    }
    wasFalling = falling;
    const played = pilotTick(state, autopilot);
    const target = played.autopilot.target;
    if (target !== null && target !== autopilot.target && collides(state.board, target.landed)) {
      invalidTargets++;
    }
    if (played.result.events.some((event) => event.type === 'pieceLocked')) {
      pieces++;
    }
    state = played.result.state;
    autopilot = played.autopilot;
  }
  return { finalState: state, pieces, levelUps, spawns, invalidTargets };
}

/** Partidas ya jugadas, para no repetirlas en cada test. */
const playedGames = new Map<number, GameRun>();

/**
 * Partida de una semilla, jugada una sola vez.
 * @param seed Semilla.
 * @returns Resumen de la partida.
 */
function gameFor(seed: number): GameRun {
  const cached = playedGames.get(seed) ?? playGame(seed);
  playedGames.set(seed, cached);
  return cached;
}

/**
 * Convierte un tablero en filas de texto a partir de la primera fila con bloques.
 * @param board Tablero.
 * @returns Filas en el formato de `boardFromRows`.
 */
function toRows(board: Board): readonly string[] {
  const rows = board.map((row) => row.map((cell) => cell ?? '.').join(''));
  const first = rows.findIndex((row) => row !== '..........');
  return first === -1 ? [] : rows.slice(first);
}

describe('nextAutopilotInput fuera de la fase de caída', () => {
  /** Partida real a una línea del objetivo, con la I vertical que la completa. */
  const almostLevelUp = applyTestPatch(createInitialState({ seed: 42, startLevel: 0 }), {
    boardRows: ['OOOOOOOOO.'],
    levelLines: 9,
    levelGoal: 10,
    activePiece: { type: 'I', rotation: 1, x: 9, y: 19 },
  });
  /** Partida real con el pozo lleno: la siguiente pieza ya no cabe. */
  const almostGameOver = applyTestPatch(createInitialState({ seed: 42, startLevel: 0 }), {
    boardRows: GAME_OVER_ROWS,
    activePiece: { type: 'O', rotation: 0, x: 1, y: 0 },
  });
  /** Estado del piloto con un objetivo, para ver que lo olvida. */
  const withTarget: AutopilotState = nextAutopilotInput(
    INITIAL_AUTOPILOT_STATE,
    createInitialState({ seed: 42, startLevel: 0 }),
  ).autopilot;

  it.each([
    ['lineClear', almostLevelUp],
    ['levelComplete', almostLevelUp],
    ['entryDelay', createInitialState({ seed: 42, startLevel: 0 })],
    ['gameOver', almostGameOver],
  ] as const)('en %s devuelve EMPTY_INPUT y olvida el objetivo', (phase, initial) => {
    const state = playUntilPhase(initial, phase);
    expect(withTarget.target).not.toBeNull();
    expect(nextAutopilotInput(withTarget, state)).toEqual({
      input: EMPTY_INPUT,
      autopilot: INITIAL_AUTOPILOT_STATE,
    });
  });
});

describe('nextAutopilotInput con una pieza', () => {
  it('la pieza se fija exactamente en la colocación que eligió findBestPlacement', () => {
    for (const fixture of REAL_BOARDS) {
      const state = applyTestPatch(createInitialState({ seed: fixture.seed, startLevel: 0 }), {
        boardRows: fixture.rows,
        activePiece: createSpawnPiece(fixture.pieceType),
      });
      const piece = state.activePiece;
      const choice = piece && findBestPlacement(state.board, piece);
      expect(choice).not.toBeNull();
      const run = runPiece(state);
      expect(run.targets).toEqual([choice]);
      expect(choice && run.lockedBoard).toEqual(choice && lockPiece(state.board, choice.landed));
    }
  });

  it('envía un frame sin soft drop al empezar la pieza y después baja con soft drop', () => {
    // Segunda pieza de una partida real: el motor bloquea el soft drop hasta que se suelte.
    const second = playUntilPhase(
      playUntilPhase(createInitialState({ seed: 42, startLevel: 0 }), 'entryDelay'),
      'falling',
    );
    expect(second.softDropReleaseRequired).toBe(true);
    const run = runPiece(second);
    expect(run.inputs[0]?.softDrop).toBe(false);
    expect(run.inputs.some((input) => input.softDrop)).toBe(true);
    // El soft drop da puntos: si no se hubiera soltado, no sumaría nada.
    expect(run.score).toBeGreaterThan(second.score);
  });

  it('en el nivel 29, si el objetivo deja de ser alcanzable, recalcula y fija la pieza en un sitio válido', () => {
    // Pozo de 4 en la columna 9 tras una torre de O en las columnas 7 y 8: desde arriba se
    // llega, pero cayendo 1 fila por frame la I choca con la torre antes de llegar.
    const tower = Array.from({ length: 14 }, () => '.......OO.');
    const state = applyTestPatch(createInitialState({ seed: 123, startLevel: 0 }), {
      level: 29,
      boardRows: [...tower, 'LLLJJJOOI.', 'LSSZZJOOI.', 'SSOOZZJJI.', 'ZZOOLLLJI.'],
      activePiece: createSpawnPiece('I'),
    });
    const run = runPiece(state);
    expect(run.targets[0]).toMatchObject({ rotation: 1, x: 9 });
    expect(run.targets.length).toBeGreaterThan(1);
    const final = run.targets.at(-1);
    expect(final && collides(state.board, final.landed)).toBe(false);
    expect(final && run.lockedBoard).toEqual(final && lockPiece(state.board, final.landed));
  });

  it('si el desplazamiento previsto choca, rehace el plan y no empuja contra el bloque', () => {
    // La O ve el hueco de 2 × 2 de la derecha y va a por él...
    const planned = applyTestPatch(createInitialState({ seed: 42, startLevel: 0 }), {
      boardRows: ['OOOOOOOO..', 'OOOOOOOO..'],
      activePiece: createSpawnPiece('O'),
    });
    const first = nextAutopilotInput(INITIAL_AUTOPILOT_STATE, planned);
    expect(first.autopilot.target).toMatchObject({ x: 9 });
    expect(first.input.moveRight).toBe(true);
    // ...pero ahora tiene una columna llena justo a la derecha.
    const blocked = applyTestPatch(planned, {
      boardRows: [...Array.from({ length: 18 }, () => '......O...'), 'OOOOOOOO..', 'OOOOOOOO..'],
    });
    const next = nextAutopilotInput(first.autopilot, blocked);
    expect(next.autopilot.target).not.toBe(first.autopilot.target);
    expect(next.autopilot.target && next.autopilot.target.x).toBeLessThanOrEqual(5);
    expect(next.input.moveRight).toBe(false);
  });

  it('si el giro previsto ya no cabe, rehace el plan sin pedir ese giro', () => {
    const stack = ['LLLJJJOOI.', 'LSSZZJOOI.', 'SSOOZZJJI.', 'ZZOOLLLJI.'];
    // La I recién aparecida va a ponerse vertical para el pozo de la columna 9...
    const planned = applyTestPatch(createInitialState({ seed: 123, startLevel: 0 }), {
      boardRows: stack,
      activePiece: createSpawnPiece('I'),
    });
    const first = nextAutopilotInput(INITIAL_AUTOPILOT_STATE, planned);
    expect(first.autopilot.target).toMatchObject({ rotation: 1, x: 9 });
    // ...pero la pila ha crecido justo debajo (columnas 5 y 6) y ya no puede girar.
    const blocked = applyTestPatch(planned, {
      boardRows: [...Array.from({ length: 15 }, () => '.....OO...'), ...stack],
    });
    const next = nextAutopilotInput(first.autopilot, blocked);
    expect(next.autopilot.target).not.toBe(first.autopilot.target);
    expect(next.autopilot.target?.rotation).toBe(0);
    expect(next.input.rotateClockwise || next.input.rotateCounterClockwise).toBe(false);
  });

  it('si la pieza ya choca (no hay colocación) no pide nada', () => {
    const state = applyTestPatch(createInitialState({ seed: 42, startLevel: 0 }), {
      boardRows: GAME_OVER_ROWS,
      activePiece: createSpawnPiece('T'),
    });
    expect(nextAutopilotInput(INITIAL_AUTOPILOT_STATE, state).input).toEqual(EMPTY_INPUT);
  });

  it('si la pieza cambia de tipo (modo test) vuelve a planificar', () => {
    const initial = createInitialState({ seed: 42, startLevel: 0 });
    const planned = nextAutopilotInput(INITIAL_AUTOPILOT_STATE, initial).autopilot;
    const other = initial.activePiece?.type === 'I' ? 'O' : 'I';
    const replaced = applyTestPatch(initial, { activePiece: createSpawnPiece(other) });
    expect(nextAutopilotInput(planned, replaced).autopilot.target?.landed.type).toBe(other);
  });
});

describe('partidas completas con el motor real', { timeout: FULL_GAME_TIMEOUT_MS }, () => {
  it.each(SEEDS)(
    'semilla %i: juega sin perder, supera el mínimo de líneas y varios niveles',
    (seed) => {
      const game = gameFor(seed);
      expect(game.finalState.phase).not.toBe('gameOver');
      expect(game.pieces).toBe(MAX_PIECES);
      expect(game.finalState.lines).toBeGreaterThanOrEqual(MIN_LINES);
      expect(game.levelUps).toBeGreaterThanOrEqual(MIN_LEVEL_UPS);
      expect(game.finalState.level).toBe(game.levelUps);
    },
  );

  it('ninguna colocación elegida choca ni se sale del tablero', () => {
    for (const seed of SEEDS) {
      expect(gameFor(seed).invalidTargets).toBe(0);
    }
  });

  it('la misma semilla da exactamente la misma partida', () => {
    const again = playGame(SEEDS[0]);
    const first = gameFor(SEEDS[0]);
    expect(again.finalState.lines).toBe(first.finalState.lines);
    expect(again.finalState.score).toBe(first.finalState.score);
    expect(again.finalState).toEqual(first.finalState);
  });

  it('reproduce los tableros reales de las fixtures', () => {
    for (const fixture of REAL_BOARDS) {
      const spawn = gameFor(fixture.seed).spawns[fixture.pieceNumber - 1];
      expect(spawn?.piece.type).toBe(fixture.pieceType);
      expect(spawn && toRows(spawn.board)).toEqual(fixture.rows);
      expect(spawn && spawn.board).toEqual(boardFromRows(fixture.rows));
    }
  });

  it('cada decisión tarda mucho menos que un frame', () => {
    const spawns = SEEDS.flatMap((seed) => gameFor(seed).spawns);
    const start = performance.now();
    for (const { board, piece } of spawns) {
      findBestPlacement(board, piece);
    }
    const average = (performance.now() - start) / spawns.length;
    expect(average).toBeLessThan(DECISION_TIME_LIMIT_MS);
  });
});
