import type { RenderContext } from '../../render/render_context';
import { fillPixelRect, fillPolygon } from '../pixel_shapes';
import type { PixelRect, SceneryPiece } from '../scenery';

/** Colores del Museo Histórico. */
const COLORS = {
  outline: '#2e1210',
  brick: '#9a3426',
  brickDark: '#6e2219',
  stone: '#eee6d6',
  roof: '#d9d4c8',
  roofShade: '#a9a294',
  window: '#251820',
  gold: '#e8b947',
} as const;

/** Torres de tienda del museo: centro x, ancho, base y punta. */
const TOWERS = [
  { cx: 6, width: 8, baseY: 58, apexY: 28 },
  { cx: 21, width: 10, baseY: 52, apexY: 16 },
  { cx: 34, width: 7, baseY: 60, apexY: 34 },
] as const;

/**
 * Museo Histórico: edificio de ladrillo rojo oscuro con remates blancos y torres de
 * tienda plateadas, a la izquierda del todo.
 * @returns El elemento del decorado.
 */
export function createHistoricalMuseum(): SceneryPiece {
  const windows: PixelRect[] = [];
  const draw = (ctx: RenderContext): void => {
    windows.length = 0;
    fillPixelRect(ctx, 0, 58, 41, 82, COLORS.outline);
    fillPixelRect(ctx, 0, 59, 40, 81, COLORS.brick);
    fillPixelRect(ctx, 28, 59, 12, 81, COLORS.brickDark);
    for (const y of [59, 84, 108]) {
      fillPixelRect(ctx, 0, y, 40, 2, COLORS.stone);
    }
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const rect = { x: 3 + col * 7, y: 65 + row * 24, width: 3, height: 9 };
        fillPixelRect(ctx, rect.x - 1, rect.y - 2, rect.width + 2, 2, COLORS.stone);
        fillPixelRect(ctx, rect.x, rect.y, rect.width, rect.height, COLORS.window);
        windows.push(rect);
      }
    }
    for (const tower of TOWERS) {
      const left = tower.cx - tower.width / 2;
      fillPixelRect(ctx, left - 1, tower.baseY - 4, tower.width + 2, 6, COLORS.outline);
      fillPixelRect(ctx, left, tower.baseY - 3, tower.width, 5, COLORS.brick);
      fillPolygon(
        ctx,
        [
          { x: left - 1, y: tower.baseY - 3 },
          { x: tower.cx, y: tower.apexY },
          { x: left + tower.width + 1, y: tower.baseY - 3 },
        ],
        COLORS.outline,
      );
      fillPolygon(
        ctx,
        [
          { x: left, y: tower.baseY - 4 },
          { x: tower.cx, y: tower.apexY + 1 },
          { x: left + tower.width, y: tower.baseY - 4 },
        ],
        COLORS.roof,
      );
      fillPolygon(
        ctx,
        [
          { x: tower.cx, y: tower.baseY - 4 },
          { x: tower.cx, y: tower.apexY + 1 },
          { x: left + tower.width, y: tower.baseY - 4 },
        ],
        COLORS.roofShade,
      );
      fillPixelRect(ctx, tower.cx, tower.apexY - 3, 1, 3, COLORS.gold);
    }
  };
  return {
    windows,
    roofs: [{ from: { x: 0, y: 57 }, to: { x: 40, y: 57 }, thickness: 2 }],
    draw,
  };
}
