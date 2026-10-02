import {
  GROUND_NEAR_Y,
  LAWN_EDGE,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  VANISHING_POINT,
  WALL_FOOT,
} from '../../config/scene_config';
import type { RenderContext } from '../../render/render_context';
import { drawLine, fillPixelRect, fillPolygon, mixColors } from '../pixel_shapes';
import type { SceneryPiece } from '../scenery';

/** Colores del suelo. */
const COLORS = {
  far: '#a39a96',
  near: '#77707a',
  cobble: '#8a828c',
  cobbleLight: '#b3abb0',
  line: '#e9e4da',
  grass: '#3f8a3e',
  grassDark: '#2f6a32',
  curb: '#d5cfc4',
} as const;

/** Primera fila del suelo (queda tapada en parte por los edificios del fondo). */
const GROUND_TOP = 262;

/** Columnas en el borde inferior por las que pasan las líneas blancas del empedrado. */
const LANE_LINES = [150, 470] as const;

/**
 * Suelo de la plaza en perspectiva: adoquines más pequeños cuanto más lejos, líneas
 * blancas que convergen hacia el fondo y el césped de delante de la muralla.
 * @returns El elemento del decorado.
 */
export function createGround(): SceneryPiece {
  const draw = (ctx: RenderContext): void => {
    const rows = SCENE_HEIGHT - GROUND_TOP;
    for (let i = 0; i < rows; i++) {
      fillPixelRect(
        ctx,
        0,
        GROUND_TOP + i,
        SCENE_WIDTH,
        1,
        mixColors(COLORS.far, COLORS.near, i / rows),
      );
    }
    // Hileras de adoquines: la separación crece hacia el espectador.
    let y = GROUND_TOP + 2;
    let row = 0;
    while (y < SCENE_HEIGHT) {
      const depth = (y - GROUND_TOP) / (GROUND_NEAR_Y - GROUND_TOP);
      const width = Math.max(2, Math.round(3 + depth * 12));
      const offset = row % 2 === 0 ? 0 : Math.floor(width / 2);
      for (let x = -offset; x < SCENE_WIDTH; x += width + 1) {
        const light = (x * 7 + row * 13) % 5 === 0;
        fillPixelRect(ctx, x, y, width, 1, light ? COLORS.cobbleLight : COLORS.cobble);
      }
      y += Math.max(2, Math.round(2 + depth * 6));
      row++;
    }
    // Líneas blancas discontinuas hacia el punto de fuga.
    for (const bottomX of LANE_LINES) {
      for (let t = 0.08; t < 1; t += 0.09) {
        const from = {
          x: VANISHING_POINT.x + (bottomX - VANISHING_POINT.x) * t,
          y: VANISHING_POINT.y + (SCENE_HEIGHT - VANISHING_POINT.y) * t,
        };
        const to = {
          x: VANISHING_POINT.x + (bottomX - VANISHING_POINT.x) * (t + 0.05),
          y: VANISHING_POINT.y + (SCENE_HEIGHT - VANISHING_POINT.y) * (t + 0.05),
        };
        if (from.y > GROUND_TOP + 6) {
          drawLine(ctx, from, to, Math.max(1, Math.round(t * 3)), COLORS.line);
        }
      }
    }
    // Césped al pie de la muralla, con su bordillo.
    fillPolygon(ctx, [WALL_FOOT.from, WALL_FOOT.to, LAWN_EDGE.to, LAWN_EDGE.from], COLORS.grass);
    for (let x = 0; x < LAWN_EDGE.to.x; x += 3) {
      const t = x / LAWN_EDGE.to.x;
      const foot = WALL_FOOT.from.y + (WALL_FOOT.to.y - WALL_FOOT.from.y) * t;
      fillPixelRect(ctx, x, foot, 1, 2, COLORS.grassDark);
    }
    drawLine(ctx, LAWN_EDGE.from, LAWN_EDGE.to, 2, COLORS.curb);
    // Césped delante de San Basilio.
    fillPolygon(
      ctx,
      [
        { x: 420, y: 326 },
        { x: 640, y: 326 },
        { x: 640, y: 336 },
        { x: 432, y: 332 },
      ],
      COLORS.grass,
    );
  };
  return { windows: [], roofs: [], draw };
}
