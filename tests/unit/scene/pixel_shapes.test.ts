import { describe, expect, it } from 'vitest';
import {
  drawLine,
  fillCircle,
  fillEllipse,
  fillPixelRect,
  fillPolygon,
  mixColors,
  withAlpha,
} from '../../../src/scene/pixel_shapes';
import { createFakeContext } from '../render/fake_context';

/** Píxeles cubiertos por los rectángulos dibujados. */
function coveredPixels(calls: readonly { x: number; y: number; width: number; height: number }[]) {
  const set = new Set<string>();
  for (const c of calls) {
    for (let y = c.y; y < c.y + c.height; y++) {
      for (let x = c.x; x < c.x + c.width; x++) {
        set.add(`${x},${y}`);
      }
    }
  }
  return set;
}

describe('pixel_shapes', () => {
  it('fillEllipse pinta una fila por cada píxel de alto y es simétrica', () => {
    const { ctx, calls } = createFakeContext();
    fillEllipse(ctx, 10, 10, 6, 3, '#ff0000');
    expect(calls).toHaveLength(7);
    for (const c of calls) {
      expect(c.x + c.width - 1 - 10).toBe(10 - c.x);
      expect(c.fillStyle).toBe('#ff0000');
    }
  });

  it('un círculo con radio no positivo no dibuja nada', () => {
    const { ctx, calls } = createFakeContext();
    fillCircle(ctx, 0, 0, 0, '#fff');
    expect(calls).toHaveLength(0);
  });

  it('fillPolygon rellena un rectángulo exactamente', () => {
    const { ctx, calls } = createFakeContext();
    fillPolygon(
      ctx,
      [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 3 },
        { x: 0, y: 3 },
      ],
      '#00ff00',
    );
    expect(coveredPixels(calls).size).toBe(12);
  });

  it('fillPolygon ignora polígonos degenerados', () => {
    const { ctx, calls } = createFakeContext();
    fillPolygon(
      ctx,
      [
        { x: 0, y: 0 },
        { x: 3, y: 3 },
      ],
      '#000',
    );
    expect(calls).toHaveLength(0);
  });

  it('drawLine une los extremos con el grosor indicado', () => {
    const { ctx, calls } = createFakeContext();
    drawLine(ctx, { x: 0, y: 0 }, { x: 5, y: 2 }, 1, '#000');
    const pixels = coveredPixels(calls);
    expect(pixels.has('0,0')).toBe(true);
    expect(pixels.has('5,2')).toBe(true);
    const thick = createFakeContext();
    drawLine(thick.ctx, { x: 0, y: 0 }, { x: 0, y: 0 }, 3, '#000');
    expect(thick.calls[0]).toMatchObject({ width: 3, height: 3 });
  });

  it('fillPixelRect redondea las coordenadas', () => {
    const { ctx, calls } = createFakeContext();
    fillPixelRect(ctx, 1.4, 2.6, 3.2, 1.5, '#123456');
    expect(calls[0]).toMatchObject({ x: 1, y: 3, width: 3, height: 2 });
  });

  it('mixColors mezcla canales y withAlpha añade transparencia', () => {
    expect(mixColors('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixColors('#102030', '#102030', 0.3)).toBe('#102030');
    expect(mixColors('#000000', '#ffffff', 2)).toBe('#ffffff');
    expect(withAlpha('#ff8000', 0.25)).toBe('rgba(255, 128, 0, 0.25)');
    expect(withAlpha('#ff8000', 3)).toBe('rgba(255, 128, 0, 1)');
  });
});
