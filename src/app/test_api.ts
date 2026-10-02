import type { GameState } from '../engine/types';
import type { BackgroundScene, SceneConditions } from '../scene/red_square_scene';
import type { AppController, AppSnapshot } from './app_controller';
import type { TestGamePatch } from './test_mode';

/** API que el modo test (`?test=1`) expone en `window.__bloques` para e2e y capturas. */
export interface BloquesTestApi {
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
}

declare global {
  interface Window {
    /** API del modo test; solo existe con `?test=1`. */
    __bloques?: BloquesTestApi;
  }
}

/**
 * Crea la API del modo test sobre el controlador y la escena de fondo.
 * @param controller Controlador de la aplicación.
 * @param scene Escena de fondo.
 * @returns La API.
 */
export function createTestApi(controller: AppController, scene: BackgroundScene): BloquesTestApi {
  return {
    getSnapshot: controller.getSnapshot,
    getGameState: controller.getGameState,
    patchGame: controller.patchGame,
    freezeCelebration: controller.freezeCelebration,
    setScene: scene.setConditions,
  };
}
