import { GRAVITY_FRAMES_BY_LEVEL } from '../config/gravity_config';

/**
 * Frames que tarda una pieza en bajar una fila por gravedad en un nivel.
 * @param level Nivel actual (0 o más).
 * @returns Frames por fila según la tabla de NES.
 */
export function getGravityFrames(level: number): number {
  const lastIndex = GRAVITY_FRAMES_BY_LEVEL.length - 1;
  const frames = GRAVITY_FRAMES_BY_LEVEL[Math.min(Math.max(level, 0), lastIndex)];
  if (frames === undefined) {
    throw new RangeError('La tabla de gravedad está vacía');
  }
  return frames;
}
