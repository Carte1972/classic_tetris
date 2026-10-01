import { describe, expect, it } from 'vitest';
import { createGameSession } from '../../../src/app/game_session';
import { FRAME_DURATION_MS } from '../../../src/config/timing_config';
import { createInitialState } from '../../../src/engine/game_state';
import { createKeyboardState } from '../../../src/input/keyboard_state';

const OPTIONS = { seed: 42, startLevel: 0 };

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
});
