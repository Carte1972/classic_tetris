import { describe, expect, it } from 'vitest';
import {
  GROUND_FAR_Y,
  GROUND_NEAR_Y,
  PIGEON_COUNT,
  PIGEON_RETURN_MS,
  SCENE_WIDTH,
  WALKER_COUNT,
} from '../../../src/config/scene_config';
import { advanceCrowd, createCrowd, depthScale, type CrowdState } from '../../../src/scene/crowd';
import { drawCrowd } from '../../../src/scene/crowd_renderer';
import { createFakeContext } from '../render/fake_context';

describe('crowd', () => {
  it('crea los paseantes y las palomas dentro de la plaza', () => {
    const crowd = createCrowd(5);
    expect(crowd.walkers).toHaveLength(WALKER_COUNT);
    expect(crowd.pigeons).toHaveLength(PIGEON_COUNT);
    for (const walker of crowd.walkers) {
      expect(walker.y).toBeGreaterThanOrEqual(GROUND_FAR_Y);
      expect(walker.y).toBeLessThanOrEqual(GROUND_NEAR_Y);
    }
    expect(crowd.pigeons.every((p) => !p.flying)).toBe(true);
  });

  it('la escala de perspectiva crece hacia el espectador', () => {
    expect(depthScale(GROUND_FAR_Y)).toBeCloseTo(0.35);
    expect(depthScale(GROUND_NEAR_Y)).toBe(1);
    expect(depthScale(0)).toBeCloseTo(0.35);
  });

  it('los paseantes avanzan en su sentido y los que salen se sustituyen', () => {
    const crowd = createCrowd(5);
    const moved = advanceCrowd(crowd, 1000);
    moved.walkers.forEach((walker, i) => {
      const before = crowd.walkers[i];
      if (before !== undefined && walker.distance > 0) {
        expect(Math.sign(walker.x - before.x)).toBe(before.direction);
      }
    });
    let state: CrowdState = crowd;
    for (let i = 0; i < 120; i++) {
      state = advanceCrowd(state, 1000);
    }
    expect(state.walkers).toHaveLength(WALKER_COUNT);
    expect(state.walkers.every((w) => w.x > -40 && w.x < SCENE_WIDTH + 40)).toBe(true);
  });

  it('una paloma echa a volar si pasa alguien cerca y vuelve a posarse más tarde', () => {
    const crowd = createCrowd(5);
    const pigeon = crowd.pigeons[0];
    const walker = crowd.walkers[0];
    if (pigeon === undefined || walker === undefined) {
      throw new Error('Faltan elementos');
    }
    const near: CrowdState = {
      ...crowd,
      walkers: [{ ...walker, x: pigeon.x, y: pigeon.y, speed: 0 }],
      pigeons: [pigeon],
    };
    const scared = advanceCrowd(near, 16);
    expect(scared.pigeons[0]?.flying).toBe(true);
    const flown = advanceCrowd({ ...scared, walkers: [] }, 1000);
    expect(flown.pigeons[0]?.y).toBeLessThan(pigeon.y);
    const back = advanceCrowd({ ...flown, walkers: [] }, PIGEON_RETURN_MS);
    expect(back.pigeons[0]?.flying).toBe(false);
  });

  it('dibuja a la gente con y sin paraguas, de día y de noche', () => {
    const crowd = advanceCrowd(createCrowd(9), 500);
    const day = createFakeContext();
    drawCrowd(day.ctx, crowd, 1000, { daylight: 1, nightColor: '#000000', umbrellas: false });
    const rain = createFakeContext();
    drawCrowd(rain.ctx, crowd, 1000, { daylight: 0, nightColor: '#000000', umbrellas: true });
    expect(day.calls.length).toBeGreaterThan(WALKER_COUNT * 4);
    expect(rain.calls.length).toBeGreaterThan(day.calls.length);
  });
});
