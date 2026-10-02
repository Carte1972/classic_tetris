import { fillEllipse, fillPixelRect, fillPolygon, withAlpha } from '../../scene/pixel_shapes';
import { STAGE_GROUND_Y, STAGE_SIZE, type Stage } from './stage_types';

/**
 * Pieza de ajedrez gigante (silueta de rey o de caballo).
 * @param ctx Contexto de dibujo.
 * @param x Centro.
 * @param baseY Base.
 * @param kind Rey o caballo.
 * @param color Color.
 */
function drawGiantPiece(
  ctx: Parameters<Stage['draw']>[0],
  x: number,
  baseY: number,
  kind: 'king' | 'knight',
  color: string,
): void {
  fillPixelRect(ctx, x - 12, baseY - 6, 24, 6, color);
  fillPixelRect(ctx, x - 8, baseY - 12, 16, 6, color);
  if (kind === 'king') {
    fillPolygon(
      ctx,
      [
        { x: x - 7, y: baseY - 12 },
        { x: x + 7, y: baseY - 12 },
        { x: x + 5, y: baseY - 40 },
        { x: x - 5, y: baseY - 40 },
      ],
      color,
    );
    fillEllipse(ctx, x, baseY - 44, 7, 5, color);
    fillPixelRect(ctx, x - 1, baseY - 56, 3, 9, color);
    fillPixelRect(ctx, x - 4, baseY - 53, 9, 3, color);
  } else {
    fillPolygon(
      ctx,
      [
        { x: x - 7, y: baseY - 12 },
        { x: x + 8, y: baseY - 12 },
        { x: x + 6, y: baseY - 36 },
        { x: x - 8, y: baseY - 44 },
        { x: x - 2, y: baseY - 50 },
        { x: x + 9, y: baseY - 40 },
      ],
      color,
    );
  }
}

/** Salón de columnas: columnas blancas, lámparas de araña de cristal, alfombra roja y suelo de tablero de ajedrez con piezas gigantes. */
export const HALL_OF_COLUMNS: Stage = {
  place: 'EN EL SALÓN DE COLUMNAS',
  draw: (ctx, timeMs) => {
    fillPixelRect(ctx, 0, 0, STAGE_SIZE.width, STAGE_GROUND_Y, '#d9cfb6');
    fillPixelRect(ctx, 0, 0, STAGE_SIZE.width, 14, '#c2b493');
    for (let x = 0; x < STAGE_SIZE.width; x += 10) {
      fillPixelRect(ctx, x, 14, 6, 3, '#e8dcc0');
    }
    // Columnas corintias.
    for (const x of [18, 70, 122, 186, 238, 290]) {
      fillPixelRect(ctx, x - 1, 20, 14, STAGE_GROUND_Y - 30, '#a89a7a');
      fillPixelRect(ctx, x, 20, 12, STAGE_GROUND_Y - 30, '#f6f2e8');
      fillPixelRect(ctx, x + 8, 20, 4, STAGE_GROUND_Y - 30, '#d9d2c2');
      for (let i = 2; i < 12; i += 3) {
        fillPixelRect(ctx, x + i, 24, 1, STAGE_GROUND_Y - 38, '#e2dccc');
      }
      fillPixelRect(ctx, x - 3, 17, 18, 5, '#e8b947');
      fillPixelRect(ctx, x - 3, STAGE_GROUND_Y - 10, 18, 6, '#e8dcc0');
    }
    // Lámparas de araña con destellos.
    for (const cx of [96, 224]) {
      fillPixelRect(ctx, cx, 0, 1, 18, '#a88a3a');
      fillEllipse(ctx, cx, 26, 18, 7, '#e8b947');
      for (let i = -3; i <= 3; i++) {
        const sparkle = Math.sin(timeMs / 200 + i * 1.7 + cx) > 0.6;
        fillPixelRect(ctx, cx + i * 5, 30 + Math.abs(i), 1, 5, sparkle ? '#ffffff' : '#cfe8ff');
        fillPixelRect(ctx, cx + i * 5, 22, 1, 3, '#fff3b8');
      }
      fillEllipse(ctx, cx, 30, 30, 18, withAlpha('#fff3b8', 0.1));
    }
    // Suelo de tablero de ajedrez en perspectiva.
    const rows = 7;
    for (let r = 0; r < rows; r++) {
      const y0 = STAGE_GROUND_Y - 6 + r * 5;
      const width = 18 + r * 2;
      for (let c = -2; c * width < STAGE_SIZE.width + width; c++) {
        const tileX = c * width - (r * width) / 4;
        if (tileX + width < 0) {
          continue;
        }
        fillPixelRect(ctx, tileX, y0, width, 5, (r + c) % 2 === 0 ? '#f2ece0' : '#3a2e2a');
      }
    }
    fillPixelRect(ctx, 120, STAGE_GROUND_Y - 6, 80, STAGE_SIZE.height, withAlpha('#b02a36', 0.85));
    drawGiantPiece(ctx, 40, STAGE_GROUND_Y + 2, 'king', '#2a2228');
    drawGiantPiece(ctx, 280, STAGE_GROUND_Y + 2, 'knight', '#f6f1e2');
  },
};
