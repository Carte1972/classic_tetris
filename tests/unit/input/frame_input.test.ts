import { describe, expect, it } from 'vitest';
import { INITIAL_DAS_STATE } from '../../../src/input/das';
import { sampleFrameInput } from '../../../src/input/frame_input';
import { createKeyboardState } from '../../../src/input/keyboard_state';

describe('sampleFrameInput', () => {
  it('sin teclas no produce ninguna acción', () => {
    const { input } = sampleFrameInput(createKeyboardState(), INITIAL_DAS_STATE);
    expect(input).toEqual({
      moveLeft: false,
      moveRight: false,
      rotateClockwise: false,
      rotateCounterClockwise: false,
      softDrop: false,
    });
  });

  it('aplica el DAS al desplazamiento lateral', () => {
    const keyboard = createKeyboardState();
    keyboard.keyDown('ArrowRight', false);
    const first = sampleFrameInput(keyboard, INITIAL_DAS_STATE);
    expect(first.input.moveRight).toBe(true);
    const second = sampleFrameInput(keyboard, first.das);
    expect(second.input.moveRight).toBe(false);
  });

  it('rota una sola vez por pulsación aunque la tecla siga mantenida', () => {
    const keyboard = createKeyboardState();
    keyboard.keyDown('ArrowUp', false);
    keyboard.keyDown('KeyZ', false);
    const first = sampleFrameInput(keyboard, INITIAL_DAS_STATE);
    expect(first.input.rotateClockwise).toBe(true);
    expect(first.input.rotateCounterClockwise).toBe(true);
    const second = sampleFrameInput(keyboard, first.das);
    expect(second.input.rotateClockwise).toBe(false);
    expect(second.input.rotateCounterClockwise).toBe(false);
  });

  it('el soft drop sigue activo mientras se mantiene la flecha abajo', () => {
    const keyboard = createKeyboardState();
    keyboard.keyDown('ArrowDown', false);
    const first = sampleFrameInput(keyboard, INITIAL_DAS_STATE);
    expect(sampleFrameInput(keyboard, first.das).input.softDrop).toBe(true);
  });
});
