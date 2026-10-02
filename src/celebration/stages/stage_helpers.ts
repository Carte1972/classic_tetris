import type { RenderContext } from '../../render/render_context';
import { fillEllipse, fillPixelRect, fillPolygon, mixColors } from '../../scene/pixel_shapes';
import { STAGE_SIZE } from './stage_types';

/**
 * Degradado vertical en franjas de color.
 * @param ctx Contexto de dibujo.
 * @param top Fila inicial.
 * @param bottom Fila final (excluida).
 * @param from Color de arriba.
 * @param to Color de abajo.
 * @param band Alto de cada franja.
 */
export function bandGradient(
  ctx: RenderContext,
  top: number,
  bottom: number,
  from: string,
  to: string,
  band = 4,
): void {
  for (let y = top; y < bottom; y += band) {
    fillPixelRect(
      ctx,
      0,
      y,
      STAGE_SIZE.width,
      Math.min(band, bottom - y),
      mixColors(from, to, (y - top) / Math.max(1, bottom - top)),
    );
  }
}

/**
 * Pseudoaleatorio estable a partir de un índice.
 * @param index Índice.
 * @param salt Variante.
 * @returns Valor en [0, 1).
 */
export function stableRandom(index: number, salt = 0): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Isba (casa de troncos) con tejado a dos aguas y marcos de ventana tallados.
 * @param ctx Contexto de dibujo.
 * @param x Columna izquierda.
 * @param baseY Fila de la base.
 * @param width Ancho.
 * @param height Alto de las paredes.
 */
export function drawIzba(
  ctx: RenderContext,
  x: number,
  baseY: number,
  width: number,
  height: number,
): void {
  const top = baseY - height;
  fillPixelRect(ctx, x - 1, top - 1, width + 2, height + 2, '#2a1810');
  for (let y = top; y < baseY; y += 3) {
    fillPixelRect(ctx, x, y, width, 2, '#8a5a32');
    fillPixelRect(ctx, x, y + 2, width, 1, '#5e3a1e');
  }
  fillPolygon(
    ctx,
    [
      { x: x - 4, y: top },
      { x: x + width / 2, y: top - height * 0.75 },
      { x: x + width + 4, y: top },
    ],
    '#4a5a3a',
  );
  fillPolygon(
    ctx,
    [
      { x: x + width / 2, y: top },
      { x: x + width / 2, y: top - height * 0.75 },
      { x: x + width + 4, y: top },
    ],
    '#36442a',
  );
  const windowWidth = Math.max(4, Math.round(width * 0.22));
  for (const wx of [x + width * 0.18, x + width * 0.6]) {
    fillPixelRect(
      ctx,
      wx - 2,
      top + height * 0.3 - 3,
      windowWidth + 4,
      height * 0.4 + 5,
      '#efe6d2',
    );
    fillPolygon(
      ctx,
      [
        { x: wx - 2, y: top + height * 0.3 - 3 },
        { x: wx + windowWidth / 2, y: top + height * 0.3 - 7 },
        { x: wx + windowWidth + 2, y: top + height * 0.3 - 3 },
      ],
      '#efe6d2',
    );
    fillPixelRect(ctx, wx, top + height * 0.3, windowWidth, height * 0.4, '#f2d27a');
    fillPixelRect(ctx, wx + windowWidth / 2, top + height * 0.3, 1, height * 0.4, '#5e3a1e');
    fillPixelRect(ctx, wx - 4, top + height * 0.3, 2, height * 0.4, '#2f62c8');
    fillPixelRect(ctx, wx + windowWidth + 2, top + height * 0.3, 2, height * 0.4, '#2f62c8');
  }
}

/**
 * Matrioska decorativa (para estanterías y gradas).
 * @param ctx Contexto de dibujo.
 * @param cx Centro x.
 * @param baseY Fila de la base.
 * @param size Alto total.
 * @param color Color del cuerpo.
 */
export function drawLittleDoll(
  ctx: RenderContext,
  cx: number,
  baseY: number,
  size: number,
  color: string,
): void {
  const bodyRy = size * 0.32;
  const headR = size * 0.2;
  fillEllipse(ctx, cx, baseY - bodyRy, size * 0.28 + 1, bodyRy + 1, '#2a1a20');
  fillEllipse(ctx, cx, baseY - bodyRy, size * 0.28, bodyRy, color);
  fillEllipse(ctx, cx, baseY - bodyRy * 2 - headR + 1, headR + 1, headR + 1, '#2a1a20');
  fillEllipse(ctx, cx, baseY - bodyRy * 2 - headR + 1, headR, headR, color);
  fillEllipse(ctx, cx, baseY - bodyRy * 2 - headR + 1.5, headR * 0.6, headR * 0.6, '#f8d8bc');
  fillEllipse(ctx, cx, baseY - bodyRy, size * 0.14, bodyRy * 0.6, '#fbe7a1');
}
