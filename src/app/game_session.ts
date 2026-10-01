import { FRAME_DURATION_MS } from '../config/timing_config';
import { createInitialState, type NewGameOptions } from '../engine/game_state';
import { step } from '../engine/step';
import type { GameEvent, GameState } from '../engine/types';
import { INITIAL_DAS_STATE, type DasState } from '../input/das';
import { sampleFrameInput } from '../input/frame_input';
import type { KeyboardState } from '../input/keyboard_state';
import { consumeFrames } from './timestep';

/** Partida en curso: une el motor con el teclado frame a frame. */
export interface GameSession {
  /** Estado actual del motor. */
  readonly getState: () => GameState;
  /**
   * Avanza la partida el tiempo indicado, muestreando el teclado en cada frame lógico.
   * @returns Los eventos producidos.
   */
  readonly advance: (dtMs: number) => readonly GameEvent[];
}

/**
 * Crea una partida nueva conectada a un registro de teclado.
 * @param options Semilla y nivel inicial.
 * @param keyboard Registro de teclado del que se lee la entrada.
 * @returns La sesión de juego.
 */
export function createGameSession(options: NewGameOptions, keyboard: KeyboardState): GameSession {
  let state = createInitialState(options);
  let das: DasState = INITIAL_DAS_STATE;
  let accumulatedMs = 0;

  return {
    getState: () => state,
    advance: (dtMs) => {
      const budget = consumeFrames(accumulatedMs, dtMs);
      accumulatedMs = budget.remainderMs;
      const events: GameEvent[] = [];
      for (let frame = 0; frame < budget.frames; frame++) {
        const sample = sampleFrameInput(keyboard, das);
        das = sample.das;
        const result = step(state, sample.input, FRAME_DURATION_MS);
        state = result.state;
        events.push(...result.events);
      }
      return events;
    },
  };
}
