import {
  CHOREOGRAPHY,
  FRAMES_PER_MOVEMENT,
  type ChoreographyStep,
  type DanceMovement,
} from '../config/celebration_config';

/** Punto de la coreografía en un instante. */
export interface ChoreographyPose {
  readonly movement: DanceMovement;
  /** Fotograma del movimiento (0–5). */
  readonly frame: number;
  /** Progreso dentro del tramo actual, de 0 a 1. */
  readonly movementProgress: number;
}

/**
 * Movimiento y fotograma que corresponden a un instante de la coreografía. Pasado el
 * final, se queda en el último fotograma.
 * @param elapsedMs Tiempo desde el inicio de la celebración.
 * @param steps Tramos de la coreografía.
 * @returns La pose en ese instante.
 */
export function getChoreographyPose(
  elapsedMs: number,
  steps: readonly ChoreographyStep[] = CHOREOGRAPHY,
): ChoreographyPose {
  let start = 0;
  for (const step of steps) {
    if (elapsedMs < start + step.durationMs) {
      const progress = Math.max(0, (elapsedMs - start) / step.durationMs);
      const frame = Math.floor(progress * step.cycles * FRAMES_PER_MOVEMENT) % FRAMES_PER_MOVEMENT;
      return { movement: step.movement, frame, movementProgress: progress };
    }
    start += step.durationMs;
  }
  const last = steps[steps.length - 1];
  if (last === undefined) {
    throw new Error('La coreografía está vacía');
  }
  return { movement: last.movement, frame: FRAMES_PER_MOVEMENT - 1, movementProgress: 1 };
}
