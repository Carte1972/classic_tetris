import type { GameState } from '../engine/types';
import type { BackgroundScene, SceneConditions } from '../scene/red_square_scene';
import type { AppController, AppSnapshot } from './app_controller';
import type { TestGamePatch } from './test_mode';

/**
 * Clase que, puesta en la raíz del documento, oculta la interfaz (menús, pozo y paneles)
 * y deja ver solo la Plaza Roja. Solo la usa el modo test, para grabar la plaza limpia.
 */
export const INTERFACE_HIDDEN_CLASS = 'interface-hidden';

/** API que el modo test (`?test=1`) expone en `window.__tetris` para e2e y capturas. */
export interface TetrisTestApi {
  /** Estado de la interfaz. */
  readonly getSnapshot: () => AppSnapshot;
  /** Estado del motor de la partida en curso. */
  readonly getGameState: () => GameState | null;
  /** Modifica la partida en curso. */
  readonly patchGame: (patch: TestGamePatch) => void;
  /** Congela la celebración en un instante (ms), o la reanuda con `null`. */
  readonly freezeCelebration: (elapsedMs: number | null) => void;
  /** Fija la hora y el tiempo atmosférico del fondo. */
  readonly setScene: (conditions: SceneConditions) => void;
  /** Oculta o vuelve a mostrar la interfaz para ver solo la Plaza Roja (el juego sigue igual). */
  readonly setInterfaceHidden: (hidden: boolean) => void;
}

declare global {
  interface Window {
    /** API del modo test; solo existe con `?test=1`. */
    __tetris?: TetrisTestApi;
  }
}

/**
 * Crea la API del modo test sobre el controlador y la escena de fondo.
 * @param controller Controlador de la aplicación.
 * @param scene Escena de fondo.
 * @param root Raíz del documento, donde se marca la interfaz como oculta.
 * @returns La API.
 */
export function createTestApi(
  controller: AppController,
  scene: BackgroundScene,
  root: Pick<HTMLElement, 'classList'>,
): TetrisTestApi {
  return {
    getSnapshot: controller.getSnapshot,
    getGameState: controller.getGameState,
    patchGame: controller.patchGame,
    freezeCelebration: controller.freezeCelebration,
    setScene: scene.setConditions,
    setInterfaceHidden: (hidden) => {
      root.classList.toggle(INTERFACE_HIDDEN_CLASS, hidden);
    },
  };
}
