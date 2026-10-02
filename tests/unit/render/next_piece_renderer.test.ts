import { describe, expect, it } from 'vitest';
import { PIECE_COLORS, PREVIEW_BACKGROUND_COLOR } from '../../../src/config/palette';
import { PIECE_TYPES } from '../../../src/config/tetromino_config';
import { drawNextPiece } from '../../../src/render/next_piece_renderer';
import { createFakeContext } from './fake_context';

describe('drawNextPiece', () => {
  it.each(PIECE_TYPES)('dibuja el fondo y los 4 bloques de %s con su color', (type) => {
    const { ctx, calls } = createFakeContext();
    drawNextPiece(ctx, type);
    expect(calls[0]?.fillStyle).toBe(PREVIEW_BACKGROUND_COLOR);
    expect(calls.filter((c) => c.fillStyle === PIECE_COLORS[type].fill)).toHaveLength(4);
  });

  it('sin pieza solo dibuja el fondo', () => {
    const { ctx, calls } = createFakeContext();
    drawNextPiece(ctx, null);
    expect(calls).toHaveLength(1);
  });
});
