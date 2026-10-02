import {
  CLOUD_COUNT,
  DAY_PHASES,
  HORIZON_Y,
  SCENE_WIDTH,
  STAR_COUNT,
} from '../config/scene_config';
import type { RenderContext } from '../render/render_context';
import { nextRandom, normalizeSeed } from '../engine/random';
import { fillCircle, fillEllipse, fillPixelRect, mixColors, withAlpha } from './pixel_shapes';
import type { SkyColors } from './world_clock';

/** Milisegundos por segundo. */
const MS_PER_SECOND = 1000;

/** Altura máxima del sol y la luna sobre el horizonte (px). */
const ARC_HEIGHT = 210;

/** Margen lateral del recorrido del sol y la luna (px). */
const ARC_MARGIN = 48;

/** Colores del sol, la luna y las nubes. */
const COLORS = {
  sun: '#fff2b0',
  sunGlow: '#ffd76a',
  moon: '#eef0f6',
  moonShade: '#b8bccb',
  cloud: '#ffffff',
  cloudGray: '#7d8796',
  star: '#ffffff',
} as const;

/** Estrella del cielo nocturno. */
interface Star {
  readonly x: number;
  readonly y: number;
  readonly phase: number;
}

/** Nube que cruza el cielo. */
interface Cloud {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly speed: number;
}

/** Elementos fijos del cielo generados con la semilla. */
export interface SkyLayout {
  readonly stars: readonly Star[];
  readonly clouds: readonly Cloud[];
}

/**
 * Genera las estrellas y las nubes del cielo.
 * @param seed Semilla.
 * @returns Disposición del cielo.
 */
export function createSkyLayout(seed: number): SkyLayout {
  let state = normalizeSeed(seed);
  const random = (): number => {
    const roll = nextRandom(state);
    state = roll.state;
    return roll.value;
  };
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.floor(random() * SCENE_WIDTH),
    y: Math.floor(random() * (HORIZON_Y - 60)),
    phase: random() * Math.PI * 2,
  }));
  const clouds = Array.from({ length: CLOUD_COUNT }, () => ({
    x: random() * SCENE_WIDTH,
    y: 16 + random() * 100,
    width: 40 + random() * 60,
    speed: 4 + random() * 9,
  }));
  return { stars, clouds };
}

/** Datos del cielo en un fotograma. */
export interface SkyFrame {
  readonly colors: SkyColors;
  readonly timeOfDay: number;
  readonly daylight: number;
  /** Nubosidad (0 despejado, 1 cubierto). */
  readonly overcast: number;
  /** Tiempo de la escena (ms), para mover nubes y hacer titilar estrellas. */
  readonly timeMs: number;
}

/**
 * Dibuja el cielo en franjas de color (degradado pixelado).
 * @param ctx Contexto de dibujo.
 * @param colors Colores de arriba y abajo.
 */
function drawGradient(ctx: RenderContext, colors: SkyColors): void {
  const bandHeight = 8;
  for (let y = 0; y < HORIZON_Y; y += bandHeight) {
    fillPixelRect(
      ctx,
      0,
      y,
      SCENE_WIDTH,
      bandHeight,
      mixColors(colors.top, colors.bottom, y / HORIZON_Y),
    );
  }
}

/**
 * Posición del sol o la luna en su arco sobre el horizonte.
 * @param progress Fracción del recorrido (0 sale, 1 se pone).
 * @returns Coordenadas.
 */
function arcPosition(progress: number): { x: number; y: number } {
  return {
    x: ARC_MARGIN + (SCENE_WIDTH - 2 * ARC_MARGIN) * progress,
    y: HORIZON_Y - Math.sin(progress * Math.PI) * ARC_HEIGHT,
  };
}

/**
 * Dibuja el cielo: degradado, estrellas de noche, sol o luna y nubes en movimiento.
 * @param ctx Contexto de dibujo.
 * @param layout Disposición del cielo.
 * @param frame Datos del fotograma.
 */
export function drawSky(ctx: RenderContext, layout: SkyLayout, frame: SkyFrame): void {
  drawGradient(ctx, frame.colors);
  const night = 1 - frame.daylight;
  const clearSky = 1 - frame.overcast;
  if (night > 0.05) {
    const seconds = frame.timeMs / MS_PER_SECOND;
    for (const star of layout.stars) {
      const twinkle = 0.55 + 0.45 * Math.sin(seconds * 2 + star.phase);
      ctx.fillStyle = withAlpha(COLORS.star, night * clearSky * twinkle);
      ctx.fillRect(star.x, star.y, 1, 1);
    }
  }
  const { dawnStart, nightStart } = DAY_PHASES;
  const dayLength = nightStart - dawnStart;
  const sunProgress = (frame.timeOfDay - dawnStart) / dayLength;
  if (sunProgress > 0 && sunProgress < 1) {
    const sun = arcPosition(sunProgress);
    fillCircle(ctx, sun.x, sun.y, 20, withAlpha(COLORS.sunGlow, 0.22 * clearSky));
    fillCircle(ctx, sun.x, sun.y, 12, withAlpha(COLORS.sun, Math.max(0.15, clearSky)));
  } else {
    const nightProgress = ((frame.timeOfDay - nightStart + 1) % 1) / (1 - dayLength);
    const moon = arcPosition(Math.min(1, Math.max(0, nightProgress)));
    fillCircle(ctx, moon.x, moon.y, 10, withAlpha(COLORS.moon, Math.max(0.2, clearSky)));
    fillCircle(ctx, moon.x + 4, moon.y - 2, 8, withAlpha(COLORS.moonShade, 0.5 * clearSky));
  }
  const cloudColor = mixColors(
    mixColors(COLORS.cloud, COLORS.cloudGray, frame.overcast),
    frame.colors.top,
    night * 0.7,
  );
  const visibleClouds = Math.ceil(layout.clouds.length * (0.35 + 0.65 * frame.overcast));
  layout.clouds.slice(0, visibleClouds).forEach((cloud) => {
    const span = SCENE_WIDTH + cloud.width * 2;
    const x = ((cloud.x + (cloud.speed * frame.timeMs) / MS_PER_SECOND) % span) - cloud.width;
    const w = cloud.width * (1 + frame.overcast * 0.6);
    fillEllipse(ctx, x, cloud.y, w * 0.5, 8 + frame.overcast * 6, cloudColor);
    fillEllipse(ctx, x - w * 0.22, cloud.y + 2, w * 0.3, 6 + frame.overcast * 4, cloudColor);
    fillEllipse(ctx, x + w * 0.18, cloud.y - 4, w * 0.28, 8 + frame.overcast * 4, cloudColor);
  });
}
