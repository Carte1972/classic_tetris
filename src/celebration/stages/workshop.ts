import { fillEllipse, fillPixelRect, withAlpha } from '../../scene/pixel_shapes';
import { drawLittleDoll, stableRandom } from './stage_helpers';
import { STAGE_GROUND_Y, STAGE_SIZE, type Stage } from './stage_types';

/** Colores de las matrioskas de las estanterías. */
const DOLL_COLORS = ['#d6303c', '#2f62c8', '#2f9a5a', '#e2a33a', '#8a3ab0', '#e2623a'] as const;

/** Taller de artesanía: paredes de madera, ventana nevada, estanterías llenas de matrioskas y banco de trabajo. */
export const WORKSHOP: Stage = {
  place: 'EN EL TALLER DE ARTESANÍA',
  draw: (ctx, timeMs) => {
    // Paredes de tablones.
    for (let x = 0; x < STAGE_SIZE.width; x += 12) {
      fillPixelRect(ctx, x, 0, 12, STAGE_GROUND_Y, x % 24 === 0 ? '#9a6a3c' : '#8a5c32');
      fillPixelRect(ctx, x, 0, 1, STAGE_GROUND_Y, '#5e3a1e');
    }
    // Ventana con nieve fuera y cortina de encaje.
    fillPixelRect(ctx, 128, 18, 64, 46, '#5e3a1e');
    fillPixelRect(ctx, 131, 21, 58, 40, '#bcd3ea');
    fillPixelRect(ctx, 131, 52, 58, 9, '#f4f7ff');
    for (let i = 0; i < 18; i++) {
      const y = (stableRandom(i, 3) * 40 + timeMs / 60) % 40;
      fillPixelRect(ctx, 131 + stableRandom(i, 4) * 58, 21 + y, 1, 1, '#ffffff');
    }
    fillPixelRect(ctx, 159, 21, 2, 40, '#5e3a1e');
    fillPixelRect(ctx, 131, 40, 58, 2, '#5e3a1e');
    fillPixelRect(ctx, 126, 16, 10, 50, withAlpha('#ffffff', 0.7));
    fillPixelRect(ctx, 184, 16, 10, 50, withAlpha('#ffffff', 0.7));
    // Estanterías con matrioskas de todos los tamaños.
    for (const [x0, x1] of [
      [6, 116],
      [204, 314],
    ] as const) {
      for (const shelfY of [46, 84, 120]) {
        fillPixelRect(ctx, x0, shelfY, x1 - x0, 3, '#5e3a1e');
        fillPixelRect(ctx, x0, shelfY + 3, x1 - x0, 2, '#3e2614');
        let x = x0 + 6;
        let i = 0;
        while (x < x1 - 6) {
          const size = 10 + Math.floor(stableRandom(shelfY + i, x0) * 12);
          drawLittleDoll(
            ctx,
            x + size * 0.3,
            shelfY,
            size,
            DOLL_COLORS[(i + shelfY) % DOLL_COLORS.length] ?? '#d6303c',
          );
          x += size * 0.62 + 2;
          i++;
        }
      }
    }
    // Suelo de tablones.
    for (let y = STAGE_GROUND_Y; y < STAGE_SIZE.height; y += 4) {
      fillPixelRect(ctx, 0, y, STAGE_SIZE.width, 4, y % 8 === 0 ? '#6a4424' : '#5e3a1e');
    }
    // Rayo de sol con polvo.
    fillPixelRect(
      ctx,
      140,
      64,
      40,
      STAGE_GROUND_Y - 64,
      withAlpha('#fff2c0', 0.08 + 0.03 * Math.sin(timeMs / 500)),
    );
  },
  drawFront: (ctx) => {
    // Banco de trabajo con botes de pintura y pinceles.
    fillPixelRect(ctx, 0, 150, 70, 6, '#4a2c16');
    fillPixelRect(ctx, 4, 156, 4, 24, '#3e2614');
    fillPixelRect(ctx, 60, 156, 4, 24, '#3e2614');
    for (const [x, color] of [
      [10, '#d6303c'],
      [22, '#2f62c8'],
      [34, '#f2c23a'],
    ] as const) {
      fillPixelRect(ctx, x, 142, 8, 8, '#d8d8e0');
      fillEllipse(ctx, x + 4, 142, 4, 1.5, color);
    }
    fillPixelRect(ctx, 48, 136, 1, 14, '#c9a227');
    fillPixelRect(ctx, 52, 138, 1, 12, '#c9a227');
  },
};
