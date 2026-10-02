import { describe, expect, it } from 'vitest';
import {
  GROUND_FAR_Y,
  GROUND_NEAR_Y,
  PIGEON_COUNT,
  PIGEON_RETURN_MS,
  LAWN_EDGE,
  SCENE_WIDTH,
  VANISHING_POINT,
  WALKER_COUNT,
} from '../../../src/config/scene_config';
import {
  advanceCrowd,
  createCrowd,
  depthScale,
  walkableLeft,
  type CrowdState,
} from '../../../src/scene/crowd';
import { crowdActors, type CrowdLighting } from '../../../src/scene/crowd_renderer';
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

  it('la escala de perspectiva es proporcional a la distancia al punto de fuga', () => {
    const middle = (VANISHING_POINT.y + GROUND_NEAR_Y) / 2;
    expect(depthScale(middle)).toBeCloseTo(0.5);
    expect(depthScale(GROUND_NEAR_Y)).toBe(1);
    expect(depthScale(GROUND_FAR_Y)).toBeLessThan(0.2);
    expect(depthScale(0)).toBeCloseTo(0.1);
  });

  it('nadie camina por el césped ni por la muralla', () => {
    expect(walkableLeft(LAWN_EDGE.from.y + 10)).toBeLessThan(0);
    expect(walkableLeft(LAWN_EDGE.from.y)).toBeLessThanOrEqual(LAWN_EDGE.from.x);
    expect(walkableLeft(LAWN_EDGE.to.y)).toBeCloseTo(LAWN_EDGE.to.x);
    let state: CrowdState = createCrowd(3);
    for (let i = 0; i < 90; i++) {
      state = advanceCrowd(state, 1000);
      for (const walker of state.walkers) {
        expect(walker.x).toBeGreaterThanOrEqual(walkableLeft(walker.y) - 1);
      }
    }
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
    /** Dibuja todos los actores con una luz. */
    const draw = (lighting: CrowdLighting) => {
      const fake = createFakeContext();
      crowdActors(crowd, 1000, lighting).forEach((actor) => actor.draw(fake.ctx));
      return fake.calls;
    };
    const day = draw({ daylight: 1, nightColor: '#000000', umbrellas: false });
    const rain = draw({ daylight: 0, nightColor: '#000000', umbrellas: true });
    expect(day.length).toBeGreaterThan(WALKER_COUNT * 4);
    expect(rain.length).toBeGreaterThan(day.length);
  });

  it('las palomas que vuelan se dibujan por delante de todo', () => {
    const crowd = createCrowd(9);
    const pigeon = crowd.pigeons[0];
    if (pigeon === undefined) {
      throw new Error('Falta la paloma');
    }
    const flying = { ...crowd, pigeons: [{ ...pigeon, flying: true }] };
    const lighting = { daylight: 1, nightColor: '#000000', umbrellas: false };
    const actors = crowdActors(flying, 0, lighting);
    expect(actors.at(-1)?.y).toBe(Number.POSITIVE_INFINITY);
  });
});
