import type { RenderContext } from '../render/render_context';
import { fillEllipse, fillPixelRect } from './pixel_shapes';

/** Colores de los aros olímpicos (azul, negro, rojo, amarillo, verde). */
const RING_COLORS = ['#0a7ac2', '#1b1b22', '#e0243a', '#f2b134', '#1a9a4a'] as const;

/**
 * Aros olímpicos entrelazados.
 * @param ctx Contexto de dibujo.
 * @param cx Centro x.
 * @param cy Centro y del aro central.
 * @param radius Radio de cada aro.
 * @param background Color del fondo (para vaciar los aros).
 */
export function drawOlympicRings(
  ctx: RenderContext,
  cx: number,
  cy: number,
  radius: number,
  background: string,
): void {
  const gap = radius * 2.2;
  const positions = [
    { x: cx - gap, y: cy },
    { x: cx, y: cy },
    { x: cx + gap, y: cy },
    { x: cx - gap / 2, y: cy + radius },
    { x: cx + gap / 2, y: cy + radius },
  ];
  const thickness = Math.max(1, radius * 0.28);
  positions.forEach((p, i) => {
    fillEllipse(ctx, p.x, p.y, radius, radius, RING_COLORS[i] ?? '#000000');
    fillEllipse(ctx, p.x, p.y, radius - thickness, radius - thickness, background);
  });
  // Entrelazado: los aros de arriba vuelven a pasar por encima en un punto.
  positions.slice(0, 3).forEach((p, i) => {
    fillPixelRect(
      ctx,
      p.x + radius * 0.55,
      p.y + radius * 0.35,
      thickness,
      thickness + 1,
      RING_COLORS[i] ?? '#000000',
    );
  });
}
