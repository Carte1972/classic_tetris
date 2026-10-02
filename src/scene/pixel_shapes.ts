import type { RenderContext } from '../render/render_context';

/** Punto en píxeles lógicos. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Pinta un tramo horizontal de píxeles (de `x0` a `x1`, ambos incluidos).
 * @param ctx Contexto de dibujo.
 * @param y Fila.
 * @param x0 Primera columna.
 * @param x1 Última columna.
 */
function span(ctx: RenderContext, y: number, x0: number, x1: number): void {
  const left = Math.round(Math.min(x0, x1));
  const right = Math.round(Math.max(x0, x1));
  ctx.fillRect(left, Math.round(y), right - left + 1, 1);
}

/**
 * Elipse rellena y nítida (sin suavizado), pintada fila a fila.
 * @param ctx Contexto de dibujo.
 * @param cx Centro x.
 * @param cy Centro y.
 * @param rx Radio horizontal.
 * @param ry Radio vertical.
 * @param color Color de relleno.
 */
export function fillEllipse(
  ctx: RenderContext,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
): void {
  if (rx <= 0 || ry <= 0) {
    return;
  }
  ctx.fillStyle = color;
  for (let dy = -Math.floor(ry); dy <= Math.floor(ry); dy++) {
    const half = rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)));
    span(ctx, cy + dy, cx - half, cx + half);
  }
}

/**
 * Círculo relleno y nítido.
 * @param ctx Contexto de dibujo.
 * @param cx Centro x.
 * @param cy Centro y.
 * @param radius Radio.
 * @param color Color de relleno.
 */
export function fillCircle(
  ctx: RenderContext,
  cx: number,
  cy: number,
  radius: number,
  color: string,
): void {
  fillEllipse(ctx, cx, cy, radius, radius, color);
}

/**
 * Polígono relleno y nítido (regla par-impar), pintado por tramos horizontales.
 * @param ctx Contexto de dibujo.
 * @param points Vértices en orden.
 * @param color Color de relleno.
 */
export function fillPolygon(ctx: RenderContext, points: readonly Point[], color: string): void {
  if (points.length < 3) {
    return;
  }
  ctx.fillStyle = color;
  const ys = points.map((p) => p.y);
  const top = Math.ceil(Math.min(...ys));
  const bottom = Math.floor(Math.max(...ys));
  for (let y = top; y <= bottom; y++) {
    const scan = y + 0.5;
    const crossings: number[] = [];
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length] ?? a;
      if ((a.y <= scan && b.y > scan) || (b.y <= scan && a.y > scan)) {
        crossings.push(a.x + ((scan - a.y) / (b.y - a.y)) * (b.x - a.x));
      }
    });
    crossings.sort((m, n) => m - n);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const from = crossings[i] ?? 0;
      const to = crossings[i + 1] ?? 0;
      if (to - from >= 0.5) {
        span(ctx, y, from + 0.5, to - 0.5);
      }
    }
  }
}

/**
 * Línea de grosor entero entre dos puntos (algoritmo de Bresenham con pincel cuadrado).
 * @param ctx Contexto de dibujo.
 * @param from Punto inicial.
 * @param to Punto final.
 * @param width Grosor en píxeles.
 * @param color Color.
 */
export function drawLine(
  ctx: RenderContext,
  from: Point,
  to: Point,
  width: number,
  color: string,
): void {
  ctx.fillStyle = color;
  let x = Math.round(from.x);
  let y = Math.round(from.y);
  const endX = Math.round(to.x);
  const endY = Math.round(to.y);
  const dx = Math.abs(endX - x);
  const dy = -Math.abs(endY - y);
  const stepX = x < endX ? 1 : -1;
  const stepY = y < endY ? 1 : -1;
  const offset = Math.floor((width - 1) / 2);
  let error = dx + dy;
  for (;;) {
    ctx.fillRect(x - offset, y - offset, width, width);
    if (x === endX && y === endY) {
      return;
    }
    const doubled = 2 * error;
    if (doubled >= dy) {
      error += dy;
      x += stepX;
    }
    if (doubled <= dx) {
      error += dx;
      y += stepY;
    }
  }
}

/**
 * Rectángulo de píxeles con coordenadas redondeadas.
 * @param ctx Contexto de dibujo.
 * @param x Columna izquierda.
 * @param y Fila superior.
 * @param width Ancho.
 * @param height Alto.
 * @param color Color.
 */
export function fillPixelRect(
  ctx: RenderContext,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

/**
 * Mezcla lineal de dos colores `#rrggbb`.
 * @param from Color inicial.
 * @param to Color final.
 * @param amount Proporción del color final, de 0 a 1.
 * @returns Color resultante `#rrggbb`.
 */
export function mixColors(from: string, to: string, amount: number): string {
  const t = Math.min(1, Math.max(0, amount));
  const channel = (color: string, index: number): number =>
    Number.parseInt(color.slice(1 + index * 2, 3 + index * 2), 16);
  const parts = [0, 1, 2].map((i) =>
    Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * t)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${parts.join('')}`;
}

/**
 * Color `#rrggbb` con transparencia, en formato `rgba()`.
 * @param color Color `#rrggbb`.
 * @param alpha Opacidad de 0 a 1.
 * @returns Color CSS con transparencia.
 */
export function withAlpha(color: string, alpha: number): string {
  const channel = (index: number): number =>
    Number.parseInt(color.slice(1 + index * 2, 3 + index * 2), 16);
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 1000) / 1000;
  return `rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${a})`;
}
