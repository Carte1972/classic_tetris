import { FRAME_DURATION_MS } from '../config/timing_config';

/** Reparto del tiempo transcurrido en frames lógicos completos. */
export interface FrameBudget {
  /** Frames completos que hay que simular. */
  readonly frames: number;
  /** Milisegundos sobrantes que se acumulan para el siguiente fotograma. */
  readonly remainderMs: number;
}

/**
 * Reparte el tiempo real en frames de duración fija (timestep fijo).
 * @param accumulatedMs Tiempo sobrante del fotograma anterior.
 * @param dtMs Tiempo transcurrido desde el fotograma anterior.
 * @returns Frames a simular y tiempo sobrante.
 */
export function consumeFrames(accumulatedMs: number, dtMs: number): FrameBudget {
  const totalMs = accumulatedMs + dtMs;
  const frames = Math.floor(totalMs / FRAME_DURATION_MS);
  return { frames, remainderMs: totalMs - frames * FRAME_DURATION_MS };
}
