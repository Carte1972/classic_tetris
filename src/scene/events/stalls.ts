import type { RenderContext } from '../../render/render_context';
import { fillPixelRect, fillPolygon, mixColors, withAlpha } from '../pixel_shapes';

/** Colores de las casetas de madera. */
const COLORS = {
  wood: '#8a5a32',
  woodDark: '#5a3a1e',
  plank: '#a06a3a',
  counter: '#f2d27a',
  shade: '#2a1a12',
  snow: '#f4f7ff',
} as const;

/** Colores de las bombillas de las guirnaldas. */
export const BULB_COLORS = ['#ff4a4a', '#ffd23a', '#4ad06a', '#4aa0ff', '#ff8ad0'] as const;

/** Caseta de mercadillo. */
export interface Stall {
  /** Columna del centro. */
  readonly x: number;
  /** Fila del suelo. */
  readonly foot: number;
  /** Ancho a escala cercana (se reduce con la distancia). */
  readonly width: number;
  /** Color del tejado. */
  readonly roof: string;
}

/**
 * Bombilla de una guirnalda que se enciende y se apaga.
 * @param ctx Contexto de dibujo.
 * @param x Columna.
 * @param y Fila.
 * @param index Índice de la bombilla (color y ritmo).
 * @param timeMs Tiempo de la escena.
 * @param size Tamaño en píxeles.
 */
export function drawBulb(
  ctx: RenderContext,
  x: number,
  y: number,
  index: number,
  timeMs: number,
  size = 1,
): void {
  const color = BULB_COLORS[index % BULB_COLORS.length] ?? BULB_COLORS[0];
  const on = Math.floor(timeMs / 450 + index * 0.7) % 3 !== 0;
  fillPixelRect(ctx, x, y, size, size, on ? color : mixColors(color, '#000000', 0.55));
  if (on && size > 1) {
    fillPixelRect(ctx, x - 1, y - 1, size + 2, size + 2, withAlpha(color, 0.25));
  }
}

/**
 * Caseta de madera con tejado a dos aguas, mostrador iluminado y guirnalda.
 * @param ctx Contexto de dibujo.
 * @param stall Caseta.
 * @param scale Escala de profundidad.
 * @param timeMs Tiempo de la escena.
 * @param snowy Si lleva nieve en el tejado.
 * @param goods Dibuja la mercancía sobre el mostrador (columna izquierda, fila, ancho).
 */
export function drawStall(
  ctx: RenderContext,
  stall: Stall,
  scale: number,
  timeMs: number,
  snowy: boolean,
  goods?: (ctx: RenderContext, left: number, y: number, width: number) => void,
): void {
  const w = Math.round(stall.width * scale);
  const h = Math.round(w * 0.62);
  const left = Math.round(stall.x - w / 2);
  const wallTop = stall.foot - h;
  const roofTop = wallTop - Math.round(w * 0.32);
  fillPixelRect(ctx, left - 1, wallTop - 1, w + 2, h + 1, COLORS.shade);
  fillPixelRect(ctx, left, wallTop, w, h, COLORS.wood);
  for (let x = left + 2; x < left + w; x += 3) {
    fillPixelRect(ctx, x, wallTop, 1, h, COLORS.woodDark);
  }
  // Ventana del mostrador.
  const counterTop = wallTop + Math.round(h * 0.2);
  const counterHeight = Math.round(h * 0.42);
  fillPixelRect(ctx, left + 2, counterTop, w - 4, counterHeight, COLORS.shade);
  fillPixelRect(
    ctx,
    left + 3,
    counterTop + 1,
    w - 6,
    counterHeight - 2,
    withAlpha(COLORS.counter, 0.6),
  );
  fillPixelRect(ctx, left + 1, counterTop + counterHeight, w - 2, 2, COLORS.plank);
  goods?.(ctx, left + 3, counterTop + counterHeight, w - 6);
  // Tejado.
  fillPolygon(
    ctx,
    [
      { x: left - 3, y: wallTop + 1 },
      { x: stall.x, y: roofTop },
      { x: left + w + 3, y: wallTop + 1 },
    ],
    stall.roof,
  );
  if (snowy) {
    fillPolygon(
      ctx,
      [
        { x: left - 3, y: wallTop - 1 },
        { x: stall.x, y: roofTop - 1 },
        { x: left + w + 3, y: wallTop - 1 },
        { x: stall.x, y: roofTop + 3 },
      ],
      COLORS.snow,
    );
  }
  // Guirnalda bajo el alero.
  for (let i = 0, x = left - 2; x <= left + w + 2; x += 3, i++) {
    const sag = Math.round(Math.sin((i / 4) * Math.PI) * 1.5);
    drawBulb(ctx, x, wallTop + 2 + Math.abs(sag), i + stall.x, timeMs);
  }
}
