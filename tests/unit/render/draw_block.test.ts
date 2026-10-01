import { describe, expect, it } from 'vitest';
import { PIECE_COLORS } from '../../../src/config/palette';
import { BLOCK_GAP_PX, CELL_SIZE_PX } from '../../../src/config/render_config';
import { drawBlock } from '../../../src/render/draw_block';
import { createFakeContext } from './fake_context';

describe('drawBlock', () => {
  it('dibuja relleno, biseles y brillo dentro de la celda dejando la separación', () => {
    const { ctx, calls } = createFakeContext();
    const colors = PIECE_COLORS.T;
    drawBlock(ctx, 16, 24, colors);
    expect(calls[0]).toEqual({
      fillStyle: colors.fill,
      x: 16,
      y: 24,
      width: CELL_SIZE_PX - BLOCK_GAP_PX,
      height: CELL_SIZE_PX - BLOCK_GAP_PX,
    });
    expect(calls.map((c) => c.fillStyle)).toEqual([
      colors.fill,
      colors.highlight,
      colors.highlight,
      colors.shadow,
      colors.shadow,
      colors.shine,
    ]);
    for (const call of calls) {
      expect(call.x + call.width).toBeLessThanOrEqual(16 + CELL_SIZE_PX - BLOCK_GAP_PX);
      expect(call.y + call.height).toBeLessThanOrEqual(24 + CELL_SIZE_PX - BLOCK_GAP_PX);
    }
  });
});
