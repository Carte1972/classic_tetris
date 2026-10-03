import { describe, expect, it } from 'vitest';
import { findBestPlacement, generatePlacements } from '../../../src/ai/dellacherie';
import { createGameSession, type GameSession } from '../../../src/app/game_session';
import { applyTestPatch, type TestGamePatch } from '../../../src/app/test_mode';
import { FRAME_DURATION_MS } from '../../../src/config/timing_config';
import { lockPiece } from '../../../src/engine/board';
import { createInitialState } from '../../../src/engine/game_state';
import type { Board, GameState } from '../../../src/engine/types';
import { createKeyboardState } from '../../../src/input/keyboard_state';

const OPTIONS = { seed: 42, startLevel: 0 };

/** Frames de sobra para que una pieza se fije o termine la limpieza de líneas. */
const MAX_FRAMES = 3000;

/** A una línea del objetivo, con la I vertical que la completa (como `forceLevelUp` en los e2e). */
const ALMOST_LEVEL_UP: TestGamePatch = {
  boardRows: ['OOOOOOOOO.'],
  levelLines: 9,
  levelGoal: 10,
  activePiece: { type: 'I', rotation: 1, x: 9, y: 19 },
};

describe('createGameSession', () => {
  it('empieza con el estado inicial de la semilla', () => {
    const session = createGameSession(OPTIONS, createKeyboardState());
    expect(session.getState()).toEqual(createInitialState(OPTIONS));
  });

  it('una pulsación no se pierde aunque el fotograma no complete un frame (pantallas de 120 Hz)', () => {
    const keyboard = createKeyboardState();
    const session = createGameSession(OPTIONS, keyboard);
    const startX = session.getState().activePiece?.x ?? 0;
    keyboard.keyDown('ArrowLeft', false);
    expect(session.advance(FRAME_DURATION_MS / 2)).toEqual([]);
    const events = session.advance(FRAME_DURATION_MS / 2);
    expect(events).toContainEqual({ type: 'pieceMoved' });
    expect(session.getState().activePiece?.x).toBe(startX - 1);
  });

  it('muestrea el teclado en cada frame: el DAS avanza igual con fotogramas largos', () => {
    const keyboard = createKeyboardState();
    const session = createGameSession(OPTIONS, keyboard);
    const startX = session.getState().activePiece?.x ?? 0;
    keyboard.keyDown('ArrowLeft', false);
    session.advance(FRAME_DURATION_MS * 17);
    expect(session.getState().activePiece?.x).toBe(startX - 2);
  });

  it('una rotación pulsada se aplica una sola vez', () => {
    const keyboard = createKeyboardState();
    const session = createGameSession(OPTIONS, keyboard);
    keyboard.keyDown('ArrowUp', false);
    const events = session.advance(FRAME_DURATION_MS * 5);
    expect(events.filter((e) => e.type === 'pieceRotated')).toHaveLength(1);
  });

  it('replaceState sustituye el estado del motor (modo test)', () => {
    const session = createGameSession(OPTIONS, createKeyboardState());
    const replaced = { ...session.getState(), score: 999 };
    session.replaceState(replaced);
    expect(session.getState()).toBe(replaced);
  });
});

/** Avanza frame a frame hasta que se fija la pieza activa. */
function advanceUntilLocked(session: GameSession): Board {
  for (let frame = 0; frame < MAX_FRAMES; frame++) {
    if (session.advance(FRAME_DURATION_MS).some((event) => event.type === 'pieceLocked')) {
      return session.getState().board;
    }
  }
  throw new Error('La pieza no se ha fijado');
}

/** Tablero que quedaría al fijar la pieza activa donde la colocaría el algoritmo. */
function expectedLock(state: GameState): Board {
  const piece = state.activePiece;
  const choice = piece === null ? null : findBestPlacement(state.board, piece);
  if (choice === null) {
    throw new Error('No hay colocación');
  }
  return lockPiece(state.board, choice.landed);
}

describe('createGameSession con el piloto automático', () => {
  it('la pieza se fija donde la coloca el algoritmo de Dellacherie', () => {
    const session = createGameSession(OPTIONS, createKeyboardState(), true);
    const expected = expectedLock(session.getState());
    expect(advanceUntilLocked(session)).toEqual(expected);
  });

  it('las teclas de juego (flechas, ↓ y Z) no cambian la jugada', () => {
    const keyboard = createKeyboardState();
    const withKeys = createGameSession(OPTIONS, keyboard, true);
    const withoutKeys = createGameSession(OPTIONS, createKeyboardState(), true);
    keyboard.keyDown('ArrowLeft', false);
    keyboard.keyDown('ArrowDown', false);
    for (let frame = 0; frame < 120; frame++) {
      if (frame % 10 === 0) {
        keyboard.keyDown('KeyZ', false);
        keyboard.keyUp('KeyZ');
        keyboard.keyDown('ArrowUp', false);
        keyboard.keyUp('ArrowUp');
      }
      withKeys.advance(FRAME_DURATION_MS);
      withoutKeys.advance(FRAME_DURATION_MS);
    }
    expect(withKeys.getState()).toEqual(withoutKeys.getState());
  });

  it('al desactivarlo no se aplica una rotación pulsada mientras estaba activo', () => {
    const keyboard = createKeyboardState();
    const session = createGameSession(OPTIONS, keyboard, true);
    session.advance(FRAME_DURATION_MS);
    keyboard.keyDown('ArrowUp', false);
    keyboard.keyUp('ArrowUp');
    session.advance(FRAME_DURATION_MS);
    session.setAutopilot(false);
    const events = session.advance(FRAME_DURATION_MS * 5);
    expect(events.filter((event) => event.type === 'pieceRotated')).toHaveLength(0);
  });

  it('al desactivarlo la pieza sigue donde está y vuelve a mandar el teclado', () => {
    const keyboard = createKeyboardState();
    const session = createGameSession(OPTIONS, keyboard, true);
    session.advance(FRAME_DURATION_MS * 3);
    session.setAutopilot(false);
    const before = session.getState().activePiece;
    session.advance(FRAME_DURATION_MS);
    expect(session.getState().activePiece?.x).toBe(before?.x);
    keyboard.keyDown('ArrowUp', false);
    keyboard.keyUp('ArrowUp');
    expect(session.advance(FRAME_DURATION_MS)).toContainEqual({ type: 'pieceRotated' });
  });

  it('activado a mitad de una pieza, la juega desde su posición actual', () => {
    const keyboard = createKeyboardState();
    const session = createGameSession(OPTIONS, keyboard);
    keyboard.keyDown('ArrowLeft', false);
    session.advance(FRAME_DURATION_MS * 17);
    keyboard.keyUp('ArrowLeft');
    const moved = session.getState();
    expect(moved.activePiece?.x).toBe((createInitialState(OPTIONS).activePiece?.x ?? 0) - 2);
    session.setAutopilot(true);
    expect(advanceUntilLocked(session)).toEqual(expectedLock(moved));
  });

  it('sigue activo en el nivel siguiente y juega su primera pieza', () => {
    const session = createGameSession(OPTIONS, createKeyboardState(), true);
    session.replaceState(applyTestPatch(session.getState(), ALMOST_LEVEL_UP));
    for (
      let frame = 0;
      frame < MAX_FRAMES && session.getState().phase !== 'levelComplete';
      frame++
    ) {
      session.advance(FRAME_DURATION_MS);
    }
    expect(session.getState().phase).toBe('levelComplete');
    session.startNextLevel();
    const expected = expectedLock(session.getState());
    expect(advanceUntilLocked(session)).toEqual(expected);
  });

  it('replaceState hace que el piloto vuelva a planificar desde la pieza nueva', () => {
    const session = createGameSession(OPTIONS, createKeyboardState(), true);
    session.advance(FRAME_DURATION_MS * 2);
    const piece = session.getState().activePiece;
    expect(piece).not.toBeNull();
    // La misma S, ahora sobre una pila con un escalón a la izquierda donde encaja tumbada.
    const replaced = applyTestPatch(session.getState(), {
      boardRows: ['...OOOOOOO', '..OOOOOOOO'],
      activePiece: piece === null ? null : { ...piece, y: 3 },
    });
    session.replaceState(replaced);
    // Si siguiera con el plan de antes (pensado para el tablero vacío), acabaría en otro sitio.
    const stalePlan = piece && findBestPlacement(createInitialState(OPTIONS).board, piece);
    const stale = generatePlacements(replaced.board, replaced.activePiece ?? piece!).find(
      (p) => p.rotation === stalePlan?.rotation && p.x === stalePlan.x,
    );
    expect(stale && lockPiece(replaced.board, stale.landed)).not.toEqual(expectedLock(replaced));
    expect(advanceUntilLocked(session)).toEqual(expectedLock(replaced));
  });
});
