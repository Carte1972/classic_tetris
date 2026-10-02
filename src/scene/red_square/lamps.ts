import type { RenderContext } from '../../render/render_context';
import { fillCircle, fillPixelRect, withAlpha } from '../pixel_shapes';

/** Farola: base, altura y si tiene tres faroles (las grandes) o uno. */
interface Lamp {
  readonly x: number;
  readonly baseY: number;
  readonly height: number;
}

/** Farolas de la plaza, de lejos a cerca. */
export const LAMPS: readonly Lamp[] = [
  { x: 96, baseY: 124, height: 14 },
  { x: 258, baseY: 128, height: 17 },
  { x: 58, baseY: 146, height: 30 },
  { x: 300, baseY: 156, height: 36 },
];

/** Colores de las farolas. */
const COLORS = {
  iron: '#1f2028',
  ironLight: '#3a3c48',
  glass: '#d8cc96',
  glow: '#ffd77a',
} as const;

/**
 * Posiciones de los faroles de una farola (centro de cada farol).
 * @param lamp Farola.
 * @returns Centros de los faroles.
 */
function lanternPositions(lamp: Lamp): { x: number; y: number }[] {
  const scale = lamp.height / 30;
  const top = lamp.baseY - lamp.height;
  if (lamp.height < 20) {
    return [{ x: lamp.x, y: top - 2 * scale }];
  }
  return [
    { x: lamp.x - 5 * scale, y: top + 2 * scale },
    { x: lamp.x, y: top - 3 * scale },
    { x: lamp.x + 5 * scale, y: top + 2 * scale },
  ];
}

/**
 * Dibuja las farolas de hierro con sus faroles.
 * @param ctx Contexto de dibujo.
 * @param lit Encendido de 0 (apagadas) a 1 (de noche).
 */
export function drawLamps(ctx: RenderContext, lit: number): void {
  for (const lamp of LAMPS) {
    const scale = lamp.height / 30;
    const poleWidth = Math.max(1, Math.round(2 * scale));
    const top = lamp.baseY - lamp.height;
    fillPixelRect(
      ctx,
      lamp.x - Math.round(2 * scale),
      lamp.baseY - Math.round(3 * scale),
      poleWidth + Math.round(4 * scale),
      Math.round(3 * scale),
      COLORS.ironLight,
    );
    fillPixelRect(ctx, lamp.x, top, poleWidth, lamp.height, COLORS.iron);
    const lanterns = lanternPositions(lamp);
    if (lanterns.length > 1) {
      fillPixelRect(
        ctx,
        lamp.x - Math.round(5 * scale),
        top + Math.round(4 * scale),
        Math.round(10 * scale) + poleWidth,
        1,
        COLORS.iron,
      );
    }
    for (const lantern of lanterns) {
      const size = Math.max(2, Math.round(3 * scale));
      if (lit > 0) {
        fillCircle(ctx, lantern.x, lantern.y, size * 3, withAlpha(COLORS.glow, 0.18 * lit));
        fillCircle(ctx, lantern.x, lantern.y, size * 1.6, withAlpha(COLORS.glow, 0.3 * lit));
      }
      fillPixelRect(ctx, lantern.x - size / 2, lantern.y - size / 2 - 1, size + 1, 1, COLORS.iron);
      fillPixelRect(
        ctx,
        lantern.x - size / 2,
        lantern.y - size / 2,
        size + 1,
        size,
        lit > 0.3 ? COLORS.glow : COLORS.glass,
      );
    }
  }
}
