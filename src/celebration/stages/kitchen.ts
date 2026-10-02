import { fillEllipse, fillPixelRect, fillPolygon, withAlpha } from '../../scene/pixel_shapes';
import { stableRandom } from './stage_helpers';
import { STAGE_GROUND_Y, STAGE_SIZE, type Stage } from './stage_types';

/** Cocina de la isba: estufa rusa blanca con el fuego encendido, samovar, toalla bordada y ventana escarchada. */
export const KITCHEN: Stage = {
  place: 'EN LA COCINA DE LA ISBA',
  draw: (ctx, timeMs) => {
    // Paredes de troncos.
    for (let y = 0; y < STAGE_GROUND_Y; y += 6) {
      fillPixelRect(ctx, 0, y, STAGE_SIZE.width, 5, '#9a6a3c');
      fillPixelRect(ctx, 0, y + 5, STAGE_SIZE.width, 1, '#6a4424');
    }
    // Ventana escarchada con cortinas rojas.
    fillPixelRect(ctx, 30, 26, 50, 40, '#5e3a1e');
    fillPixelRect(ctx, 33, 29, 44, 34, '#cfe0f0');
    for (let i = 0; i < 30; i++) {
      fillPixelRect(
        ctx,
        33 + stableRandom(i, 1) * 44,
        29 + stableRandom(i, 2) * 34,
        2,
        1,
        '#ffffff',
      );
    }
    fillPixelRect(ctx, 54, 29, 2, 34, '#5e3a1e');
    fillPolygon(
      ctx,
      [
        { x: 28, y: 24 },
        { x: 44, y: 24 },
        { x: 34, y: 70 },
        { x: 28, y: 70 },
      ],
      '#c22b38',
    );
    fillPolygon(
      ctx,
      [
        { x: 66, y: 24 },
        { x: 82, y: 24 },
        { x: 82, y: 70 },
        { x: 76, y: 70 },
      ],
      '#c22b38',
    );
    // Toalla bordada (rushnik).
    fillPixelRect(ctx, 104, 30, 12, 46, '#f2ece0');
    for (let y = 36; y < 76; y += 8) {
      fillPixelRect(ctx, 106, y, 8, 2, '#c22b38');
      fillPixelRect(ctx, 108, y + 3, 4, 1, '#c22b38');
    }
    // Estufa rusa (pech) con boca en arco y fuego.
    fillPixelRect(ctx, 214, 40, 100, STAGE_GROUND_Y - 40, '#3a2a28');
    fillPixelRect(ctx, 216, 42, 96, STAGE_GROUND_Y - 42, '#f2ede2');
    fillPixelRect(ctx, 290, 42, 22, STAGE_GROUND_Y - 42, '#d9d2c2');
    fillPixelRect(ctx, 210, 38, 108, 6, '#d9d2c2');
    for (let x = 220; x < 310; x += 9) {
      fillPixelRect(ctx, x, 50, 6, 3, '#2f62c8');
    }
    fillPixelRect(ctx, 236, 96, 44, 32, '#1e1210');
    fillEllipse(ctx, 258, 96, 22, 10, '#1e1210');
    const flicker = 0.75 + 0.25 * Math.sin(timeMs / 90) * Math.sin(timeMs / 37);
    fillEllipse(ctx, 258, 120, 16, 8 * flicker, '#e2502a');
    fillEllipse(ctx, 258, 122, 11, 6 * flicker, '#f2a23a');
    fillEllipse(ctx, 258, 124, 6, 4 * flicker, '#fff0a0');
    fillEllipse(ctx, 258, 112, 40, 30, withAlpha('#ffb060', 0.12 * flicker));
    // Suelo con alfombra.
    fillPixelRect(
      ctx,
      0,
      STAGE_GROUND_Y,
      STAGE_SIZE.width,
      STAGE_SIZE.height - STAGE_GROUND_Y,
      '#6a4424',
    );
    fillPixelRect(ctx, 96, STAGE_GROUND_Y + 4, 128, 20, '#9e2f3a');
    for (let x = 100; x < 220; x += 8) {
      fillPixelRect(ctx, x, STAGE_GROUND_Y + 12, 4, 4, '#f2c23a');
    }
  },
  drawFront: (ctx, timeMs) => {
    // Mesa con samovar, tazas y pan.
    fillPixelRect(ctx, 6, 132, 76, 5, '#5e3a1e');
    fillPixelRect(ctx, 10, 137, 4, 43, '#4a2c16');
    fillPixelRect(ctx, 74, 137, 4, 43, '#4a2c16');
    fillPixelRect(ctx, 28, 104, 18, 22, '#c9902a');
    fillEllipse(ctx, 37, 104, 9, 4, '#e8b947');
    fillPixelRect(ctx, 34, 96, 6, 8, '#c9902a');
    fillPixelRect(ctx, 26, 126, 22, 6, '#a8781e');
    fillPixelRect(ctx, 46, 114, 6, 2, '#a8781e');
    fillPixelRect(ctx, 31, 108, 3, 14, '#f2d27a');
    const steam = Math.sin(timeMs / 400);
    fillPixelRect(ctx, 36 + steam, 88, 2, 4, withAlpha('#ffffff', 0.6));
    fillPixelRect(ctx, 37 - steam, 82, 2, 4, withAlpha('#ffffff', 0.4));
    fillPixelRect(ctx, 56, 126, 7, 6, '#f2ece0');
    fillPixelRect(ctx, 63, 128, 2, 2, '#f2ece0');
    fillEllipse(ctx, 14, 128, 6, 4, '#c98a4a');
  },
};
