import { describe, expect, it } from 'vitest';
import { attachKeyboard } from '../../../src/input/keyboard_listener';
import { createKeyboardState } from '../../../src/input/keyboard_state';

/** Crea un evento con las propiedades de teclado que usa el listener. */
function keyEvent(type: string, code: string, repeat = false): Event {
  const event = new Event(type, { cancelable: true });
  Object.defineProperties(event, { code: { value: code }, repeat: { value: repeat } });
  return event;
}

describe('attachKeyboard', () => {
  it('reenvía pulsaciones al registro y evita el comportamiento por defecto de las teclas del juego', () => {
    const target = new EventTarget() as unknown as Window;
    const keyboard = createKeyboardState();
    attachKeyboard(target, keyboard);
    const arrow = keyEvent('keydown', 'ArrowDown');
    target.dispatchEvent(arrow);
    expect(arrow.defaultPrevented).toBe(true);
    expect(keyboard.isHeld('softDrop')).toBe(true);
    target.dispatchEvent(keyEvent('keyup', 'ArrowDown'));
    expect(keyboard.isHeld('softDrop')).toBe(false);
  });

  it('no bloquea teclas ajenas al juego', () => {
    const target = new EventTarget() as unknown as Window;
    attachKeyboard(target, createKeyboardState());
    const other = keyEvent('keydown', 'KeyQ');
    target.dispatchEvent(other);
    expect(other.defaultPrevented).toBe(false);
  });

  it('las pulsaciones en un campo de texto no llegan al juego, pero las sueltas sí', () => {
    const target = new EventTarget() as unknown as Window;
    const keyboard = createKeyboardState();
    attachKeyboard(target, keyboard);
    target.dispatchEvent(keyEvent('keydown', 'ArrowLeft'));
    const typed = keyEvent('keydown', 'KeyM');
    Object.defineProperty(typed, 'target', { value: { tagName: 'INPUT' } });
    target.dispatchEvent(typed);
    expect(typed.defaultPrevented).toBe(false);
    expect(keyboard.consumePressed('mute')).toBe(false);
    const editable = keyEvent('keydown', 'KeyP');
    Object.defineProperty(editable, 'target', {
      value: { tagName: 'DIV', isContentEditable: true },
    });
    target.dispatchEvent(editable);
    expect(keyboard.consumePressed('pause')).toBe(false);
    const released = keyEvent('keyup', 'ArrowLeft');
    Object.defineProperty(released, 'target', { value: { tagName: 'INPUT' } });
    target.dispatchEvent(released);
    expect(keyboard.isHeld('moveLeft')).toBe(false);
  });

  it('suelta todas las teclas al perder el foco', () => {
    const target = new EventTarget() as unknown as Window;
    const keyboard = createKeyboardState();
    attachKeyboard(target, keyboard);
    target.dispatchEvent(keyEvent('keydown', 'ArrowLeft'));
    target.dispatchEvent(new Event('blur'));
    expect(keyboard.isHeld('moveLeft')).toBe(false);
  });

  it('deja de escuchar al desconectarse', () => {
    const target = new EventTarget() as unknown as Window;
    const keyboard = createKeyboardState();
    const detach = attachKeyboard(target, keyboard);
    detach();
    target.dispatchEvent(keyEvent('keydown', 'ArrowLeft'));
    expect(keyboard.isHeld('moveLeft')).toBe(false);
  });
});
