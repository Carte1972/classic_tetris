import type { RenderContext } from '../../render/render_context';
import { fillPixelRect, fillPolygon, mixColors } from '../pixel_shapes';
import type { PixelRect, SceneryPiece } from '../scenery';

/** Colores de los almacenes GUM. */
const COLORS = {
  outline: '#4a3a2c',
  facade: '#e6d8b8',
  facadeShade: '#c7b691',
  trim: '#f6efdc',
  roof: '#5f7f6a',
  roofDark: '#3f5a49',
  window: '#2c2a36',
  arcade: '#8c7a5c',
} as const;

/** Extremos de la fachada en perspectiva: cerca (izquierda) y lejos (derecha). */
const NEAR = { x: 36, top: 62, bottom: 134 } as const;
const FAR = { x: 101, top: 96, bottom: 118 } as const;

/** Número de módulos verticales de la fachada. */
const BAYS = 13;

/** Posiciones (fracción de la fachada) de los torreones con tejado verde. */
const TURRETS = [0.08, 0.46, 0.84] as const;

/**
 * Punto de la fachada en perspectiva.
 * @param t Fracción a lo largo de la fachada (0 cerca, 1 lejos).
 * @param v Fracción vertical (0 arriba, 1 abajo).
 * @returns Coordenadas del punto.
 */
function facadePoint(t: number, v: number): { x: number; y: number } {
  const x = NEAR.x + (FAR.x - NEAR.x) * t;
  const top = NEAR.top + (FAR.top - NEAR.top) * t;
  const bottom = NEAR.bottom + (FAR.bottom - NEAR.bottom) * t;
  return { x, y: top + (bottom - top) * v };
}

/**
 * Cuadrilátero de la fachada entre dos fracciones horizontales y dos verticales.
 * @param t0 Fracción horizontal inicial.
 * @param t1 Fracción horizontal final.
 * @param v0 Fracción vertical superior.
 * @param v1 Fracción vertical inferior.
 * @returns Vértices del cuadrilátero.
 */
function quad(t0: number, t1: number, v0: number, v1: number) {
  return [facadePoint(t0, v0), facadePoint(t1, v0), facadePoint(t1, v1), facadePoint(t0, v1)];
}

/**
 * Almacenes GUM: larga fachada clara en perspectiva a la izquierda, con tres pisos de
 * ventanas en arco, soportales y torreones de tejado verde.
 * @returns El elemento del decorado.
 */
export function createGum(): SceneryPiece {
  const windows: PixelRect[] = [];
  const draw = (ctx: RenderContext): void => {
    windows.length = 0;
    // Tejado corrido.
    fillPolygon(
      ctx,
      [
        { x: NEAR.x, y: NEAR.top - 6 },
        { x: FAR.x, y: FAR.top - 3 },
        { x: FAR.x, y: FAR.top },
        { x: NEAR.x, y: NEAR.top },
      ],
      COLORS.roof,
    );
    // Fachada con contorno.
    fillPolygon(ctx, quad(0, 1, 0, 1), COLORS.outline);
    fillPolygon(ctx, quad(0.004, 0.996, 0.01, 0.99), COLORS.facade);
    // Cornisas y soportales.
    for (const v of [0.02, 0.36, 0.68]) {
      fillPolygon(ctx, quad(0, 1, v, v + 0.035), COLORS.trim);
    }
    fillPolygon(ctx, quad(0, 1, 0.72, 0.99), COLORS.facadeShade);
    // Módulos: ventanas en arco en tres pisos y arcos de los soportales.
    for (let bay = 0; bay < BAYS; bay++) {
      const t0 = bay / BAYS;
      const t1 = (bay + 1) / BAYS;
      const pad = (t1 - t0) * 0.28;
      for (const [v0, v1] of [
        [0.1, 0.3],
        [0.44, 0.62],
      ] as const) {
        const corners = quad(t0 + pad, t1 - pad, v0, v1);
        const [a, b, c, d] = corners;
        if (a === undefined || b === undefined || c === undefined || d === undefined) {
          continue;
        }
        fillPolygon(
          ctx,
          [
            { x: d.x, y: d.y },
            { x: a.x, y: a.y + (d.y - a.y) * 0.3 },
            { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
            { x: b.x, y: b.y + (c.y - b.y) * 0.3 },
            { x: c.x, y: c.y },
          ],
          COLORS.window,
        );
        const minX = Math.min(a.x, d.x);
        const minY = Math.min(a.y, b.y);
        windows.push({
          x: Math.round(minX),
          y: Math.round(minY + (d.y - minY) * 0.35),
          width: Math.max(1, Math.round(Math.max(b.x, c.x) - minX)),
          height: Math.max(1, Math.round((d.y - minY) * 0.6)),
        });
      }
      const arch = quad(t0 + pad * 0.5, t1 - pad * 0.5, 0.76, 0.99);
      fillPolygon(ctx, arch, COLORS.arcade);
      // Pilastras.
      fillPolygon(
        ctx,
        quad(t0, t0 + (t1 - t0) * 0.08, 0.04, 0.99),
        mixColors(COLORS.facade, COLORS.trim, 0.6),
      );
    }
    // Torreones con tejado verde apuntado.
    for (const t of TURRETS) {
      const base = facadePoint(t, 0);
      const width = Math.max(4, 10 - t * 6);
      const height = Math.max(5, 14 - t * 8);
      fillPixelRect(
        ctx,
        base.x - width / 2,
        base.y - height * 0.45,
        width,
        height * 0.45 + 1,
        COLORS.facade,
      );
      fillPolygon(
        ctx,
        [
          { x: base.x - width / 2 - 1, y: base.y - height * 0.45 },
          { x: base.x, y: base.y - height * 1.25 },
          { x: base.x + width / 2 + 1, y: base.y - height * 0.45 },
        ],
        COLORS.roofDark,
      );
      fillPixelRect(ctx, base.x, base.y - height * 1.25 - 2, 1, 2, '#e8b947');
    }
  };
  return {
    windows,
    roofs: [
      { from: { x: NEAR.x, y: NEAR.top - 7 }, to: { x: FAR.x, y: FAR.top - 4 }, thickness: 2 },
    ],
    draw,
  };
}
