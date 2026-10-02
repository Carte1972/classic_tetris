import { DAY_CYCLE_MS, SCENE_HEIGHT, SCENE_WIDTH, type WeatherKind } from '../config/scene_config';
import type { RenderContext } from '../render/render_context';
import { advanceCrowd, createCrowd, type CrowdState } from './crowd';
import { drawCrowd } from './crowd_renderer';
import { drawLine, fillEllipse, fillPixelRect, withAlpha } from './pixel_shapes';
import { createGround } from './red_square/ground';
import { createGum } from './red_square/gum';
import { createKremlin, drawClockHands } from './red_square/kremlin';
import { drawLamps } from './red_square/lamps';
import { createHistoricalMuseum } from './red_square/museum';
import { createStBasil } from './red_square/st_basil';
import type { SceneryPiece } from './scenery';
import { createSkyLayout, drawSky, type SkyLayout } from './sky';
import { drawWeatherParticles } from './weather_particles';
import {
  advanceWorld,
  createWorld,
  getDaylight,
  getOvercast,
  getSkyColors,
  getTimeOfDay,
  getWeatherIntensity,
  type WorldState,
} from './world_clock';

/** Contexto de la capa de fondo en pantalla. */
export type SceneContext = RenderContext &
  Pick<CanvasRenderingContext2D, 'drawImage' | 'globalAlpha'>;

/** Contexto de una capa en caché (permite tintar solo lo ya dibujado). */
export type LayerContext = RenderContext &
  Pick<CanvasRenderingContext2D, 'globalCompositeOperation'>;

/** Capa en caché: lienzo y su contexto. */
export interface SceneLayer {
  readonly canvas: CanvasImageSource;
  readonly context: LayerContext;
}

/** Fabrica una capa del tamaño de la escena (inyectable para tests). */
export type LayerFactory = (width: number, height: number) => SceneLayer;

/** Escena de fondo animada. */
export interface BackgroundScene {
  /** Avanza el tiempo de la escena (hora, tiempo atmosférico y gente). */
  readonly advance: (dtMs: number) => void;
  /** Dibuja el fotograma actual. */
  readonly draw: (ctx: SceneContext) => void;
  /** Fija la hora y el tiempo (modo test y capturas). */
  readonly setConditions: (conditions: SceneConditions) => void;
}

/** Condiciones que se pueden fijar desde el modo test. */
export interface SceneConditions {
  /** Momento del día (0–1). */
  readonly timeOfDay?: number;
  readonly weather?: WeatherKind;
  /** Nieve acumulada (0–1). */
  readonly snowCover?: number;
  /** Humedad del suelo (0–1). */
  readonly wetness?: number;
}

/** Color del tinte nocturno de los edificios. */
const NIGHT_TINT = '#0a0f2e';

/** Opacidad del tinte nocturno. */
const NIGHT_TINT_ALPHA = 0.68;

/** Color de las ventanas encendidas. */
const WINDOW_LIGHT = '#ffd978';

/** Color de la nieve acumulada. */
const SNOW_COLOR = '#f4f7ff';

/** Opacidad máxima de la nieve sobre el suelo. */
const GROUND_SNOW_ALPHA = 0.7;

/**
 * Tiñe todo lo dibujado en una capa de un color (sin tocar lo transparente).
 * @param context Contexto de la capa.
 * @param color Color del tinte (puede llevar transparencia).
 */
function tintLayer(context: LayerContext, color: string): void {
  context.globalCompositeOperation = 'source-atop';
  context.fillStyle = color;
  context.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
  context.globalCompositeOperation = 'source-over';
}

/** Charcos: centro y semiejes. */
const PUDDLES = [
  { x: 120, y: 140, rx: 14, ry: 2 },
  { x: 205, y: 152, rx: 20, ry: 3 },
  { x: 70, y: 166, rx: 24, ry: 3 },
  { x: 268, y: 172, rx: 18, ry: 3 },
] as const;

/** Proporción de ventanas que se encienden de noche. */
const LIT_WINDOW_RATIO = 0.7;

/** Opacidad y color del velo gris cuando el cielo está cubierto. */
const OVERCAST_DIM = 0.22;
const OVERCAST_DIM_COLOR = '#2a3140';

/** Tiempo fijado desde el modo test: ya establecido y sin cambiar durante 10 minutos. */
const FIXED_WEATHER = { elapsedMs: 10_000, durationMs: 600_000 } as const;

/**
 * Indica si una ventana se enciende de noche (reparto estable).
 * @param index Índice de la ventana.
 * @returns `true` si se enciende.
 */
function isWindowLit(index: number): boolean {
  const value = Math.sin(index * 91.7) * 1000;
  return value - Math.floor(value) < LIT_WINDOW_RATIO;
}

/**
 * Crea la escena de la Plaza Roja.
 * @param seed Semilla de la gente, las nubes y el tiempo.
 * @param createLayer Fabrica de capas en caché.
 * @returns La escena.
 */
export function createRedSquareScene(seed: number, createLayer: LayerFactory): BackgroundScene {
  const pieces: readonly SceneryPiece[] = [
    createGround(),
    createKremlin(),
    createStBasil(),
    createGum(),
    createHistoricalMuseum(),
  ];
  const sky: SkyLayout = createSkyLayout(seed);
  let world: WorldState = createWorld(seed);
  let crowd: CrowdState = createCrowd(seed);

  const dayLayer = createLayer(SCENE_WIDTH, SCENE_HEIGHT);
  const nightLayer = createLayer(SCENE_WIDTH, SCENE_HEIGHT);
  const snowLayer = createLayer(SCENE_WIDTH, SCENE_HEIGHT);
  pieces.forEach((piece) => piece.draw(dayLayer.context));
  pieces.forEach((piece) => piece.draw(nightLayer.context));
  tintLayer(nightLayer.context, withAlpha(NIGHT_TINT, NIGHT_TINT_ALPHA));
  // Nieve del suelo: el suelo en blanco, recortando la silueta de los edificios.
  const [ground, ...buildings] = pieces;
  ground?.draw(snowLayer.context);
  tintLayer(snowLayer.context, SNOW_COLOR);
  snowLayer.context.globalCompositeOperation = 'destination-out';
  buildings.forEach((piece) => piece.draw(snowLayer.context));
  snowLayer.context.globalCompositeOperation = 'source-over';
  const windows = pieces.flatMap((piece) => piece.windows);
  const roofs = pieces.flatMap((piece) => piece.roofs);

  return {
    advance: (dtMs) => {
      world = advanceWorld(world, dtMs);
      crowd = advanceCrowd(crowd, dtMs);
    },
    setConditions: (conditions) => {
      if (conditions.timeOfDay !== undefined) {
        const delta = (conditions.timeOfDay - getTimeOfDay(world) + 1) % 1;
        world = { ...world, elapsedMs: world.elapsedMs + delta * DAY_CYCLE_MS };
      }
      if (conditions.weather !== undefined) {
        world = {
          ...world,
          weather: conditions.weather,
          weatherElapsedMs: FIXED_WEATHER.elapsedMs,
          weatherDurationMs: FIXED_WEATHER.durationMs,
        };
      }
      world = {
        ...world,
        snowCover: conditions.snowCover ?? world.snowCover,
        wetness: conditions.wetness ?? world.wetness,
      };
    },
    draw: (ctx) => {
      const timeMs = world.elapsedMs;
      const timeOfDay = getTimeOfDay(world);
      const daylight = getDaylight(timeOfDay);
      const overcast = getOvercast(world);
      const intensity = getWeatherIntensity(world);
      const night = 1 - daylight;

      drawSky(ctx, sky, {
        colors: getSkyColors(timeOfDay, overcast),
        timeOfDay,
        daylight,
        overcast,
        timeMs,
      });
      ctx.drawImage(dayLayer.canvas, 0, 0);
      if (night > 0) {
        ctx.globalAlpha = night;
        ctx.drawImage(nightLayer.canvas, 0, 0);
        ctx.globalAlpha = 1;
      }
      if (night > 0.2) {
        windows.forEach((rect, index) => {
          if (isWindowLit(index)) {
            fillPixelRect(
              ctx,
              rect.x,
              rect.y,
              rect.width,
              rect.height,
              withAlpha(WINDOW_LIGHT, Math.min(1, (night - 0.2) * 1.4)),
            );
          }
        });
      }
      drawClockHands(ctx, timeOfDay, (c, from, to, color) => drawLine(c, from, to, 1, color));
      if (world.snowCover > 0) {
        ctx.globalAlpha = world.snowCover * GROUND_SNOW_ALPHA;
        ctx.drawImage(snowLayer.canvas, 0, 0);
        ctx.globalAlpha = 1;
        roofs.forEach((roof) => {
          const thickness = Math.max(1, Math.round(roof.thickness * world.snowCover + 0.4));
          const alpha = Math.min(1, world.snowCover * 1.5);
          drawLine(ctx, roof.from, roof.to, thickness, withAlpha(SNOW_COLOR, alpha));
        });
      }
      if (world.wetness > 0) {
        const reflection = getSkyColors(timeOfDay, overcast).bottom;
        PUDDLES.forEach((puddle) =>
          fillEllipse(
            ctx,
            puddle.x,
            puddle.y,
            puddle.rx,
            puddle.ry,
            withAlpha(reflection, world.wetness * 0.55),
          ),
        );
      }
      drawCrowd(ctx, crowd, timeMs, {
        daylight,
        nightColor: NIGHT_TINT,
        umbrellas: world.weather === 'rain' && intensity > 0.3,
      });
      drawLamps(ctx, Math.min(1, night * 1.5));
      if (overcast > 0) {
        fillPixelRect(
          ctx,
          0,
          0,
          SCENE_WIDTH,
          SCENE_HEIGHT,
          withAlpha(OVERCAST_DIM_COLOR, overcast * OVERCAST_DIM * daylight),
        );
      }
      drawWeatherParticles(ctx, world.weather, intensity, timeMs);
    },
  };
}
