import {
  DAY_CYCLE_MS,
  FRONT_LINE_Y,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type WeatherKind,
} from '../config/scene_config';
import {
  EVENT_FADE_MS,
  FORCED_EVENT_MS,
  PLAZA_EVENT_RULES,
  type PlazaEventKind,
} from '../config/plaza_events_config';
import type { RenderContext } from '../render/render_context';
import { sortByDepth, type SceneActor } from './actors';
import {
  advanceEventSchedule,
  createEventSchedule,
  getEventPresence,
  startEvent,
  startNormalLife,
  type EventSchedule,
} from './events/event_schedule';
import type { EventFrame, PlazaEvent } from './events/event_types';
import { PLAZA_EVENTS } from './events/plaza_events';
import { advanceCrowd, createCrowd, type CrowdState } from './crowd';
import { crowdActors } from './crowd_renderer';
import { drawLine, fillEllipse, fillPixelRect, withAlpha } from './pixel_shapes';
import { createGround } from './red_square/ground';
import { createGum } from './red_square/gum';
import { createKremlin, drawClockHands } from './red_square/kremlin';
import { LAMPS, drawLamp } from './red_square/lamps';
import { createHistoricalMuseum } from './red_square/museum';
import { createStBasil } from './red_square/st_basil';
import type { PixelRect, RoofLine, SceneryPiece } from './scenery';
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
  requestWeather,
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
  /** Evento que ocupa la plaza (`null` para volver a la vida normal). */
  readonly event?: PlazaEventKind | null;
  /** Tiempo que lleva el evento fijado (ms). */
  readonly eventElapsedMs?: number;
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
  { x: 240, y: 290, rx: 22, ry: 2 },
  { x: 380, y: 300, rx: 30, ry: 3 },
  { x: 150, y: 330, rx: 40, ry: 4 },
  { x: 560, y: 344, rx: 36, ry: 4 },
  { x: 330, y: 350, rx: 48, ry: 5 },
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

/** Edificios cacheados juntos en capas de día y de noche. */
interface SceneryGroup {
  readonly day: SceneLayer;
  readonly night: SceneLayer;
  readonly windows: readonly PixelRect[];
  readonly roofs: readonly RoofLine[];
}

/**
 * Pinta un grupo de edificios en sus capas de día y de noche.
 * @param pieces Elementos del grupo.
 * @param createLayer Fabrica de capas.
 * @returns El grupo con sus capas, ventanas y tejados.
 */
function createGroup(pieces: readonly SceneryPiece[], createLayer: LayerFactory): SceneryGroup {
  const day = createLayer(SCENE_WIDTH, SCENE_HEIGHT);
  const night = createLayer(SCENE_WIDTH, SCENE_HEIGHT);
  pieces.forEach((piece) => piece.draw(day.context));
  pieces.forEach((piece) => piece.draw(night.context));
  tintLayer(night.context, withAlpha(NIGHT_TINT, NIGHT_TINT_ALPHA));
  return {
    day,
    night,
    windows: pieces.flatMap((piece) => piece.windows),
    roofs: pieces.flatMap((piece) => piece.roofs),
  };
}

/** Luz y nieve de un fotograma para un grupo de edificios. */
interface GroupLight {
  readonly night: number;
  readonly snowCover: number;
  /** Luz de los focos de un evento (0–1), que devuelve sus colores de día. */
  readonly floodlight: number;
}

/**
 * Dibuja un grupo de edificios con la luz del momento: mezcla de las capas de día y
 * noche, ventanas encendidas y nieve en los tejados.
 * @param ctx Contexto de la escena.
 * @param group Grupo.
 * @param light Luz y nieve.
 */
function drawGroup(ctx: SceneContext, group: SceneryGroup, light: GroupLight): void {
  ctx.drawImage(group.day.canvas, 0, 0);
  if (light.night > 0) {
    ctx.globalAlpha = light.night;
    ctx.drawImage(group.night.canvas, 0, 0);
    ctx.globalAlpha = 1;
  }
  if (light.floodlight > 0) {
    ctx.globalAlpha = Math.min(1, light.floodlight);
    ctx.drawImage(group.day.canvas, 0, 0);
    ctx.globalAlpha = 1;
  }
  if (light.night > 0.2) {
    const alpha = Math.min(1, (light.night - 0.2) * 1.4);
    group.windows.forEach((rect, index) => {
      if (isWindowLit(index)) {
        fillPixelRect(ctx, rect.x, rect.y, rect.width, rect.height, withAlpha(WINDOW_LIGHT, alpha));
      }
    });
  }
  drawRoofSnow(ctx, group.roofs, light.snowCover);
}

/**
 * Dibuja la nieve acumulada en los tejados y cornisas.
 * @param ctx Contexto de la escena.
 * @param roofs Bordes de tejados.
 * @param snowCover Nieve acumulada (0–1).
 */
function drawRoofSnow(ctx: SceneContext, roofs: readonly RoofLine[], snowCover: number): void {
  if (snowCover <= 0) {
    return;
  }
  const alpha = Math.min(1, snowCover * 1.5);
  roofs.forEach((roof) => {
    const thickness = Math.max(1, Math.round(roof.thickness * snowCover + 0.4));
    drawLine(ctx, roof.from, roof.to, thickness, withAlpha(SNOW_COLOR, alpha));
  });
}

/**
 * Dibuja una capa de un evento con su presencia como opacidad (para que aparezca y se
 * vaya poco a poco).
 * @param ctx Contexto de la escena.
 * @param frame Fotograma del evento.
 * @param draw Dibujo de la capa, si el evento la tiene.
 */
function withEventAlpha(
  ctx: SceneContext,
  frame: EventFrame,
  draw: ((ctx: RenderContext, frame: EventFrame) => void) | undefined,
): void {
  if (draw === undefined || frame.presence <= 0) {
    return;
  }
  ctx.globalAlpha = frame.presence;
  draw(ctx, frame);
  ctx.globalAlpha = 1;
}

/**
 * Actores de un evento, que se dibujan con su presencia como opacidad.
 * @param event Evento en curso, si hay.
 * @param frame Fotograma del evento.
 * @returns Actores.
 */
function eventActors(event: PlazaEvent | undefined, frame: EventFrame): SceneActor[] {
  if (event === undefined || frame.presence <= 0) {
    return [];
  }
  return event.actors(frame).map((actor) => ({
    y: actor.y,
    draw: (ctx: RenderContext) => {
      const scene = ctx as SceneContext;
      scene.globalAlpha = frame.presence;
      actor.draw(ctx);
      scene.globalAlpha = 1;
    },
  }));
}

/** Paseantes que cuentan para repartir quién se queda durante un evento. */
const WALKER_SLOTS = 20;

/**
 * Durante un evento se quedan solo parte de los paseantes habituales (el resto deja
 * sitio a los figurantes).
 * @param crowd Gente de la plaza.
 * @param schedule Calendario de eventos.
 * @param presence Presencia del evento.
 * @returns Gente que se dibuja.
 */
function keepWalkers(crowd: CrowdState, schedule: EventSchedule, presence: number): CrowdState {
  if (schedule.current === null || presence <= 0) {
    return crowd;
  }
  const share = 1 - presence * (1 - PLAZA_EVENT_RULES[schedule.current].walkers);
  return {
    ...crowd,
    walkers: crowd.walkers.filter((_, i) => (i % WALKER_SLOTS) / WALKER_SLOTS < share),
  };
}

/**
 * Crea la escena de la Plaza Roja vista desde el sur: el Kremlin a la izquierda, San
 * Basilio a la derecha y el Museo Histórico y el GUM al fondo.
 * @param seed Semilla de la gente, las nubes y el tiempo.
 * @param createLayer Fabrica de capas en caché.
 * @returns La escena.
 */
export function createRedSquareScene(seed: number, createLayer: LayerFactory): BackgroundScene {
  const ground = createGround();
  const buildings = [createHistoricalMuseum(), createGum(), createKremlin()];
  const back = createGroup([ground, ...buildings], createLayer);
  // San Basilio va en su propia capa: tapa a quien camina por detrás de ella.
  const front = createGroup([createStBasil()], createLayer);
  const sky: SkyLayout = createSkyLayout(seed);
  let world: WorldState = createWorld(seed);
  let crowd: CrowdState = createCrowd(seed);
  let schedule: EventSchedule = createEventSchedule(seed);

  // Nieve del suelo: el suelo en blanco, recortando la silueta de los edificios.
  const snowLayer = createLayer(SCENE_WIDTH, SCENE_HEIGHT);
  ground.draw(snowLayer.context);
  tintLayer(snowLayer.context, SNOW_COLOR);
  snowLayer.context.globalCompositeOperation = 'destination-out';
  buildings.forEach((piece) => piece.draw(snowLayer.context));
  snowLayer.context.globalCompositeOperation = 'source-over';

  return {
    advance: (dtMs) => {
      world = advanceWorld(world, dtMs);
      crowd = advanceCrowd(crowd, dtMs);
      const step = advanceEventSchedule(schedule, dtMs, getTimeOfDay(world));
      schedule = step.schedule;
      if (step.started !== null) {
        world = requestWeather(world, PLAZA_EVENT_RULES[step.started].weather, schedule.durationMs);
      }
      if (schedule.current !== null) {
        const minimum = PLAZA_EVENT_RULES[schedule.current].snowCover * getEventPresence(schedule);
        world = { ...world, snowCover: Math.max(world.snowCover, minimum) };
      }
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
      if (conditions.event === null) {
        schedule = startNormalLife(schedule);
      } else if (conditions.event !== undefined) {
        schedule = startEvent(
          schedule,
          conditions.event,
          FORCED_EVENT_MS,
          conditions.eventElapsedMs ?? EVENT_FADE_MS,
        );
      }
    },
    draw: (ctx) => {
      const timeMs = world.elapsedMs;
      const timeOfDay = getTimeOfDay(world);
      const daylight = getDaylight(timeOfDay);
      const overcast = getOvercast(world);
      const intensity = getWeatherIntensity(world);
      const night = 1 - daylight;
      const event = schedule.current === null ? undefined : PLAZA_EVENTS[schedule.current];
      const frame: EventFrame = {
        elapsedMs: schedule.elapsedMs,
        durationMs: schedule.durationMs,
        presence: getEventPresence(schedule),
        timeMs,
        night,
      };
      const illumination = event?.illumination?.(frame) ?? { back: 0, front: 0 };

      drawSky(ctx, sky, {
        colors: getSkyColors(timeOfDay, overcast),
        timeOfDay,
        daylight,
        overcast,
        timeMs,
      });
      withEventAlpha(ctx, frame, event?.drawSky);
      drawGroup(ctx, back, {
        night,
        snowCover: 0,
        floodlight: night * illumination.back * frame.presence,
      });
      drawClockHands(ctx, timeOfDay, (c, from, to, color) => drawLine(c, from, to, 1, color));
      if (world.snowCover > 0) {
        ctx.globalAlpha = world.snowCover * GROUND_SNOW_ALPHA;
        ctx.drawImage(snowLayer.canvas, 0, 0);
        ctx.globalAlpha = 1;
        drawRoofSnow(ctx, back.roofs, world.snowCover);
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
      withEventAlpha(ctx, frame, event?.drawBackDecor);
      const lit = Math.min(1, night * 1.5);
      const actors: SceneActor[] = sortByDepth([
        ...eventActors(event, frame),
        ...crowdActors(keepWalkers(crowd, schedule, frame.presence), timeMs, {
          daylight,
          nightColor: NIGHT_TINT,
          umbrellas: world.weather === 'rain' && intensity > 0.3,
        }),
        ...LAMPS.map((lamp) => ({
          y: lamp.baseY,
          draw: (c: RenderContext) => drawLamp(c, lamp, lit),
        })),
      ]);
      actors.filter((actor) => actor.y < FRONT_LINE_Y).forEach((actor) => actor.draw(ctx));
      drawGroup(ctx, front, {
        night,
        snowCover: world.snowCover,
        floodlight: night * illumination.front * frame.presence,
      });
      withEventAlpha(ctx, frame, event?.drawFrontDecor);
      actors.filter((actor) => actor.y >= FRONT_LINE_Y).forEach((actor) => actor.draw(ctx));
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
