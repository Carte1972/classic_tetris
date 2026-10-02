import { fillEllipse, fillPixelRect, fillPolygon, withAlpha } from '../../scene/pixel_shapes';
import { stableRandom } from './stage_helpers';
import { STAGE_GROUND_Y, STAGE_SIZE, type Stage } from './stage_types';

/** Colores de los frescos. */
const FRESCO = ['#c23a3a', '#2f5a9a', '#3a8a5a', '#e8b947', '#8a4a2a'] as const;

/** Salón del Kremlin: bóvedas con frescos dorados, arcos, candelabro con velas y alfombra roja. */
export const KREMLIN_HALL: Stage = {
  place: 'EN UN SALÓN DEL KREMLIN',
  draw: (ctx, timeMs) => {
    fillPixelRect(ctx, 0, 0, STAGE_SIZE.width, STAGE_GROUND_Y, '#c9902a');
    // Frescos: paneles con figuras de colores sobre fondo dorado.
    for (let i = 0; i < 40; i++) {
      const x = (i % 10) * 32 + 4;
      const y = Math.floor(i / 10) * 30 + 8;
      fillPixelRect(ctx, x, y, 26, 24, '#a8701e');
      fillPixelRect(ctx, x + 1, y + 1, 24, 22, '#e2b24a');
      const color = FRESCO[Math.floor(stableRandom(i) * FRESCO.length)] ?? '#c23a3a';
      fillEllipse(ctx, x + 13, y + 7, 3, 3, '#f2d9b8');
      fillEllipse(ctx, x + 13, y + 7, 5, 5, withAlpha('#fff3b8', 0.4));
      fillPolygon(
        ctx,
        [
          { x: x + 8, y: y + 21 },
          { x: x + 18, y: y + 21 },
          { x: x + 15, y: y + 10 },
          { x: x + 11, y: y + 10 },
        ],
        color,
      );
    }
    // Arcos de las bóvedas.
    for (const cx of [53, 160, 267]) {
      fillEllipse(ctx, cx, 0, 60, 26, '#7a2a1e');
      fillEllipse(ctx, cx, 0, 56, 22, '#c9902a');
      for (let a = 0; a < 7; a++) {
        fillEllipse(ctx, cx - 45 + a * 15, 8 + Math.abs(a - 3) * 3, 3, 3, '#2f5a9a');
      }
    }
    // Candelabro con velas que titilan.
    fillPixelRect(ctx, 160, 0, 1, 26, '#6a4a1a');
    fillEllipse(ctx, 160, 32, 30, 5, '#a8781e');
    for (let i = -4; i <= 4; i++) {
      const x = 160 + i * 7;
      fillPixelRect(ctx, x, 24, 2, 6, '#f4ecd8');
      const flame = 2 + Math.sin(timeMs / 70 + i * 2.1) * 0.8;
      fillEllipse(ctx, x + 1, 22, 1.5, flame, '#f2a23a');
      fillEllipse(ctx, x + 1, 22, 6, 6, withAlpha('#ffd77a', 0.12));
    }
    // Suelo y alfombra roja.
    fillPixelRect(ctx, 0, STAGE_GROUND_Y - 4, STAGE_SIZE.width, STAGE_SIZE.height, '#4a2a1a');
    fillPolygon(
      ctx,
      [
        { x: 110, y: STAGE_GROUND_Y - 4 },
        { x: 210, y: STAGE_GROUND_Y - 4 },
        { x: 250, y: STAGE_SIZE.height },
        { x: 70, y: STAGE_SIZE.height },
      ],
      '#9e1f2a',
    );
    fillPolygon(
      ctx,
      [
        { x: 114, y: STAGE_GROUND_Y - 2 },
        { x: 206, y: STAGE_GROUND_Y - 2 },
        { x: 244, y: STAGE_SIZE.height },
        { x: 76, y: STAGE_SIZE.height },
      ],
      '#b8283a',
    );
  },
};
