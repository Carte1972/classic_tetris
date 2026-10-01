import { describe, expect, it } from 'vitest';
import { getChoreographyPose } from '../../../src/celebration/choreography';
import {
  CELEBRATION_DURATION_MS,
  CHOREOGRAPHY,
  FRAMES_PER_MOVEMENT,
} from '../../../src/config/celebration_config';

describe('getChoreographyPose', () => {
  it('sigue el orden: entrada, prisiadka, salto y salida', () => {
    expect(getChoreographyPose(0).movement).toBe('enter');
    expect(getChoreographyPose(1200).movement).toBe('prisiadka');
    expect(getChoreographyPose(2900).movement).toBe('jump');
    expect(getChoreographyPose(3500).movement).toBe('exit');
  });

  it('cada movimiento recorre al menos 6 fotogramas distintos', () => {
    expect(FRAMES_PER_MOVEMENT).toBeGreaterThanOrEqual(6);
    let start = 0;
    for (const step of CHOREOGRAPHY) {
      const frames = new Set<number>();
      for (let t = start; t < start + step.durationMs; t += 5) {
        frames.add(getChoreographyPose(t).frame);
      }
      expect(frames.size).toBe(FRAMES_PER_MOVEMENT);
      start += step.durationMs;
    }
  });

  it('la prisiadka repite el ciclo de patadas dos veces', () => {
    const prisiadka = CHOREOGRAPHY.find((step) => step.movement === 'prisiadka');
    expect(prisiadka?.cycles).toBe(2);
    const start = CHOREOGRAPHY[0]?.durationMs ?? 0;
    const firstCycle = getChoreographyPose(start + 10).frame;
    const secondCycle = getChoreographyPose(start + (prisiadka?.durationMs ?? 0) / 2 + 10).frame;
    expect(secondCycle).toBe(firstCycle);
  });

  it('informa del progreso dentro del tramo', () => {
    expect(getChoreographyPose(500).movementProgress).toBeCloseTo(0.5);
  });

  it('al terminar se queda en el último fotograma de la salida', () => {
    expect(getChoreographyPose(CELEBRATION_DURATION_MS)).toEqual({
      movement: 'exit',
      frame: FRAMES_PER_MOVEMENT - 1,
      movementProgress: 1,
    });
  });

  it('rechaza una coreografía vacía', () => {
    expect(() => getChoreographyPose(0, [])).toThrow();
  });
});
