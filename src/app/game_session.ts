import { INITIAL_AUTOPILOT_STATE, nextAutopilotInput, type AutopilotState } from '../ai/autopilot';
import { FRAME_DURATION_MS } from '../config/timing_config';
import { createInitialState, type NewGameOptions } from '../engine/game_state';
import { startNextLevel, step } from '../engine/step';
import type { GameEvent, GameState } from '../engine/types';
import { INITIAL_DAS_STATE, type DasState } from '../input/das';
import { sampleFrameInput } from '../input/frame_input';
import type { KeyboardState } from '../input/keyboard_state';
import { consumeFrames } from './timestep';

/** Partida en curso: une el motor con el teclado (o con el piloto automático) frame a frame. */
export interface GameSession {
  /** Estado actual del motor. */
  readonly getState: () => GameState;
  /**
   * Avanza la partida el tiempo indicado, muestreando el teclado en cada frame lógico.
   * @returns Los eventos producidos.
   */
  readonly advance: (dtMs: number) => readonly GameEvent[];
  /** Empieza el nivel siguiente tras superar uno (tablero vacío). */
  readonly startNextLevel: () => void;
  /** Sustituye el estado del motor (solo para el modo test). El piloto vuelve a planificar. */
  readonly replaceState: (next: GameState) => void;
  /**
   * Activa o desactiva el piloto automático. Al activarlo planifica desde la posición actual
   * de la pieza; al desactivarlo la pieza sigue donde está y vuelve a mandar el teclado.
   */
  readonly setAutopilot: (enabled: boolean) => void;
}

/**
 * Crea una partida nueva conectada a un registro de teclado.
 * @param options Semilla y nivel inicial.
 * @param keyboard Registro de teclado del que se lee la entrada.
 * @param autopilotEnabled Si la partida empieza con el piloto automático activo.
 * @returns La sesión de juego.
 */
export function createGameSession(
  options: NewGameOptions,
  keyboard: KeyboardState,
  autopilotEnabled = false,
): GameSession {
  let state = createInitialState(options);
  let das: DasState = INITIAL_DAS_STATE;
  let accumulatedMs = 0;
  let autopilotOn = autopilotEnabled;
  let autopilot: AutopilotState = INITIAL_AUTOPILOT_STATE;

  return {
    getState: () => state,
    advance: (dtMs) => {
      const budget = consumeFrames(accumulatedMs, dtMs);
      accumulatedMs = budget.remainderMs;
      const events: GameEvent[] = [];
      for (let frame = 0; frame < budget.frames; frame++) {
        // El teclado se muestrea siempre, también con el piloto: así se consumen las
        // rotaciones pulsadas y el DAS sigue al día cuando se desactiva.
        const sample = sampleFrameInput(keyboard, das);
        das = sample.das;
        let input = sample.input;
        if (autopilotOn) {
          const pilot = nextAutopilotInput(autopilot, state);
          autopilot = pilot.autopilot;
          input = pilot.input;
        }
        const result = step(state, input, FRAME_DURATION_MS);
        state = result.state;
        events.push(...result.events);
      }
      return events;
    },
    startNextLevel: () => {
      state = startNextLevel(state);
    },
    replaceState: (next) => {
      state = next;
      autopilot = INITIAL_AUTOPILOT_STATE;
    },
    setAutopilot: (enabled) => {
      if (enabled && !autopilotOn) {
        autopilot = INITIAL_AUTOPILOT_STATE;
      }
      autopilotOn = enabled;
    },
  };
}
