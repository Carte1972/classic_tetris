import { describe, expect, it } from 'vitest';
import {
  DANCE_DURATION_MS,
  DANCE_SEGMENTS,
  ease,
  getDanceFrame,
  STANDING,
  TRAVEL_DISTANCE,
} from '../../../src/celebration/puppet/choreography';
import type { Pose } from '../../../src/celebration/puppet/skeleton';

/** Instante (ms) en el que empieza un movimiento. */
function startOf(move: string): number {
  let start = 0;
  for (const segment of DANCE_SEGMENTS) {
    if (segment.move === move) {
      return start;
    }
    start += segment.durationMs;
  }
  throw new Error(move);
}

/** Diferencia máxima entre los ángulos de dos posturas. */
function poseDistance(a: Pose, b: Pose): number {
  return Math.max(
    Math.abs(a.armLeft.upper - b.armLeft.upper),
    Math.abs(a.armRight.upper - b.armRight.upper),
    Math.abs(a.legLeft.thigh - b.legLeft.thigh),
    Math.abs(a.legRight.thigh - b.legRight.thigh),
    Math.abs(a.legLeft.shin - b.legLeft.shin),
    Math.abs(a.legRight.shin - b.legRight.shin),
  );
}

describe('coreografía de 10 segundos', () => {
  it('sigue el orden: entrada, prisiadka, giro, salto, patadas, reverencia y salida', () => {
    expect(DANCE_SEGMENTS.map((s) => s.move)).toEqual([
      'enter',
      'prisiadka',
      'spin',
      'jump',
      'kicks',
      'bow',
      'exit',
    ]);
    expect(DANCE_DURATION_MS).toBe(10_000);
  });

  it('entra desde la izquierda y sale por la derecha', () => {
    expect(getDanceFrame(0).pose.x).toBeCloseTo(-TRAVEL_DISTANCE);
    expect(getDanceFrame(startOf('prisiadka') + 500).pose.x).toBe(0);
    expect(getDanceFrame(DANCE_DURATION_MS).pose.x).toBeCloseTo(TRAVEL_DISTANCE);
  });

  it('la prisiadka alterna patadas con una pierna y otra, agachado y con los brazos cruzados', () => {
    const start = startOf('prisiadka');
    const right = getDanceFrame(start + 215).pose;
    const left = getDanceFrame(start + 645).pose;
    expect(right.legRight.shin).toBeGreaterThan(right.legLeft.shin + 1);
    expect(left.legLeft.shin).toBeGreaterThan(left.legRight.shin + 1);
    expect(right.armLeft.fore).toBeLessThan(-2);
  });

  it('el salto se eleva con las piernas abiertas', () => {
    const start = startOf('jump');
    const peak = getDanceFrame(start + 1100 * 0.52).pose;
    expect(peak.lift).toBeGreaterThan(35);
    expect(peak.legLeft.thigh).toBeGreaterThan(1.3);
    expect(peak.legRight.thigh).toBeGreaterThan(1.3);
  });

  it('el giro da una vuelta completa', () => {
    const start = startOf('spin');
    expect(getDanceFrame(start + 500).pose.spin).toBeCloseTo(0.5, 1);
    expect(getDanceFrame(start + 999).pose.spin).toBeGreaterThan(0.95);
  });

  it('la reverencia inclina el cuerpo', () => {
    expect(getDanceFrame(startOf('bow') + 450).pose.lean).toBeGreaterThan(0.4);
  });

  it('no hay saltos bruscos entre movimientos (fundido)', () => {
    for (const segment of DANCE_SEGMENTS.slice(1)) {
      const boundary = startOf(segment.move);
      const before = getDanceFrame(boundary - 1).pose;
      const after = getDanceFrame(boundary + 1).pose;
      expect(poseDistance(before, after)).toBeLessThan(0.35);
    }
  });

  it('ease suaviza en los extremos', () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBe(0.5);
    expect(ease(2)).toBe(1);
    expect(STANDING.spin).toBe(0);
  });

  it('rechaza una coreografía vacía', () => {
    expect(() => getDanceFrame(0, [])).toThrow();
  });
});
