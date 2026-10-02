import type { RenderContext } from '../../render/render_context';
import { fillPixelRect } from '../pixel_shapes';
import type { PixelRect, RoofLine, SceneryPiece } from '../scenery';
import { STONE, drawTentRoof, drawWindowRow, fillBlock } from './architecture';

/** Colores del Museo Histórico y la puerta de la Resurrección. */
const COLORS = {
  brick: '#a33a2a',
  brickDark: '#73261b',
  roof: '#9fb0a6',
  roofLight: '#c9d3cc',
  gateTent: '#2f7a4a',
  gateTentLight: '#5fae74',
} as const;

/** Ladrillo del museo. */
const BRICK = { front: COLORS.brick, side: COLORS.brickDark } as const;

/** Fila de la base del museo (fondo de la plaza). */
const BASE_Y = 271;

/**
 * Torrecilla del museo con su tejado de tienda plateado.
 * @param ctx Contexto de dibujo.
 * @param cx Centro x.
 * @param top Fila superior del cuerpo.
 * @param halfWidth Semiancho del cuerpo.
 * @param roofHeight Altura del tejado.
 */
function drawTurret(
  ctx: RenderContext,
  cx: number,
  top: number,
  halfWidth: number,
  roofHeight: number,
): void {
  fillBlock(ctx, cx - halfWidth, top, halfWidth * 2, BASE_Y - top - 12, BRICK, 0.4);
  drawTentRoof(ctx, {
    cx,
    apexY: top - roofHeight,
    baseY: top,
    halfBase: halfWidth + 1,
    color: COLORS.roof,
    accent: COLORS.roofLight,
    pattern: 'plain',
  });
  fillPixelRect(ctx, cx, top - roofHeight - 2, 1, 2, STONE.gold);
}

/**
 * Museo Histórico al fondo de la plaza, con sus torrecillas, y la puerta de la
 * Resurrección a su izquierda.
 * @returns El elemento del decorado.
 */
export function createHistoricalMuseum(): SceneryPiece {
  const windows: PixelRect[] = [];
  const roofs: RoofLine[] = [
    { from: { x: 281, y: 254 }, to: { x: 317, y: 254 }, thickness: 1 },
    { from: { x: 265, y: 258 }, to: { x: 281, y: 258 }, thickness: 1 },
  ];
  return {
    windows,
    roofs,
    draw: (ctx) => {
      windows.length = 0;
      // Puerta de la Resurrección: dos torrecillas verdes sobre un arco.
      fillBlock(ctx, 266, 258, 15, BASE_Y - 258, BRICK);
      fillPixelRect(ctx, 271, 264, 5, BASE_Y - 264, STONE.shade);
      for (const cx of [268, 279]) {
        drawTentRoof(ctx, {
          cx,
          apexY: 246,
          baseY: 258,
          halfBase: 2,
          color: COLORS.gateTent,
          accent: COLORS.gateTentLight,
          pattern: 'plain',
        });
      }
      // Cuerpo del museo.
      fillBlock(ctx, 282, 254, 34, BASE_Y - 254, BRICK);
      fillPixelRect(ctx, 282, 254, 34, 1, STONE.white);
      drawWindowRow(ctx, windows, 284, 258, 8, 4, { width: 1, height: 3 }, null);
      drawWindowRow(ctx, windows, 284, 264, 8, 4, { width: 1, height: 3 }, null);
      for (const cx of [284, 299, 314]) {
        drawTurret(ctx, cx, 248, 1, 6);
      }
      drawTurret(ctx, 290, 238, 2, 12);
      drawTurret(ctx, 308, 238, 2, 12);
    },
  };
}
