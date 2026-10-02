import { describe, expect, it } from 'vitest';
import {
  along,
  drawBody,
  fillCapsule,
  OUTLINE_COLOR,
  rotateAround,
} from '../../../src/celebration/puppet/puppet_renderer';
import { createFakeContext } from '../render/fake_context';

/** Número de píxeles pintados. */
function area(calls: readonly { width: number; height: number }[]): number {
  return calls.reduce((sum, c) => sum + c.width * c.height, 0);
}

describe('puppet_renderer', () => {
  it('fillCapsule pinta un área parecida a la de la cápsula', () => {
    const { ctx, calls } = createFakeContext();
    fillCapsule(ctx, { x: 10, y: 10 }, { x: 10, y: 30 }, 3, '#ff0000');
    const expected = 20 * 6 + Math.PI * 9;
    expect(area(calls)).toBeGreaterThan(expected * 0.75);
    expect(area(calls)).toBeLessThan(expected * 1.25);
    const none = createFakeContext();
    fillCapsule(none.ctx, { x: 0, y: 0 }, { x: 5, y: 5 }, 0, '#fff');
    expect(none.calls).toHaveLength(0);
  });

  it('drawBody pinta primero el contorno de todas las formas y luego su relleno', () => {
    const { ctx, calls } = createFakeContext();
    let details = 0;
    drawBody(ctx, {
      shapes: [
        {
          kind: 'capsule',
          from: { x: 10, y: 10 },
          to: { x: 10, y: 20 },
          radius: 3,
          color: '#aa0000',
          shade: '#550000',
        },
        {
          kind: 'ellipse',
          center: { x: 30, y: 30 },
          rx: 4,
          ry: 4,
          color: '#00aa00',
          shade: '#005500',
        },
        {
          kind: 'polygon',
          points: [
            { x: 0, y: 0 },
            { x: 6, y: 0 },
            { x: 3, y: 6 },
          ],
          color: '#0000aa',
        },
      ],
      details: () => {
        details++;
      },
      props: () => {
        details++;
      },
    });
    const firstFill = calls.findIndex((c) => c.fillStyle !== OUTLINE_COLOR);
    expect(calls.slice(0, firstFill).every((c) => c.fillStyle === OUTLINE_COLOR)).toBe(true);
    expect(calls.slice(firstFill).some((c) => c.fillStyle === OUTLINE_COLOR)).toBe(false);
    expect(new Set(calls.map((c) => c.fillStyle))).toEqual(
      new Set([OUTLINE_COLOR, '#aa0000', '#550000', '#00aa00', '#005500', '#0000aa']),
    );
    expect(details).toBe(2);
  });

  it('rotateAround y along calculan posiciones relativas', () => {
    const p = rotateAround({ x: 10, y: 0 }, { x: 5, y: 5 }, Math.PI / 2);
    expect(p.x).toBeCloseTo(5);
    expect(p.y).toBeCloseTo(15);
    expect(rotateAround({ x: 4, y: 0 }, { x: 0, y: 0 }, 0, -1).x).toBe(-4);
    expect(along({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.25)).toEqual({ x: 2.5, y: 5 });
  });
});
