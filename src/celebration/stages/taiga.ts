import { fillEllipse, fillPixelRect, fillPolygon } from '../../scene/pixel_shapes';
import { bandGradient, stableRandom } from './stage_helpers';
import { STAGE_GROUND_Y, STAGE_SIZE, type Stage } from './stage_types';

/**
 * Pino nevado.
 * @param ctx Contexto de dibujo.
 * @param x Centro x.
 * @param baseY Base.
 * @param height Alto.
 * @param color Color del follaje.
 */
function drawPine(
  ctx: Parameters<Stage['draw']>[0],
  x: number,
  baseY: number,
  height: number,
  color: string,
): void {
  fillPixelRect(ctx, x - 1, baseY - height * 0.2, 3, height * 0.2, '#3e2614');
  for (let i = 0; i < 4; i++) {
    const top = baseY - height + i * height * 0.2;
    const half = height * (0.14 + i * 0.07);
    fillPolygon(
      ctx,
      [
        { x, y: top },
        { x: x + half, y: top + height * 0.32 },
        { x: x - half, y: top + height * 0.32 },
      ],
      color,
    );
    fillPolygon(
      ctx,
      [
        { x, y: top },
        { x: x + half * 0.5, y: top + height * 0.12 },
        { x: x - half * 0.5, y: top + height * 0.12 },
      ],
      '#f4f7ff',
    );
  }
}

/**
 * Abedul de tronco blanco con marcas negras.
 * @param ctx Contexto de dibujo.
 * @param x Columna izquierda del tronco.
 * @param baseY Base.
 * @param height Alto.
 */
function drawBirch(
  ctx: Parameters<Stage['draw']>[0],
  x: number,
  baseY: number,
  height: number,
): void {
  fillPixelRect(ctx, x, baseY - height, 5, height, '#f0ede4');
  fillPixelRect(ctx, x + 3, baseY - height, 2, height, '#cfcabb');
  for (let i = 0; i < height / 7; i++) {
    fillPixelRect(ctx, x + (i % 2 === 0 ? 0 : 2), baseY - height + i * 7 + 2, 3, 1, '#2a2a2a');
  }
  fillEllipse(ctx, x + 2, baseY - height, 12, 8, '#d9c27a');
}

/** Taiga nevada del oso: pinos, abedules, nieve en el suelo y nevando. */
export const TAIGA: Stage = {
  place: 'EN LA TAIGA',
  draw: (ctx, timeMs) => {
    bandGradient(ctx, 0, 110, '#9fb4cc', '#e2eaf2');
    for (let i = 0; i < 14; i++) {
      drawPine(ctx, i * 25 + stableRandom(i) * 10, 112, 40 + stableRandom(i, 2) * 20, '#3d5a5a');
    }
    bandGradient(ctx, 108, STAGE_SIZE.height, '#e8eef6', '#c9d3e2', 3);
    for (const [x, h] of [
      [30, 120],
      [70, 100],
      [244, 110],
      [288, 126],
    ] as const) {
      drawBirch(ctx, x, STAGE_GROUND_Y + 4, h);
    }
    for (const x of [8, 112, 206, 314]) {
      drawPine(ctx, x, STAGE_GROUND_Y + 8, 90, '#2a4a40');
    }
    for (let i = 0; i < 90; i++) {
      const y =
        (stableRandom(i, 5) * STAGE_SIZE.height + (timeMs / 1000) * (14 + stableRandom(i) * 10)) %
        STAGE_SIZE.height;
      const x =
        (stableRandom(i, 6) * STAGE_SIZE.width + Math.sin(timeMs / 800 + i) * 3) % STAGE_SIZE.width;
      fillPixelRect(
        ctx,
        x,
        y,
        stableRandom(i, 7) < 0.3 ? 2 : 1,
        stableRandom(i, 7) < 0.3 ? 2 : 1,
        '#ffffff',
      );
    }
  },
};
