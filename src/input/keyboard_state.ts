import { KEY_BINDINGS, type GameAction } from '../config/input_config';

/** Registro de teclas pulsadas, encapsulado y sin dependencias del DOM. */
export interface KeyboardState {
  /** Registra una pulsación; las repeticiones automáticas del sistema no cuentan como nueva pulsación. */
  readonly keyDown: (code: string, isRepeat: boolean) => void;
  /** Registra que se ha soltado una tecla. */
  readonly keyUp: (code: string) => void;
  /** Suelta todas las teclas (por ejemplo, al perder el foco la ventana). */
  readonly releaseAll: () => void;
  /** Indica si alguna tecla de la acción está mantenida. */
  readonly isHeld: (action: GameAction) => boolean;
  /** Devuelve si la acción se ha pulsado desde la última consulta y la marca como consumida. */
  readonly consumePressed: (action: GameAction) => boolean;
  /** Olvida las pulsaciones pendientes sin soltar las teclas mantenidas. */
  readonly clearPressed: () => void;
}

/**
 * Indica si una tecla está asociada a alguna acción del juego.
 * @param code `KeyboardEvent.code` de la tecla.
 * @returns `true` si la tecla se usa en el juego.
 */
export function isBoundKey(code: string): boolean {
  return Object.values(KEY_BINDINGS).some((codes) => codes.includes(code));
}

/**
 * Crea un registro de teclado vacío.
 * @returns El registro.
 */
export function createKeyboardState(): KeyboardState {
  const heldCodes = new Set<string>();
  const pressedCodes = new Set<string>();

  return {
    keyDown: (code, isRepeat) => {
      if (!isRepeat && !heldCodes.has(code)) {
        pressedCodes.add(code);
      }
      heldCodes.add(code);
    },
    keyUp: (code) => {
      heldCodes.delete(code);
    },
    releaseAll: () => {
      heldCodes.clear();
      pressedCodes.clear();
    },
    isHeld: (action) => KEY_BINDINGS[action].some((code) => heldCodes.has(code)),
    consumePressed: (action) => {
      const codes = KEY_BINDINGS[action].filter((code) => pressedCodes.has(code));
      codes.forEach((code) => pressedCodes.delete(code));
      return codes.length > 0;
    },
    clearPressed: () => {
      pressedCodes.clear();
    },
  };
}
