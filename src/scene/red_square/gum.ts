import type { RenderContext } from '../../render/render_context';
import { fillPixelRect, fillPolygon, type Point } from '../pixel_shapes';
import type { PixelRect, RoofLine, SceneryPiece } from '../scenery';
import { STONE, drawTentRoof } from './architecture';

/** Colores de los almacenes GUM. */
const COLORS = {
  facade: '#e6d8b8',
  facadeShade: '#c7b691',
  trim: '#f6efdc',
  roof: '#6f8f7a',
  roofLight: '#9fbfa8',
  outline: '#4a3a2c',
} as const;

/** Extremo izquierdo (lejano) de la fachada: columna, fila de la cornisa y de la base. */
const FAR = { x: 316, top: 256, base: 271 } as const;

/** Extremo derecho (cercano) de la fachada. */
const NEAR = { x: 434, top: 234, base: 280 } as const;

/**
 * Interpola la fachada en perspectiva en una fracción de su longitud.
 * @param t Fracción (0 en el extremo lejano, 1 en el cercano).
 * @returns Columna, cornisa y base en ese punto.
 */
function facadeAt(t: number): { x: number; top: number; base: number } {
  return {
    x: FAR.x + (NEAR.x - FAR.x) * t,
    top: FAR.top + (NEAR.top - FAR.top) * t,
    base: FAR.base + (NEAR.base - FAR.base) * t,
  };
}

/**
 * Almacenes GUM: larga fachada clara en perspectiva a la derecha del fondo, con arcos,
 * tejados verdes y torrecillas, en parte detrás de San Basilio.
 * @returns El elemento del decorado.
 */
export function createGum(): SceneryPiece {
  const windows: PixelRect[] = [];
  const roofs: RoofLine[] = [
    { from: { x: FAR.x, y: FAR.top - 1 }, to: { x: NEAR.x, y: NEAR.top - 1 }, thickness: 2 },
  ];
  const draw = (ctx: RenderContext): void => {
    windows.length = 0;
    const outline: Point[] = [
      { x: FAR.x - 1, y: FAR.top - 1 },
      { x: NEAR.x + 1, y: NEAR.top - 1 },
      { x: NEAR.x + 1, y: NEAR.base },
      { x: FAR.x - 1, y: FAR.base },
    ];
    fillPolygon(ctx, outline, COLORS.outline);
    fillPolygon(
      ctx,
      [
        { x: FAR.x, y: FAR.top },
        { x: NEAR.x, y: NEAR.top },
        { x: NEAR.x, y: NEAR.base },
        { x: FAR.x, y: FAR.base },
      ],
      COLORS.facade,
    );
    // Columnas de arcos: más juntas cuanto más lejos.
    let t = 0;
    while (t < 1) {
      const { x, top, base } = facadeAt(t);
      const height = base - top;
      const span = Math.max(2, Math.round(height * 0.22));
      fillPixelRect(ctx, x, top, 1, height, COLORS.facadeShade);
      for (const row of [0.3, 0.62]) {
        const rect = {
          x: Math.round(x + span * 0.3),
          y: Math.round(top + height * row),
          width: Math.max(1, Math.round(span * 0.45)),
          height: Math.max(2, Math.round(height * 0.18)),
        };
        fillPixelRect(ctx, rect.x, rect.y, rect.width, rect.height, STONE.window);
        windows.push(rect);
      }
      t += span / (NEAR.x - FAR.x);
    }
    fillPolygon(
      ctx,
      [
        { x: FAR.x, y: FAR.top },
        { x: NEAR.x, y: NEAR.top },
        { x: NEAR.x, y: NEAR.top + 2 },
        { x: FAR.x, y: FAR.top + 1 },
      ],
      COLORS.trim,
    );
    // Tejados verdes con torrecillas.
    for (const [position, half, height] of [
      [0.25, 3, 8],
      [0.55, 5, 14],
      [0.85, 4, 11],
    ] as const) {
      const { x, top } = facadeAt(position);
      drawTentRoof(ctx, {
        cx: Math.round(x),
        apexY: Math.round(top - height),
        baseY: Math.round(top),
        halfBase: half,
        color: COLORS.roof,
        accent: COLORS.roofLight,
        pattern: 'stripes',
      });
    }
  };
  return { windows, roofs, draw };
}
