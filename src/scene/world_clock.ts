import {
  CLOUDY_OVERCAST,
  DAY_CYCLE_MS,
  DAY_PHASES,
  INITIAL_WEATHER,
  OVERCAST_SKY,
  OVERCAST_SKY_BLEND,
  SKY_COLORS,
  SNOW_ACCUMULATION_PER_S,
  SNOW_MELT_PER_S,
  START_TIME_OF_DAY,
  WEATHER_FADE_MS,
  WEATHER_MAX_MS,
  WEATHER_MIN_MS,
  WEATHER_WEIGHTS,
  WETNESS_DRY_PER_S,
  WETNESS_GAIN_PER_S,
  type WeatherKind,
} from '../config/scene_config';
import { nextRandom, normalizeSeed } from '../engine/random';
import { mixColors } from './pixel_shapes';

/** Milisegundos por segundo. */
const MS_PER_SECOND = 1000;

/** Tipos de tiempo en orden fijo (para el sorteo). */
const WEATHER_KINDS: readonly WeatherKind[] = ['clear', 'cloudy', 'rain', 'snow'];

/** Estado del mundo de fondo: hora, tiempo atmosférico y sus efectos acumulados. */
export interface WorldState {
  /** Tiempo transcurrido desde el inicio (ms). */
  readonly elapsedMs: number;
  readonly weather: WeatherKind;
  /** Tiempo que lleva el tiempo actual (ms). */
  readonly weatherElapsedMs: number;
  /** Duración total del tiempo actual (ms). */
  readonly weatherDurationMs: number;
  /** Nieve acumulada en tejados y suelo, de 0 a 1. */
  readonly snowCover: number;
  /** Humedad del suelo (charcos), de 0 a 1. */
  readonly wetness: number;
  /**
   * Tiempo pedido por un evento de la plaza para cuando acabe el actual (en vez de
   * sortearlo), o `null`.
   */
  readonly pendingWeather: { readonly kind: WeatherKind; readonly durationMs: number } | null;
  /** Estado del generador pseudoaleatorio. */
  readonly rngState: number;
}

/** Colores del cielo en un momento. */
export interface SkyColors {
  readonly top: string;
  readonly bottom: string;
}

/**
 * Crea el mundo al empezar: por la mañana y despejado.
 * @param seed Semilla del tiempo atmosférico.
 * @returns Estado inicial del mundo.
 */
export function createWorld(seed: number): WorldState {
  const roll = nextRandom(normalizeSeed(seed));
  return {
    elapsedMs: 0,
    weather: INITIAL_WEATHER,
    weatherElapsedMs: 0,
    weatherDurationMs: WEATHER_MIN_MS + roll.value * (WEATHER_MAX_MS - WEATHER_MIN_MS),
    snowCover: 0,
    wetness: 0,
    pendingWeather: null,
    rngState: roll.state,
  };
}

/**
 * Pide un tiempo atmosférico durante un rato (lo usan los eventos de la plaza): si ya
 * hace ese tiempo, se alarga; si no, el actual amaina y después llega el pedido.
 * @param world Estado actual.
 * @param kind Tiempo pedido.
 * @param holdMs Tiempo mínimo que debe durar a partir de ahora (ms).
 * @returns Nuevo estado.
 */
export function requestWeather(world: WorldState, kind: WeatherKind, holdMs: number): WorldState {
  if (world.weather === kind) {
    return {
      ...world,
      weatherDurationMs: Math.max(
        world.weatherDurationMs,
        world.weatherElapsedMs + holdMs + WEATHER_FADE_MS,
      ),
      pendingWeather: null,
    };
  }
  return {
    ...world,
    weatherDurationMs: Math.min(world.weatherDurationMs, world.weatherElapsedMs + WEATHER_FADE_MS),
    pendingWeather: { kind, durationMs: holdMs + WEATHER_FADE_MS },
  };
}

/**
 * Elige el siguiente tiempo atmosférico (distinto del actual) según sus pesos.
 * @param current Tiempo actual.
 * @param value Número aleatorio en [0, 1).
 * @returns El nuevo tiempo.
 */
export function pickNextWeather(current: WeatherKind, value: number): WeatherKind {
  const candidates = WEATHER_KINDS.filter((kind) => kind !== current);
  const total = candidates.reduce((sum, kind) => sum + WEATHER_WEIGHTS[kind], 0);
  let threshold = value * total;
  for (const kind of candidates) {
    threshold -= WEATHER_WEIGHTS[kind];
    if (threshold < 0) {
      return kind;
    }
  }
  return candidates[candidates.length - 1] ?? current;
}

/**
 * Intensidad del tiempo actual, de 0 a 1: sube al empezar y baja al acabar.
 * @param world Estado del mundo.
 * @returns Intensidad.
 */
export function getWeatherIntensity(world: WorldState): number {
  const fadeIn = world.weatherElapsedMs / WEATHER_FADE_MS;
  const fadeOut = (world.weatherDurationMs - world.weatherElapsedMs) / WEATHER_FADE_MS;
  return Math.max(0, Math.min(1, fadeIn, fadeOut));
}

/**
 * Avanza el mundo: hora, cambios de tiempo, nieve acumulada y charcos.
 * @param world Estado actual.
 * @param dtMs Tiempo transcurrido.
 * @returns Nuevo estado.
 */
export function advanceWorld(world: WorldState, dtMs: number): WorldState {
  const dt = Math.max(0, dtMs);
  let state: WorldState = { ...world, elapsedMs: world.elapsedMs + dt };
  let weatherElapsedMs = world.weatherElapsedMs + dt;
  while (weatherElapsedMs >= state.weatherDurationMs) {
    weatherElapsedMs -= state.weatherDurationMs;
    const kindRoll = nextRandom(state.rngState);
    const durationRoll = nextRandom(kindRoll.state);
    const pending = state.pendingWeather;
    state = {
      ...state,
      weather: pending?.kind ?? pickNextWeather(state.weather, kindRoll.value),
      weatherDurationMs:
        pending?.durationMs ??
        WEATHER_MIN_MS + durationRoll.value * (WEATHER_MAX_MS - WEATHER_MIN_MS),
      pendingWeather: null,
      rngState: durationRoll.state,
    };
  }
  state = { ...state, weatherElapsedMs };
  const seconds = dt / MS_PER_SECOND;
  const intensity = getWeatherIntensity(state);
  const snowing = state.weather === 'snow' ? intensity : 0;
  const raining = state.weather === 'rain' ? intensity : 0;
  return {
    ...state,
    snowCover: clamp01(
      state.snowCover +
        seconds * (SNOW_ACCUMULATION_PER_S * snowing - SNOW_MELT_PER_S * (1 - snowing)),
    ),
    wetness: clamp01(
      state.wetness + seconds * (WETNESS_GAIN_PER_S * raining - WETNESS_DRY_PER_S * (1 - raining)),
    ),
  };
}

/**
 * Momento del día, de 0 (medianoche) a 1.
 * @param world Estado del mundo.
 * @returns Fracción del día.
 */
export function getTimeOfDay(world: WorldState): number {
  return (START_TIME_OF_DAY + world.elapsedMs / DAY_CYCLE_MS) % 1;
}

/**
 * Luz del día: 0 de noche, 1 de día y transición suave al amanecer y al atardecer.
 * @param timeOfDay Momento del día (0–1).
 * @returns Nivel de luz.
 */
export function getDaylight(timeOfDay: number): number {
  const { dawnStart, dayStart, duskStart, nightStart } = DAY_PHASES;
  if (timeOfDay < dawnStart || timeOfDay >= nightStart) {
    return 0;
  }
  if (timeOfDay < dayStart) {
    return (timeOfDay - dawnStart) / (dayStart - dawnStart);
  }
  if (timeOfDay < duskStart) {
    return 1;
  }
  return 1 - (timeOfDay - duskStart) / (nightStart - duskStart);
}

/**
 * Colores del cielo según la hora y lo cubierto que esté.
 * @param timeOfDay Momento del día (0–1).
 * @param overcast Cielo cubierto, de 0 (despejado) a 1 (lluvia o nieve).
 * @returns Colores de arriba y abajo.
 */
export function getSkyColors(timeOfDay: number, overcast: number): SkyColors {
  const { dawnStart, dayStart, duskStart, nightStart } = DAY_PHASES;
  const blend = (from: SkyColors, to: SkyColors, t: number): SkyColors => ({
    top: mixColors(from.top, to.top, t),
    bottom: mixColors(from.bottom, to.bottom, t),
  });
  const dawnMid = (dawnStart + dayStart) / 2;
  const duskMid = (duskStart + nightStart) / 2;
  let base: SkyColors;
  if (timeOfDay < dawnStart || timeOfDay >= nightStart) {
    base = SKY_COLORS.night;
  } else if (timeOfDay < dawnMid) {
    base = blend(
      SKY_COLORS.night,
      SKY_COLORS.dawn,
      (timeOfDay - dawnStart) / (dawnMid - dawnStart),
    );
  } else if (timeOfDay < dayStart) {
    base = blend(SKY_COLORS.dawn, SKY_COLORS.day, (timeOfDay - dawnMid) / (dayStart - dawnMid));
  } else if (timeOfDay < duskStart) {
    base = SKY_COLORS.day;
  } else if (timeOfDay < duskMid) {
    base = blend(SKY_COLORS.day, SKY_COLORS.dusk, (timeOfDay - duskStart) / (duskMid - duskStart));
  } else {
    base = blend(SKY_COLORS.dusk, SKY_COLORS.night, (timeOfDay - duskMid) / (nightStart - duskMid));
  }
  const daylight = getDaylight(timeOfDay);
  return blend(
    base,
    blend(SKY_COLORS.night, OVERCAST_SKY, daylight),
    overcast * OVERCAST_SKY_BLEND,
  );
}

/**
 * Lo cubierto que está el cielo, de 0 a 1.
 * @param world Estado del mundo.
 * @returns Nivel de nubosidad.
 */
export function getOvercast(world: WorldState): number {
  const intensity = getWeatherIntensity(world);
  switch (world.weather) {
    case 'clear':
      return 0;
    case 'cloudy':
      return CLOUDY_OVERCAST * intensity;
    case 'rain':
    case 'snow':
      return intensity;
  }
}

/**
 * Limita un valor a [0, 1].
 * @param value Valor.
 * @returns Valor limitado.
 */
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
