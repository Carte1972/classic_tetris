import { SOFT_DROP_POINTS_PER_CELL } from '../config/scoring_config';
import {
  FRAME_DURATION_MS,
  LINE_CLEAR_ANIMATION_FRAMES,
  SOFT_DROP_FRAMES_PER_ROW,
} from '../config/timing_config';
import { collides } from './collision';
import { getEntryDelayFrames } from './entry_delay';
import { getGravityFrames } from './gravity';
import { tryMove, tryRotate } from './movement';
import { rollNextPiece } from './randomizer';
import { createEmptyBoard, findFullRows, lockPiece, removeRows } from './board';
import { getLevelGoal, getLineClearScore } from './scoring';
import { createSpawnPiece } from './tetrominoes';
import type { ActivePiece, FrameInput, GameEvent, GameState, StepResult } from './types';

/** Entrada sin ninguna acción. */
export const EMPTY_INPUT: FrameInput = {
  moveLeft: false,
  moveRight: false,
  rotateClockwise: false,
  rotateCounterClockwise: false,
  softDrop: false,
};

/**
 * Avanza la partida el tiempo indicado con timestep fijo. Los movimientos y rotaciones
 * se aplican solo en el primer frame completado; el soft drop se mantiene en todos.
 * @param state Estado actual.
 * @param input Entrada del jugador para este paso.
 * @param dt Milisegundos transcurridos.
 * @returns Nuevo estado y eventos producidos.
 */
export function step(state: GameState, input: FrameInput, dt: number): StepResult {
  const totalMs = state.pendingMs + dt;
  const frames = Math.floor(totalMs / FRAME_DURATION_MS);
  const heldInput: FrameInput = { ...EMPTY_INPUT, softDrop: input.softDrop };
  let current: GameState = { ...state, pendingMs: totalMs - frames * FRAME_DURATION_MS };
  const events: GameEvent[] = [];
  for (let frame = 0; frame < frames; frame++) {
    const result = tick(current, frame === 0 ? input : heldInput);
    current = result.state;
    events.push(...result.events);
  }
  return { state: current, events };
}

/**
 * Avanza la partida exactamente un frame.
 * @param state Estado actual.
 * @param input Entrada del jugador en este frame.
 * @returns Nuevo estado y eventos producidos.
 */
export function tick(state: GameState, input: FrameInput): StepResult {
  switch (state.phase) {
    case 'falling':
      return tickFalling(state, input);
    case 'lineClear':
      return tickLineClear(state);
    case 'entryDelay':
      return tickEntryDelay(state);
    case 'levelComplete':
    case 'gameOver':
      return { state, events: [] };
  }
}

/**
 * Frame con una pieza cayendo: desplazamiento, rotación y caída, en ese orden (como en NES).
 * @param state Estado en fase `falling`.
 * @param input Entrada del frame.
 * @returns Nuevo estado y eventos.
 */
function tickFalling(state: GameState, input: FrameInput): StepResult {
  if (state.activePiece === null) {
    return { state, events: [] };
  }
  const events: GameEvent[] = [];
  let piece = state.activePiece;

  const shifted = applyShift(state, piece, input);
  if (shifted !== null) {
    piece = shifted;
    events.push({ type: 'pieceMoved' });
  }

  const rotated = applyRotation(state, piece, input);
  if (rotated !== null) {
    piece = rotated;
    events.push({ type: 'pieceRotated' });
  }

  const softDropReleaseRequired = state.softDropReleaseRequired && input.softDrop;
  const softDropActive = input.softDrop && !softDropReleaseRequired;
  const gravityFrames = state.gravityFrames + 1;
  const softDropFrames = softDropActive ? state.softDropFrames + 1 : 0;
  const gravityDue = gravityFrames >= getGravityFrames(state.level);
  const softDropDue = softDropActive && softDropFrames >= SOFT_DROP_FRAMES_PER_ROW;
  const updated: GameState = { ...state, softDropReleaseRequired };

  if (!gravityDue && !softDropDue) {
    return { state: { ...updated, activePiece: piece, gravityFrames, softDropFrames }, events };
  }

  const dropped = tryMove(state.board, piece, 0, 1);
  if (dropped === null) {
    return lockActivePiece(updated, piece, events);
  }
  return {
    state: {
      ...updated,
      activePiece: dropped,
      gravityFrames: 0,
      softDropFrames: 0,
      score: state.score + (softDropDue ? SOFT_DROP_POINTS_PER_CELL : 0),
    },
    events,
  };
}

/**
 * Aplica el desplazamiento lateral pedido (se ignora si se piden ambos lados).
 * @param state Estado actual.
 * @param piece Pieza activa.
 * @param input Entrada del frame.
 * @returns La pieza desplazada, o `null` si no se ha movido.
 */
function applyShift(state: GameState, piece: ActivePiece, input: FrameInput): ActivePiece | null {
  if (input.moveLeft === input.moveRight) {
    return null;
  }
  return tryMove(state.board, piece, input.moveLeft ? -1 : 1, 0);
}

/**
 * Aplica la rotación pedida (se ignora si se piden ambos sentidos).
 * @param state Estado actual.
 * @param piece Pieza activa.
 * @param input Entrada del frame.
 * @returns La pieza rotada, o `null` si no ha rotado.
 */
function applyRotation(
  state: GameState,
  piece: ActivePiece,
  input: FrameInput,
): ActivePiece | null {
  if (input.rotateClockwise === input.rotateCounterClockwise) {
    return null;
  }
  return tryRotate(state.board, piece, input.rotateClockwise ? 1 : -1);
}

/**
 * Fija la pieza y pasa a la animación de limpieza o al retardo de entrada.
 * @param state Estado actual.
 * @param piece Pieza que se fija.
 * @param events Eventos ya producidos en este frame.
 * @returns Nuevo estado y eventos.
 */
function lockActivePiece(
  state: GameState,
  piece: ActivePiece,
  events: readonly GameEvent[],
): StepResult {
  const board = lockPiece(state.board, piece);
  const fullRows = findFullRows(board);
  const entryDelayFrames = getEntryDelayFrames(piece.y, state.level);
  const base: GameState = {
    ...state,
    board,
    activePiece: null,
    gravityFrames: 0,
    softDropFrames: 0,
    softDropReleaseRequired: true,
    entryDelayFrames,
  };
  const lockEvents: GameEvent[] = [...events, { type: 'pieceLocked' }];

  if (fullRows.length === 0) {
    return {
      state: {
        ...base,
        phase: 'entryDelay',
        phaseFramesRemaining: entryDelayFrames,
        phaseFramesTotal: entryDelayFrames,
      },
      events: lockEvents,
    };
  }
  return {
    state: {
      ...base,
      phase: 'lineClear',
      clearingRows: fullRows,
      phaseFramesRemaining: LINE_CLEAR_ANIMATION_FRAMES,
      phaseFramesTotal: LINE_CLEAR_ANIMATION_FRAMES,
    },
    events: [...lockEvents, { type: 'linesCleared', count: fullRows.length }],
  };
}

/**
 * Frame de la animación de limpieza; al terminar elimina las filas y actualiza
 * puntuación y líneas. Si se alcanza el objetivo del nivel, la partida pasa a
 * `levelComplete` con el nivel siguiente y emite `levelUp`.
 * @param state Estado en fase `lineClear`.
 * @returns Nuevo estado y eventos.
 */
function tickLineClear(state: GameState): StepResult {
  const remaining = state.phaseFramesRemaining - 1;
  if (remaining > 0) {
    return { state: { ...state, phaseFramesRemaining: remaining }, events: [] };
  }
  const cleared = state.clearingRows.length;
  const levelLines = state.levelLines + cleared;
  const base: GameState = {
    ...state,
    board: removeRows(state.board, state.clearingRows),
    clearingRows: [],
    lines: state.lines + cleared,
    levelLines,
    score: state.score + getLineClearScore(cleared, state.level),
  };
  if (levelLines >= state.levelGoal) {
    const level = state.level + 1;
    return {
      state: {
        ...base,
        phase: 'levelComplete',
        level,
        levelLines: state.levelGoal,
        phaseFramesRemaining: 0,
        phaseFramesTotal: 0,
      },
      events: [{ type: 'levelUp', level }],
    };
  }
  return {
    state: {
      ...base,
      phase: 'entryDelay',
      phaseFramesRemaining: state.entryDelayFrames,
      phaseFramesTotal: state.entryDelayFrames,
    },
    events: [],
  };
}

/**
 * Empieza el nivel siguiente tras superar uno: tablero vacío, contador del nivel a cero,
 * nuevo objetivo y la siguiente pieza ya cayendo.
 * @param state Estado en fase `levelComplete`.
 * @returns Estado del nuevo nivel (sin cambios si la partida no estaba en esa fase).
 */
export function startNextLevel(state: GameState): GameState {
  if (state.phase !== 'levelComplete') {
    return state;
  }
  return spawnNextPiece({
    ...state,
    board: createEmptyBoard(),
    levelLines: 0,
    levelGoal: getLevelGoal(state.level - state.startLevel),
    gravityFrames: 0,
    softDropFrames: 0,
    softDropReleaseRequired: true,
  }).state;
}

/**
 * Frame del retardo de entrada; al terminar aparece la siguiente pieza.
 * @param state Estado en fase `entryDelay`.
 * @returns Nuevo estado y eventos.
 */
function tickEntryDelay(state: GameState): StepResult {
  const remaining = state.phaseFramesRemaining - 1;
  if (remaining > 0) {
    return { state: { ...state, phaseFramesRemaining: remaining }, events: [] };
  }
  return spawnNextPiece(state);
}

/**
 * Hace aparecer la siguiente pieza y elige la nueva vista previa. Si no cabe, termina
 * la partida.
 * @param state Estado actual.
 * @returns Nuevo estado y eventos.
 */
function spawnNextPiece(state: GameState): StepResult {
  const piece = createSpawnPiece(state.nextPiece);
  const next = rollNextPiece(state.rngState, state.nextPiece, state.level);
  const base: GameState = {
    ...state,
    nextPiece: next.piece,
    rngState: next.rngState,
    phaseFramesRemaining: 0,
    phaseFramesTotal: 0,
  };
  if (collides(state.board, piece)) {
    return { state: { ...base, phase: 'gameOver' }, events: [{ type: 'gameOver' }] };
  }
  return { state: { ...base, phase: 'falling', activePiece: piece }, events: [] };
}
