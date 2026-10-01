import { describe, expect, it } from 'vitest';
import { createKeyboardState, isBoundKey } from '../../../src/input/keyboard_state';

describe('createKeyboardState', () => {
  it('registra teclas mantenidas por acción', () => {
    const keyboard = createKeyboardState();
    keyboard.keyDown('ArrowLeft', false);
    expect(keyboard.isHeld('moveLeft')).toBe(true);
    expect(keyboard.isHeld('moveRight')).toBe(false);
    keyboard.keyUp('ArrowLeft');
    expect(keyboard.isHeld('moveLeft')).toBe(false);
  });

  it('una pulsación se consume una sola vez', () => {
    const keyboard = createKeyboardState();
    keyboard.keyDown('KeyZ', false);
    expect(keyboard.consumePressed('rotateCounterClockwise')).toBe(true);
    expect(keyboard.consumePressed('rotateCounterClockwise')).toBe(false);
  });

  it('las repeticiones automáticas del sistema no son pulsaciones nuevas', () => {
    const keyboard = createKeyboardState();
    keyboard.keyDown('ArrowUp', false);
    keyboard.consumePressed('rotateClockwise');
    keyboard.keyDown('ArrowUp', true);
    keyboard.keyDown('ArrowUp', false);
    expect(keyboard.consumePressed('rotateClockwise')).toBe(false);
    keyboard.keyUp('ArrowUp');
    keyboard.keyDown('ArrowUp', false);
    expect(keyboard.consumePressed('rotateClockwise')).toBe(true);
  });

  it('una pulsación breve (pulsar y soltar entre frames) no se pierde', () => {
    const keyboard = createKeyboardState();
    keyboard.keyDown('KeyP', false);
    keyboard.keyUp('KeyP');
    expect(keyboard.isHeld('pause')).toBe(false);
    expect(keyboard.consumePressed('pause')).toBe(true);
  });

  it('acepta varias teclas para la misma acción', () => {
    const keyboard = createKeyboardState();
    keyboard.keyDown('Space', false);
    expect(keyboard.consumePressed('skip')).toBe(true);
    keyboard.keyDown('NumpadEnter', false);
    expect(keyboard.consumePressed('confirm')).toBe(true);
  });

  it('releaseAll suelta todo y olvida las pulsaciones pendientes', () => {
    const keyboard = createKeyboardState();
    keyboard.keyDown('ArrowDown', false);
    keyboard.releaseAll();
    expect(keyboard.isHeld('softDrop')).toBe(false);
    expect(keyboard.consumePressed('menuDown')).toBe(false);
  });

  it('clearPressed olvida las pulsaciones pero mantiene las teclas', () => {
    const keyboard = createKeyboardState();
    keyboard.keyDown('ArrowDown', false);
    keyboard.clearPressed();
    expect(keyboard.consumePressed('menuDown')).toBe(false);
    expect(keyboard.isHeld('softDrop')).toBe(true);
  });
});

describe('isBoundKey', () => {
  it('reconoce las teclas del juego', () => {
    expect(isBoundKey('ArrowLeft')).toBe(true);
    expect(isBoundKey('KeyM')).toBe(true);
    expect(isBoundKey('KeyQ')).toBe(false);
  });
});
