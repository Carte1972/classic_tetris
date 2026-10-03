import { isBoundKey, type KeyboardState } from './keyboard_state';

/** Destino de eventos de teclado y foco (en el navegador, `window`). */
export type KeyboardEventTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>;

/** Elementos en los que se escribe texto. */
const TEXT_ENTRY_TAGS: ReadonlySet<string> = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Indica si un evento va dirigido a un campo de texto (como el del nombre del ranking).
 * @param target Destino del evento.
 * @returns `true` si es un elemento donde se escribe.
 */
function isTextEntry(target: EventTarget | null): boolean {
  if (target === null || !('tagName' in target)) {
    return false;
  }
  const element = target as { readonly tagName: unknown; readonly isContentEditable?: unknown };
  return (
    (typeof element.tagName === 'string' && TEXT_ENTRY_TAGS.has(element.tagName)) ||
    element.isContentEditable === true
  );
}

/**
 * Conecta un registro de teclado a los eventos del navegador. Evita el comportamiento
 * por defecto de las teclas del juego (como el desplazamiento de la página con las
 * flechas) y suelta todas las teclas al perder el foco. Las pulsaciones dirigidas a un
 * campo de texto son de ese campo: el juego no las recibe (las sueltas, sí, para que
 * ninguna tecla se quede pulsada).
 * @param target Destino de los eventos.
 * @param keyboard Registro que recibe las pulsaciones.
 * @returns Función que desconecta los eventos.
 */
export function attachKeyboard(target: KeyboardEventTarget, keyboard: KeyboardState): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (isTextEntry(event.target)) {
      return;
    }
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
