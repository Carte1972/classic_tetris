import { describe, expect, it } from 'vitest';
import { PIECE_COLORS } from '../../../src/config/palette';
import { CELL_SIZE_PX } from '../../../src/config/render_config';
import { drawTitle, getTitleCanvasSize } from '../../../src/render/title_renderer';
import { createFakeContext } from './fake_context';

describe('title_renderer', () => {
  it('el título BLOQUES mide 7 letras de 5 columnas más 6 separaciones', () => {
    expect(getTitleCanvasSize()).toEqual({
      width: (7 * 5 + 6) * CELL_SIZE_PX,
      height: 5 * CELL_SIZE_PX,
    });
  });

  it('dibuja cada letra con el color de una pieza dentro del canvas', () => {
    const { ctx, calls } = createFakeContext();
    drawTitle(ctx);
    const size = getTitleCanvasSize();
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call.x + call.width).toBeLessThanOrEqual(size.width);
      expect(call.y + call.height).toBeLessThanOrEqual(size.height);
    }
    expect(calls.some((c) => c.fillStyle === PIECE_COLORS.T.fill)).toBe(true);
  });

  it('rechaza letras sin dibujo', () => {
    expect(() => getTitleCanvasSize('X')).toThrow();
  });
});
