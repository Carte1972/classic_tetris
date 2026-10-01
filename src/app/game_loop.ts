import { MAX_FRAME_DELTA_MS } from '../config/timing_config';

/** Planificador de fotogramas (en el navegador, `requestAnimationFrame`). */
export interface FrameScheduler {
  /** Programa una llamada para el próximo fotograma y devuelve su identificador. */
  readonly request: (callback: (timeMs: number) => void) => number;
  /** Cancela una llamada programada. */
  readonly cancel: (id: number) => void;
}

/** Funciones que el bucle llama en cada fotograma de pantalla. */
export interface GameLoopCallbacks {
  /** Avanza la lógica el tiempo transcurrido (ms). */
  readonly update: (dtMs: number) => void;
  /** Dibuja el estado actual. */
  readonly render: () => void;
}

/** Bucle de juego que se puede arrancar y detener. */
export interface GameLoop {
  /** Arranca el bucle (no hace nada si ya está en marcha). */
  readonly start: () => void;
  /** Detiene el bucle. */
  readonly stop: () => void;
  /** Indica si el bucle está en marcha. */
  readonly isRunning: () => boolean;
}

/** Planificador del navegador basado en `requestAnimationFrame`. */
const browserScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
};

/**
 * Crea un bucle de juego sobre `requestAnimationFrame`. El tiempo real se pasa a
 * `update`, que aplica el timestep fijo; los saltos grandes (pestaña en segundo
 * plano) se limitan para no simular de golpe demasiados frames.
 * @param callbacks Funciones de actualización y dibujado.
 * @param scheduler Planificador de fotogramas (inyectable para tests).
 * @returns El bucle, detenido.
 */
export function createGameLoop(
  callbacks: GameLoopCallbacks,
  scheduler: FrameScheduler = browserScheduler,
): GameLoop {
  let frameId: number | null = null;
  let lastTimeMs: number | null = null;

  const onFrame = (timeMs: number): void => {
    const dtMs = lastTimeMs === null ? 0 : Math.min(timeMs - lastTimeMs, MAX_FRAME_DELTA_MS);
    lastTimeMs = timeMs;
    callbacks.update(Math.max(dtMs, 0));
    callbacks.render();
    frameId = scheduler.request(onFrame);
  };

  return {
    start: () => {
      if (frameId === null) {
        lastTimeMs = null;
        frameId = scheduler.request(onFrame);
      }
    },
    stop: () => {
      if (frameId !== null) {
        scheduler.cancel(frameId);
        frameId = null;
      }
    },
    isRunning: () => frameId !== null,
  };
}
