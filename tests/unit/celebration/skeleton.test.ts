import { describe, expect, it } from 'vitest';
import { STANDING } from '../../../src/celebration/puppet/choreography';
import { blendPoses, solveSkeleton } from '../../../src/celebration/puppet/skeleton';
import { COSSACK } from '../../../src/celebration/dancers/cossack';

const GROUND = 150;
const body = COSSACK.body;

describe('solveSkeleton', () => {
  it('de pie, los pies tocan el suelo y la cabeza queda arriba', () => {
    const s = solveSkeleton(STANDING, body, 100, GROUND);
    expect(Math.max(s.legLeft.end.y, s.legRight.end.y)).toBeCloseTo(GROUND);
    expect(s.head.y).toBeLessThan(s.chest.y);
    expect(s.chest.y).toBeLessThan(s.pelvis.y);
    expect(s.pelvis.x).toBe(100);
  });

  it('respeta las longitudes de los miembros', () => {
    const s = solveSkeleton(STANDING, body, 100, GROUND);
    const thigh = Math.hypot(
      s.legLeft.middle.x - s.legLeft.root.x,
      s.legLeft.middle.y - s.legLeft.root.y,
    );
    expect(thigh).toBeCloseTo(body.thigh);
  });

  it('al saltar se eleva la cantidad indicada', () => {
    const ground = solveSkeleton(STANDING, body, 100, GROUND);
    const air = solveSkeleton({ ...STANDING, lift: 20 }, body, 100, GROUND);
    expect(ground.pelvis.y - air.pelvis.y).toBeCloseTo(20);
  });

  it('agachado, la cadera baja y los pies siguen en el suelo', () => {
    const squat = solveSkeleton(
      {
        ...STANDING,
        legLeft: { thigh: 1.45, shin: -2.65 },
        legRight: { thigh: 1.45, shin: -2.65 },
      },
      body,
      100,
      GROUND,
    );
    expect(squat.pelvis.y).toBeGreaterThan(solveSkeleton(STANDING, body, 100, GROUND).pelvis.y + 8);
    expect(Math.max(squat.legLeft.end.y, squat.legRight.end.y)).toBeLessThanOrEqual(GROUND + 0.01);
  });

  it('al girar se estrecha sin quedarse en una línea y se refleja de espaldas', () => {
    expect(solveSkeleton(STANDING, body, 0, GROUND).spinScale).toBe(1);
    expect(solveSkeleton({ ...STANDING, spin: 0.25 }, body, 0, GROUND).spinScale).toBeGreaterThan(
      0.3,
    );
    expect(solveSkeleton({ ...STANDING, spin: 0.5 }, body, 0, GROUND).spinScale).toBe(-1);
  });

  it('inclinarse desplaza el pecho hacia ese lado', () => {
    const s = solveSkeleton({ ...STANDING, lean: 0.5 }, body, 100, GROUND);
    expect(s.chest.x).toBeGreaterThan(s.pelvis.x + 5);
  });
});

describe('blendPoses', () => {
  it('interpola entre dos posturas', () => {
    const mid = blendPoses(STANDING, { ...STANDING, lift: 10, spin: 1 }, 0.5);
    expect(mid.lift).toBe(5);
    expect(mid.spin).toBe(0.5);
  });
});
