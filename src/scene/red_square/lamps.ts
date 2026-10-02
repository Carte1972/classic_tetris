import type { RenderContext } from '../../render/render_context';
import { fillCircle, fillPixelRect, withAlpha } from '../pixel_shapes';

/** Farola: columna de la base, fila del suelo y altura. */
export interface Lamp {
  readonly x: number;
  readonly baseY: number;
  readonly height: number;
}

/** Farolas de la plaza: a lo largo del césped de la muralla y delante de San Basilio. */
export const LAMPS: readonly Lamp[] = [
  { x: 284, baseY: 275, height: 12 },
  { x: 256, baseY: 279, height: 16 },
  { x: 222, baseY: 284, height: 22 },
  { x: 178, baseY: 291, height: 30 },
  { x: 118, baseY: 303, height: 42 },
  { x: 36, baseY: 320, height: 62 },
  { x: 424, baseY: 338, height: 54 },
  { x: 620, baseY: 352, height: 70 },
];

/** Colores de las farolas. */
const COLORS = {
  iron: '#1f2028',
  ironLight: '#3a3c48',
  glass: '#d8cc96',
  glow: '#ffd77a',
} as const;

/** Altura de referencia de una farola (las medidas de sus piezas escalan con ella). */
const REFERENCE_HEIGHT = 30;

/** Altura mínima para que una farola lleve tres faroles (las lejanas llevan uno). */
const THREE_LANTERNS_FROM = 20;

/**
 * Posiciones de los faroles de una farola (centro de cada farol).
 * @param lamp Farola.
 * @returns Centros de los faroles.
 */
function lanternPositions(lamp: Lamp): { x: number; y: number }[] {
  const scale = lamp.height / REFERENCE_HEIGHT;
  const top = lamp.baseY - lamp.height;
  if (lamp.height < THREE_LANTERNS_FROM) {
    return [{ x: lamp.x, y: top - 2 * scale }];
  }
  return [
    { x: lamp.x - 5 * scale, y: top + 2 * scale },
    { x: lamp.x, y: top - 3 * scale },
    { x: lamp.x + 5 * scale, y: top + 2 * scale },
  ];
}

/**
 * Dibuja una farola de hierro con sus faroles y, de noche, su halo de luz.
 * @param ctx Contexto de dibujo.
 * @param lamp Farola.
 * @param lit Encendido de 0 (apagada) a 1 (de noche).
 */
export function drawLamp(ctx: RenderContext, lamp: Lamp, lit: number): void {
  const scale = lamp.height / REFERENCE_HEIGHT;
  const poleWidth = Math.max(1, Math.round(1.5 * scale));
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
      Math.max(1, Math.round(scale * 0.6)),
      COLORS.iron,
    );
  }
  for (const lantern of lanterns) {
    const size = Math.max(2, Math.round(3 * scale));
    if (lit > 0) {
      fillCircle(ctx, lantern.x, lantern.y, size * 3, withAlpha(COLORS.glow, 0.16 * lit));
      fillCircle(ctx, lantern.x, lantern.y, size * 1.6, withAlpha(COLORS.glow, 0.28 * lit));
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
