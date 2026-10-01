import { DAS_INITIAL_DELAY_FRAMES, DAS_REPEAT_FRAMES } from '../config/input_config';

/** Dirección horizontal: -1 izquierda, 0 ninguna, 1 derecha. */
export type HorizontalDirection = -1 | 0 | 1;

/** Configuración del DAS (auto-repeat), en frames. */
export interface DasConfig {
  /** Frames hasta el primer desplazamiento automático. */
  readonly initialDelayFrames: number;
  /** Frames entre desplazamientos automáticos posteriores. */
  readonly repeatFrames: number;
}

/** Estado del DAS. */
export interface DasState {
  /** Dirección mantenida en el frame anterior. */
  readonly direction: HorizontalDirection;
  /** Frames que lleva mantenida esa dirección (contador de carga). */
  readonly chargeFrames: number;
}

/** Resultado de avanzar el DAS un frame. */
export interface DasResult {
  readonly state: DasState;
  /** Desplazamiento a aplicar en este frame. */
  readonly shift: HorizontalDirection;
}

/** DAS de NES: 16 frames de espera y 6 de repetición. */
export const DEFAULT_DAS_CONFIG: DasConfig = {
  initialDelayFrames: DAS_INITIAL_DELAY_FRAMES,
  repeatFrames: DAS_REPEAT_FRAMES,
};

/** Estado del DAS sin ninguna dirección pulsada. */
export const INITIAL_DAS_STATE: DasState = { direction: 0, chargeFrames: 0 };

/**
 * Avanza el DAS un frame. Al pulsar una dirección se desplaza en el acto; si se
 * mantiene, se desplaza de nuevo al cargar `initialDelayFrames` y después cada
 * `repeatFrames`. Pulsar ambas direcciones o ninguna cancela el movimiento.
 * @param state Estado anterior.
 * @param leftHeld Si la izquierda está pulsada.
 * @param rightHeld Si la derecha está pulsada.
 * @param config Tiempos del DAS.
 * @returns Nuevo estado y desplazamiento del frame.
 */
export function updateDas(
  state: DasState,
  leftHeld: boolean,
  rightHeld: boolean,
  config: DasConfig = DEFAULT_DAS_CONFIG,
): DasResult {
  const direction: HorizontalDirection = leftHeld === rightHeld ? 0 : leftHeld ? -1 : 1;
  if (direction === 0) {
    return { state: INITIAL_DAS_STATE, shift: 0 };
  }
  if (direction !== state.direction) {
    return { state: { direction, chargeFrames: 0 }, shift: direction };
  }
  const chargeFrames = state.chargeFrames + 1;
  if (chargeFrames >= config.initialDelayFrames) {
    return {
      state: { direction, chargeFrames: config.initialDelayFrames - config.repeatFrames },
      shift: direction,
    };
  }
  return { state: { direction, chargeFrames }, shift: 0 };
}
