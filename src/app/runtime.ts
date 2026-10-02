import { createAudioEngine } from '../audio/audio_engine';
import { attachKeyboard } from '../input/keyboard_listener';
import { createKeyboardState } from '../input/keyboard_state';
import { createRedSquareScene, type LayerFactory } from '../scene/red_square_scene';
import { getBrowserStorage } from '../storage/key_value_storage';
import { createAppController, type AppController } from './app_controller';
import { createGameLoop } from './game_loop';
import {
  createRenderTargets,
  renderBackground,
  renderGame,
  type RenderTargets,
} from './game_renderer';
import { createRandomSeed } from './seed';
import { createTestApi } from './test_api';
import { parseTestOptions } from './test_mode';

/**
 * Crea capas en caché sobre canvas del navegador que no se muestran.
 * @param width Ancho en píxeles lógicos.
 * @param height Alto en píxeles lógicos.
 * @returns La capa.
 */
const createCanvasLayer: LayerFactory = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('El navegador no permite dibujar en canvas');
  }
  return { canvas, context };
};

/** Aplicación montada sobre el navegador. */
export interface AppRuntime {
  readonly controller: AppController;
  readonly targets: RenderTargets;
  /**
   * Conecta teclado, audio y bucle de juego.
   * @returns Función que lo desconecta todo.
   */
  readonly start: () => () => void;
}

/**
 * Compone la aplicación con las piezas reales del navegador: teclado de `window`,
 * Web Audio, `localStorage` y `requestAnimationFrame`. Lee el modo test de la URL.
 * @returns La aplicación, aún sin arrancar.
 */
export function createAppRuntime(): AppRuntime {
  const options = parseTestOptions(window.location.search);
  const keyboard = createKeyboardState();
  const audio = createAudioEngine();
  const targets = createRenderTargets();
  const controller = createAppController({
    keyboard,
    audio,
    storage: getBrowserStorage(),
    createSeed: () => options.seed ?? createRandomSeed(),
    now: () => new Date(),
  });
  const scene = createRedSquareScene(options.seed ?? createRandomSeed(), createCanvasLayer);

  return {
    controller,
    targets,
    start: () => {
      const detachKeyboard = attachKeyboard(window, keyboard);
      // El audio solo puede arrancar dentro de un gesto del usuario.
      const unlockAudio = (): void => audio.unlock();
      window.addEventListener('keydown', unlockAudio);
      const loop = createGameLoop({
        update: (dtMs) => {
          controller.update(dtMs);
          scene.advance(dtMs);
        },
        render: () => {
          renderBackground(targets, scene);
          renderGame(
            targets,
            controller.getSnapshot().screen,
            controller.getGameState(),
            controller.getCelebration(),
          );
        },
      });
      loop.start();
      if (options.testApi) {
        window.__tetris = createTestApi(controller, scene);
      }
      return () => {
        loop.stop();
        detachKeyboard();
        window.removeEventListener('keydown', unlockAudio);
        audio.stopMusic();
        delete window.__tetris;
      };
    },
  };
}
