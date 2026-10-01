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
  /** Consume una pulsación pendiente de la acción; devuelve `false` si no había ninguna. */
  readonly consumePressed: (action: GameAction) => boolean;
  /** Indica si se ha pulsado cualquier tecla desde la última consulta y olvida las pulsaciones. */
  readonly consumeAnyPressed: () => boolean;
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
  /** Pulsaciones pendientes de consumir por tecla (varias si se pulsa rápido entre frames). */
  const pressedCounts = new Map<string, number>();

  return {
    keyDown: (code, isRepeat) => {
      if (!isRepeat && !heldCodes.has(code)) {
        pressedCounts.set(code, (pressedCounts.get(code) ?? 0) + 1);
      }
      heldCodes.add(code);
    },
    keyUp: (code) => {
      heldCodes.delete(code);
    },
    releaseAll: () => {
      heldCodes.clear();
      pressedCounts.clear();
    },
    isHeld: (action) => KEY_BINDINGS[action].some((code) => heldCodes.has(code)),
    consumePressed: (action) => {
      const code = KEY_BINDINGS[action].find((candidate) => pressedCounts.has(candidate));
      if (code === undefined) {
        return false;
      }
      const remaining = (pressedCounts.get(code) ?? 0) - 1;
      if (remaining > 0) {
        pressedCounts.set(code, remaining);
      } else {
        pressedCounts.delete(code);
      }
      return true;
    },
    consumeAnyPressed: () => {
      const any = pressedCounts.size > 0;
      pressedCounts.clear();
      return any;
    },
    clearPressed: () => {
      pressedCounts.clear();
    },
  };
}
