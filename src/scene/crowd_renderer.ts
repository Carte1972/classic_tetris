import type { RenderContext } from '../render/render_context';
import { depthScale, type CrowdState, type Pigeon, type Walker, type WalkerKind } from './crowd';
import { fillCircle, fillEllipse, fillPixelRect, mixColors } from './pixel_shapes';

/** Colores de piel posibles. */
const SKIN = ['#f1c7a0', '#d9a57c', '#a8724f', '#f3d2b4'] as const;

/** Paletas de ropa por tipo de paseante: [abrigo o vestido, piernas, gorro]. */
const OUTFITS: Readonly<Record<WalkerKind, readonly (readonly [string, string, string])[]>> = {
  coat: [
    ['#3b3f52', '#1f2129', '#5b4a3a'],
    ['#5a3a2a', '#24201e', '#2c2c34'],
    ['#2f4a3a', '#1c1f22', '#6b5a48'],
    ['#4a4a55', '#222', '#8a7058'],
  ],
  woman: [
    ['#b23a4a', '#2a2228', '#e8d27a'],
    ['#3a5aa0', '#25222a', '#e45a6a'],
    ['#6a3a7a', '#221c26', '#f2f2f2'],
    ['#2f7a6a', '#1e2226', '#d94a3a'],
  ],
  child: [
    ['#e2623a', '#2a3a6a', '#3a8adf'],
    ['#f2c23a', '#3a2a2a', '#d23a4a'],
    ['#4ab06a', '#2a2a3a', '#f2f2f2'],
    ['#d94a8a', '#2a2a3a', '#4a6ad0'],
  ],
  tourist: [
    ['#e8e2d0', '#4a5a7a', '#c23a3a'],
    ['#f29a3a', '#3a4a5a', '#2f2f2f'],
    ['#7ac0e8', '#5a4a3a', '#f2d23a'],
    ['#c8d84a', '#3a3a4a', '#e8e8e8'],
  ],
};

/** Altura de un adulto en la fila más cercana (px). */
const ADULT_HEIGHT = 22;

/** Proporción de altura de un niño respecto a un adulto. */
const CHILD_RATIO = 0.62;

/** Colores del paraguas. */
const UMBRELLAS = ['#c23a3a', '#2a3a6a', '#2f2f36', '#3a7a4a'] as const;

/** Colores de las palomas. */
const PIGEON_COLORS = { body: '#8a8c98', wing: '#6a6c78', neck: '#5a7a72' } as const;

/** Ajustes de luz y tiempo para dibujar a la gente. */
export interface CrowdLighting {
  /** Luz del día (0 noche, 1 día): oscurece a la gente de noche. */
  readonly daylight: number;
  /** Color hacia el que se oscurece de noche. */
  readonly nightColor: string;
  /** Si llueve lo bastante como para abrir el paraguas. */
  readonly umbrellas: boolean;
}

/**
 * Dibuja un paseante con su ciclo de pasos.
 * @param ctx Contexto de dibujo.
 * @param walker Paseante.
 * @param lighting Luz y tiempo.
 */
function drawWalker(ctx: RenderContext, walker: Walker, lighting: CrowdLighting): void {
  const scale = depthScale(walker.y);
  const height = Math.max(
    5,
    Math.round(ADULT_HEIGHT * scale * (walker.kind === 'child' ? CHILD_RATIO : 1)),
  );
  const shade = (color: string): string =>
    mixColors(color, lighting.nightColor, (1 - lighting.daylight) * 0.6);
  const outfit = OUTFITS[walker.kind][walker.palette % 4] ??
    OUTFITS.coat[0] ?? ['#444', '#222', '#666'];
  const [clothes, legs, hat] = outfit.map(shade);
  const skin = shade(SKIN[walker.palette % SKIN.length] ?? SKIN[0]);
  const x = Math.round(walker.x);
  const feet = walker.y;
  const width = Math.max(2, Math.round(height * 0.32));
  const headRadius = Math.max(1, height * 0.11);
  const stride = Math.round(Math.sin(walker.distance * 0.9) * Math.max(1, height * 0.12));
  const legTop = feet - Math.round(height * 0.32);
  // Piernas alternas.
  fillPixelRect(
    ctx,
    x - Math.ceil(width / 4) + stride,
    legTop,
    Math.max(1, Math.floor(width / 3)),
    feet - legTop,
    legs ?? '#222',
  );
  fillPixelRect(
    ctx,
    x + Math.floor(width / 6) - stride,
    legTop,
    Math.max(1, Math.floor(width / 3)),
    feet - legTop,
    legs ?? '#222',
  );
  // Cuerpo (abrigo largo o vestido con vuelo).
  const bodyTop = feet - Math.round(height * 0.78);
  const flare = walker.kind === 'woman' ? Math.max(1, Math.round(width * 0.25)) : 0;
  fillPixelRect(
    ctx,
    x - Math.floor(width / 2),
    bodyTop,
    width,
    legTop - bodyTop + 1,
    clothes ?? '#444',
  );
  if (flare > 0) {
    fillPixelRect(
      ctx,
      x - Math.floor(width / 2) - flare,
      legTop - Math.round(height * 0.12),
      width + flare * 2,
      Math.round(height * 0.12) + 1,
      clothes ?? '#444',
    );
  }
  if (walker.kind === 'tourist') {
    fillPixelRect(
      ctx,
      x - walker.direction * Math.ceil(width / 2) - (walker.direction === 1 ? 1 : 0),
      bodyTop + 1,
      Math.max(1, Math.round(width * 0.4)),
      Math.round(height * 0.3),
      hat ?? '#a33',
    );
  }
  // Cabeza y gorro (ushanka, pañuelo o gorra).
  const headY = bodyTop - headRadius;
  fillCircle(ctx, x, headY, headRadius, skin);
  fillPixelRect(
    ctx,
    x - Math.ceil(headRadius),
    Math.round(headY - headRadius),
    Math.ceil(headRadius) * 2 + 1,
    Math.max(1, Math.round(headRadius)),
    hat ?? '#555',
  );
  // Paraguas abierto cuando llueve.
  if (lighting.umbrellas && walker.kind !== 'child') {
    const umbrellaY = headY - headRadius - Math.max(2, height * 0.12);
    fillPixelRect(ctx, x, Math.round(umbrellaY), 1, Math.round(headY - umbrellaY), '#2a2a2a');
    fillEllipse(
      ctx,
      x,
      umbrellaY,
      Math.max(3, height * 0.38),
      Math.max(1, height * 0.12),
      shade(UMBRELLAS[walker.palette % UMBRELLAS.length] ?? UMBRELLAS[0]),
    );
  }
}

/**
 * Dibuja una paloma posada (picoteando) o volando (batiendo las alas).
 * @param ctx Contexto de dibujo.
 * @param pigeon Paloma.
 * @param timeMs Tiempo de la escena (para la animación).
 * @param lighting Luz y tiempo.
 */
function drawPigeon(
  ctx: RenderContext,
  pigeon: Pigeon,
  timeMs: number,
  lighting: CrowdLighting,
): void {
  const shade = (color: string): string =>
    mixColors(color, lighting.nightColor, (1 - lighting.daylight) * 0.6);
  const x = Math.round(pigeon.x);
  const y = Math.round(pigeon.y);
  if (pigeon.flying) {
    const flap = Math.floor(timeMs / 120) % 2 === 0;
    fillPixelRect(ctx, x - 1, y, 3, 1, shade(PIGEON_COLORS.body));
    fillPixelRect(ctx, x - 3, flap ? y - 1 : y + 1, 2, 1, shade(PIGEON_COLORS.wing));
    fillPixelRect(ctx, x + 2, flap ? y - 1 : y + 1, 2, 1, shade(PIGEON_COLORS.wing));
    return;
  }
  const peck = Math.floor((timeMs + x * 37) / 400) % 3 === 0 ? 1 : 0;
  fillPixelRect(ctx, x - 1, y - 2, 3, 2, shade(PIGEON_COLORS.body));
  fillPixelRect(ctx, x + pigeon.direction, y - 3 + peck, 1, 1, shade(PIGEON_COLORS.neck));
}

/**
 * Dibuja la gente y las palomas, de lejos a cerca.
 * @param ctx Contexto de dibujo.
 * @param crowd Estado de la plaza.
 * @param timeMs Tiempo de la escena.
 * @param lighting Luz y tiempo.
 */
export function drawCrowd(
  ctx: RenderContext,
  crowd: CrowdState,
  timeMs: number,
  lighting: CrowdLighting,
): void {
  const items: { y: number; draw: () => void }[] = [
    ...crowd.walkers.map((walker) => ({
      y: walker.y,
      draw: () => drawWalker(ctx, walker, lighting),
    })),
    ...crowd.pigeons
      .filter((pigeon) => !pigeon.flying)
      .map((pigeon) => ({ y: pigeon.y, draw: () => drawPigeon(ctx, pigeon, timeMs, lighting) })),
  ];
  items.sort((a, b) => a.y - b.y).forEach((item) => item.draw());
  crowd.pigeons
    .filter((pigeon) => pigeon.flying)
    .forEach((pigeon) => drawPigeon(ctx, pigeon, timeMs, lighting));
}
