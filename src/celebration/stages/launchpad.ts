import { fillEllipse, fillPixelRect, fillPolygon, withAlpha } from '../../scene/pixel_shapes';
import { bandGradient, stableRandom } from './stage_helpers';
import { STAGE_GROUND_Y, STAGE_SIZE, type Stage } from './stage_types';

/** Momento en que despega el cohete (ms desde el inicio). */
const LIFTOFF_MS = 2500;

/** Velocidad de subida del cohete (px por segundo, acelerando). */
const ROCKET_ACCELERATION = 14;

/** Rampa de lanzamiento al amanecer: torre de servicio, cohete que despega con fuego y humo. */
export const LAUNCHPAD: Stage = {
  place: 'EN LA RAMPA DE LANZAMIENTO',
  draw: (ctx, timeMs) => {
    bandGradient(ctx, 0, 110, '#1d1f4a', '#f29a5a');
    for (let i = 0; i < 40; i++) {
      fillPixelRect(
        ctx,
        stableRandom(i, 1) * STAGE_SIZE.width,
        stableRandom(i, 2) * 50,
        1,
        1,
        withAlpha('#ffffff', 0.4 + stableRandom(i, 3) * 0.6),
      );
    }
    bandGradient(ctx, 108, STAGE_SIZE.height, '#a88a62', '#6e5838', 3);
    const flight = Math.max(0, timeMs - LIFTOFF_MS) / 1000;
    const rise = 0.5 * ROCKET_ACCELERATION * flight * flight * 4;
    const rocketX = 248;
    const base = 112 - rise;
    // Torre de servicio (celosía roja y blanca).
    for (const x of [222, 234]) {
      fillPixelRect(ctx, x, 30, 3, 82, '#c23a3a');
    }
    for (let y = 32; y < 112; y += 8) {
      fillPixelRect(ctx, 222, y, 15, 1, '#e8e2d6');
      fillPixelRect(ctx, 222 + ((y / 8) % 2) * 6, y, 1, 8, '#e8e2d6');
    }
    fillPixelRect(ctx, 236, 50, 8, 2, '#c23a3a');
    // Humo y fuego del despegue.
    if (timeMs > LIFTOFF_MS - 400) {
      for (let i = 0; i < 14; i++) {
        const spread = Math.min(1, (timeMs - LIFTOFF_MS + 400) / 1500);
        fillEllipse(
          ctx,
          rocketX + (stableRandom(i) - 0.5) * 90 * spread,
          108 - stableRandom(i, 2) * 10,
          8 + stableRandom(i, 3) * 8,
          5 + stableRandom(i, 4) * 4,
          withAlpha('#e8e2da', 0.85),
        );
      }
    }
    if (timeMs > LIFTOFF_MS) {
      const flame = 10 + Math.sin(timeMs / 40) * 3;
      fillPolygon(
        ctx,
        [
          { x: rocketX - 5, y: base },
          { x: rocketX + 5, y: base },
          { x: rocketX, y: base + flame * 2 },
        ],
        '#f2a23a',
      );
      fillPolygon(
        ctx,
        [
          { x: rocketX - 3, y: base },
          { x: rocketX + 3, y: base },
          { x: rocketX, y: base + flame },
        ],
        '#fff0a0',
      );
    }
    // Cohete con propulsores laterales.
    fillPixelRect(ctx, rocketX - 4, base - 56, 9, 56, '#e8e8ee');
    fillPixelRect(ctx, rocketX + 2, base - 56, 3, 56, '#bfc3cf');
    fillPolygon(
      ctx,
      [
        { x: rocketX - 4, y: base - 56 },
        { x: rocketX + 0.5, y: base - 68 },
        { x: rocketX + 5, y: base - 56 },
      ],
      '#c23a3a',
    );
    for (const side of [-1, 1]) {
      fillPolygon(
        ctx,
        [
          { x: rocketX + side * 4, y: base },
          { x: rocketX + side * 10, y: base },
          { x: rocketX + side * 6, y: base - 24 },
          { x: rocketX + side * 4, y: base - 30 },
        ],
        '#8e9a8a',
      );
    }
    fillPixelRect(ctx, rocketX - 4, base - 40, 9, 2, '#c23a3a');
    // Plataforma.
    fillPixelRect(ctx, 200, 112, 90, 4, '#4a4a52');
    fillPixelRect(ctx, 0, STAGE_GROUND_Y, STAGE_SIZE.width, 1, '#5a4a30');
  },
};
