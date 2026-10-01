import { describe, expect, it } from 'vitest';
import { PIECE_TYPES } from '../../../src/config/tetromino_config';
import { CELL_SIZE_PX } from '../../../src/config/render_config';
import {
  boardCellToPixel,
  getBoardCanvasSize,
  getPreviewBlockPositions,
  getPreviewCanvasSize,
} from '../../../src/render/layout';

describe('layout', () => {
  it('el pozo mide 10 × 20 celdas', () => {
    expect(getBoardCanvasSize()).toEqual({ width: 10 * CELL_SIZE_PX, height: 20 * CELL_SIZE_PX });
  });

  it('las filas ocultas no tienen posición en el canvas', () => {
    expect(boardCellToPixel(0, 0)).toBeNull();
    expect(boardCellToPixel(0, 1)).toBeNull();
    expect(boardCellToPixel(0, 2)).toEqual({ x: 0, y: 0 });
    expect(boardCellToPixel(9, 21)).toEqual({ x: 9 * CELL_SIZE_PX, y: 19 * CELL_SIZE_PX });
  });

  it.each(PIECE_TYPES)('la pieza %s cabe centrada en la vista previa', (type) => {
    const size = getPreviewCanvasSize();
    const positions = getPreviewBlockPositions(type);
    expect(positions).toHaveLength(4);
    const left = Math.min(...positions.map((p) => p.x));
    const right = Math.max(...positions.map((p) => p.x)) + CELL_SIZE_PX;
    const top = Math.min(...positions.map((p) => p.y));
    const bottom = Math.max(...positions.map((p) => p.y)) + CELL_SIZE_PX;
    expect(left).toBeGreaterThanOrEqual(0);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(right).toBeLessThanOrEqual(size.width);
    expect(bottom).toBeLessThanOrEqual(size.height);
    expect(Math.abs(left - (size.width - right))).toBeLessThanOrEqual(1);
    expect(Math.abs(top - (size.height - bottom))).toBeLessThanOrEqual(1);
  });
});
