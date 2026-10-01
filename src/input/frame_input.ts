import type { FrameInput } from '../engine/types';
import { updateDas, type DasConfig, type DasState, DEFAULT_DAS_CONFIG } from './das';
import type { KeyboardState } from './keyboard_state';

/** Resultado de muestrear el teclado para un frame. */
export interface FrameInputSample {
  /** Entrada para el motor. */
  readonly input: FrameInput;
  /** Nuevo estado del DAS. */
  readonly das: DasState;
}

/**
 * Convierte el estado del teclado en la entrada de un frame del motor: desplazamiento
 * lateral con DAS (también para pulsaciones más breves que un frame), rotaciones por
 * pulsación (sin autorrepetición) y soft drop mantenido.
 * @param keyboard Registro de teclado (se consumen las pulsaciones de rotación).
 * @param das Estado del DAS del frame anterior.
 * @param config Tiempos del DAS.
 * @returns Entrada del frame y nuevo estado del DAS.
 */
export function sampleFrameInput(
  keyboard: KeyboardState,
  das: DasState,
  config: DasConfig = DEFAULT_DAS_CONFIG,
): FrameInputSample {
  // Una pulsación muy breve (soltada antes del frame) también cuenta como dirección.
  const leftPressed = keyboard.consumePressed('moveLeft');
  const rightPressed = keyboard.consumePressed('moveRight');
  const dasResult = updateDas(
    das,
    leftPressed || keyboard.isHeld('moveLeft'),
    rightPressed || keyboard.isHeld('moveRight'),
    config,
  );
  return {
    input: {
      moveLeft: dasResult.shift === -1,
      moveRight: dasResult.shift === 1,
      rotateClockwise: keyboard.consumePressed('rotateClockwise'),
      rotateCounterClockwise: keyboard.consumePressed('rotateCounterClockwise'),
      softDrop: keyboard.isHeld('softDrop'),
    },
    das: dasResult.state,
  };
}
