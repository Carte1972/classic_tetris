import { isBoundKey, type KeyboardState } from './keyboard_state';

/** Destino de eventos de teclado y foco (en el navegador, `window`). */
export type KeyboardEventTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>;

/**
 * Conecta un registro de teclado a los eventos del navegador. Evita el comportamiento
 * por defecto de las teclas del juego (como el desplazamiento de la página con las
 * flechas) y suelta todas las teclas al perder el foco.
 * @param target Destino de los eventos.
 * @param keyboard Registro que recibe las pulsaciones.
 * @returns Función que desconecta los eventos.
 */
export function attachKeyboard(target: KeyboardEventTarget, keyboard: KeyboardState): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (isBoundKey(event.code)) {
      event.preventDefault();
    }
    keyboard.keyDown(event.code, event.repeat);
  };
  const onKeyUp = (event: KeyboardEvent): void => {
    keyboard.keyUp(event.code);
  };
  const onBlur = (): void => {
    keyboard.releaseAll();
  };
  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onBlur);
  return () => {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('keyup', onKeyUp);
    target.removeEventListener('blur', onBlur);
  };
}
