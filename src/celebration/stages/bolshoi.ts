import { fillEllipse, fillPixelRect, fillPolygon, withAlpha } from '../../scene/pixel_shapes';
import { STAGE_CENTER_X, STAGE_GROUND_Y, STAGE_SIZE, type Stage } from './stage_types';

/** Escenario del Bolshói: telón rojo con flecos dorados, palcos dorados al fondo y foco. */
export const BOLSHOI: Stage = {
  place: 'EN EL TEATRO BOLSHÓI',
  draw: (ctx, timeMs) => {
    fillPixelRect(ctx, 0, 0, STAGE_SIZE.width, STAGE_GROUND_Y, '#3a0d14');
    // Palcos en herradura con luces.
    for (let tier = 0; tier < 4; tier++) {
      const y = 30 + tier * 22;
      fillPixelRect(ctx, 40, y, 240, 18, '#5a1420');
      for (let x = 44; x < 278; x += 14) {
        fillPixelRect(ctx, x, y + 2, 11, 10, '#2a0a10');
        fillPixelRect(ctx, x + 1, y + 10, 9, 2, '#d9a62a');
        fillPixelRect(
          ctx,
          x + 5,
          y + 4,
          1,
          1,
          withAlpha('#ffe7a0', 0.6 + 0.4 * Math.sin(timeMs / 300 + x)),
        );
      }
      fillPixelRect(ctx, 40, y + 14, 240, 3, '#e8b947');
    }
    fillEllipse(ctx, 160, 14, 26, 8, '#e8b947');
    // Suelo del escenario.
    fillPixelRect(ctx, 0, STAGE_GROUND_Y - 4, STAGE_SIZE.width, STAGE_SIZE.height, '#6a3a1e');
    for (let x = 0; x < STAGE_SIZE.width; x += 10) {
      fillPixelRect(ctx, x, STAGE_GROUND_Y - 4, 1, STAGE_SIZE.height, '#4e2a14');
    }
    // Foco que sigue al centro.
    const sway = Math.sin(timeMs / 900) * 20;
    fillPolygon(
      ctx,
      [
        { x: STAGE_CENTER_X - 6 + sway, y: 0 },
        { x: STAGE_CENTER_X + 6 + sway, y: 0 },
        { x: STAGE_CENTER_X + 46, y: STAGE_GROUND_Y + 8 },
        { x: STAGE_CENTER_X - 46, y: STAGE_GROUND_Y + 8 },
      ],
      withAlpha('#fff3c8', 0.13),
    );
    fillEllipse(ctx, STAGE_CENTER_X, STAGE_GROUND_Y + 6, 46, 6, withAlpha('#fff3c8', 0.2));
  },
  drawFront: (ctx) => {
    // Telón rojo a los lados y bambalina con flecos dorados.
    for (const [x0, x1] of [
      [0, 46],
      [274, 320],
    ] as const) {
      for (let x = x0; x < x1; x += 6) {
        fillPixelRect(ctx, x, 0, 6, STAGE_SIZE.height, (x / 6) % 2 === 0 ? '#b0162a' : '#8a0f20');
        fillPixelRect(ctx, x + 4, 0, 2, STAGE_SIZE.height, '#6a0a18');
      }
    }
    fillPixelRect(ctx, 0, 0, STAGE_SIZE.width, 18, '#b0162a');
    for (let x = 0; x < STAGE_SIZE.width; x += 16) {
      fillEllipse(ctx, x + 8, 18, 8, 5, '#b0162a');
    }
    fillPixelRect(ctx, 0, 22, STAGE_SIZE.width, 2, '#e8b947');
    for (let x = 0; x < STAGE_SIZE.width; x += 3) {
      fillPixelRect(ctx, x, 24, 1, 3, '#e8b947');
    }
  },
};
