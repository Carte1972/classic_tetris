import { GROUND_NEAR_Y, HORIZON_Y, SCENE_HEIGHT, SCENE_WIDTH } from '../../config/scene_config';
import type { RenderContext } from '../../render/render_context';
import { fillPixelRect, mixColors } from '../pixel_shapes';
import type { SceneryPiece } from '../scenery';

/** Colores del empedrado. */
const COLORS = {
  far: '#8a8086',
  near: '#4b4450',
  cobble: '#6a6070',
  cobbleLight: '#9a909a',
  curb: '#c9c2b6',
} as const;

/**
 * Suelo empedrado de la plaza en perspectiva: adoquines más pequeños cuanto más lejos.
 * @returns El elemento del decorado.
 */
export function createGround(): SceneryPiece {
  const draw = (ctx: RenderContext): void => {
    const rows = SCENE_HEIGHT - HORIZON_Y;
    for (let i = 0; i < rows; i++) {
      const y = HORIZON_Y + i;
      fillPixelRect(ctx, 0, y, SCENE_WIDTH, 1, mixColors(COLORS.far, COLORS.near, i / rows));
    }
    // Hileras de adoquines: la separación crece hacia el espectador.
    let y = HORIZON_Y + 1;
    let gap = 2;
    let row = 0;
    while (y < SCENE_HEIGHT) {
      const depth = (y - HORIZON_Y) / (GROUND_NEAR_Y - HORIZON_Y);
      const width = Math.max(2, Math.round(2 + depth * 7));
      const offset = row % 2 === 0 ? 0 : Math.floor(width / 2);
      for (let x = -offset; x < SCENE_WIDTH; x += width + 1) {
        fillPixelRect(
          ctx,
          x,
          y,
          width,
          1,
          mixColors(COLORS.cobble, COLORS.cobbleLight, (x * 7 + row * 13) % 5 === 0 ? 0.4 : 0),
        );
      }
      y += gap;
      gap = Math.max(2, Math.round(2 + depth * 4));
      row++;
    }
    fillPixelRect(ctx, 0, HORIZON_Y, SCENE_WIDTH, 1, COLORS.curb);
  };
  return { windows: [], roofs: [], draw };
}
