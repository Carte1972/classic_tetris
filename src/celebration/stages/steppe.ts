import { fillEllipse, fillPixelRect, fillPolygon, mixColors } from '../../scene/pixel_shapes';
import { bandGradient, drawIzba, stableRandom } from './stage_helpers';
import { STAGE_GROUND_Y, STAGE_SIZE, type Stage } from './stage_types';

/** Estepa del cosaco: trigal dorado, colinas, isbas, valla, girasoles y pájaros. */
export const STEPPE: Stage = {
  place: 'EN LA ESTEPA',
  draw: (ctx, timeMs) => {
    bandGradient(ctx, 0, 96, '#4a8fe0', '#bfe2fa');
    fillEllipse(ctx, 262, 30, 12, 12, '#fff3b8');
    // Colinas lejanas.
    for (let x = 0; x < STAGE_SIZE.width; x += 2) {
      const h = 10 + Math.sin(x / 34) * 6 + Math.sin(x / 13) * 2;
      fillPixelRect(ctx, x, 96 - h, 2, h + 4, '#6f8fb0');
    }
    // Trigal con ondas que se mecen.
    bandGradient(ctx, 96, STAGE_SIZE.height, '#d9b24a', '#a8792a', 3);
    for (let i = 0; i < 160; i++) {
      const x = stableRandom(i, 1) * STAGE_SIZE.width;
      const y = 98 + stableRandom(i, 2) * 50;
      const sway = Math.sin(timeMs / 600 + x / 30) * 1.2;
      fillPixelRect(ctx, x + sway, y, 1, 3, '#f2d27a');
    }
    // Camino de tierra.
    fillPolygon(
      ctx,
      [
        { x: 130, y: 100 },
        { x: 190, y: 100 },
        { x: 250, y: STAGE_SIZE.height },
        { x: 70, y: STAGE_SIZE.height },
      ],
      '#b8956a',
    );
    drawIzba(ctx, 22, 112, 52, 26);
    drawIzba(ctx, 240, 108, 44, 22);
    // Valla de madera.
    for (let x = 80; x < 128; x += 5) {
      fillPixelRect(ctx, x, 104, 2, 10, '#7a5230');
    }
    fillPixelRect(ctx, 78, 107, 52, 1, '#5e3a1e');
    // Pájaros volando.
    for (let i = 0; i < 4; i++) {
      const x = ((timeMs / 40 + i * 70) % 360) - 20;
      const y = 22 + i * 7 + Math.sin(timeMs / 300 + i) * 2;
      if (x < -3) {
        continue;
      }
      const flap = Math.floor(timeMs / 150 + i) % 2 === 0 ? -1 : 1;
      fillPixelRect(ctx, x - 2, y + flap, 2, 1, '#2a2a3a');
      fillPixelRect(ctx, x, y, 1, 1, '#2a2a3a');
      fillPixelRect(ctx, x + 1, y + flap, 2, 1, '#2a2a3a');
    }
    fillPixelRect(
      ctx,
      0,
      STAGE_GROUND_Y,
      STAGE_SIZE.width,
      1,
      mixColors('#a8792a', '#5e3a1e', 0.5),
    );
  },
  drawFront: (ctx, timeMs) => {
    // Girasoles en primer plano.
    for (const [x, h] of [
      [14, 40],
      [34, 32],
      [292, 38],
      [308, 30],
    ] as const) {
      const sway = Math.sin(timeMs / 700 + x) * 1.5;
      fillPixelRect(ctx, x, STAGE_SIZE.height - h, 2, h, '#3f7a2a');
      fillEllipse(ctx, x - 3, STAGE_SIZE.height - h * 0.5, 4, 2, '#4f9a34');
      fillEllipse(ctx, x + 1 + sway, STAGE_SIZE.height - h, 7, 7, '#f2c23a');
      fillEllipse(ctx, x + 1 + sway, STAGE_SIZE.height - h, 3.5, 3.5, '#5e3a1e');
    }
  },
};
