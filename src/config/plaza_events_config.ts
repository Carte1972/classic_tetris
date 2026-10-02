import type { WeatherKind } from './scene_config';

/** Eventos típicos que pueden ocupar la Plaza Roja. */
export type PlazaEventKind =
  'parade' | 'easter' | 'christmas' | 'fireworks' | 'maslenitsa' | 'olympics';

/** Momento del día en que puede celebrarse un evento. */
export type EventTime = 'day' | 'night' | 'any';

/** Requisitos de un evento: cuándo se celebra y con qué tiempo. */
export interface PlazaEventRules {
  readonly time: EventTime;
  /** Tiempo atmosférico que se pide mientras dura. */
  readonly weather: WeatherKind;
  /** Nieve mínima en el suelo mientras dura (0 si no hace falta). */
  readonly snowCover: number;
  /** Fracción de los paseantes habituales que siguen en la plaza. */
  readonly walkers: number;
}

/** Requisitos de cada evento. */
export const PLAZA_EVENT_RULES: Readonly<Record<PlazaEventKind, PlazaEventRules>> = {
  parade: { time: 'day', weather: 'clear', snowCover: 0, walkers: 0.1 },
  easter: { time: 'night', weather: 'clear', snowCover: 0, walkers: 0.4 },
  christmas: { time: 'any', weather: 'snow', snowCover: 0.7, walkers: 0.8 },
  fireworks: { time: 'night', weather: 'clear', snowCover: 0, walkers: 0.6 },
  maslenitsa: { time: 'day', weather: 'clear', snowCover: 0.85, walkers: 0.6 },
  olympics: { time: 'day', weather: 'clear', snowCover: 0, walkers: 0.5 },
};

/** Orden base de los eventos (se baraja con la semilla al empezar). */
export const PLAZA_EVENT_KINDS: readonly PlazaEventKind[] = [
  'parade',
  'easter',
  'christmas',
  'fireworks',
  'maslenitsa',
  'olympics',
];

/**
 * Tramos del día (fracción de la vuelta) en que caben los eventos de día y de noche.
 * El de noche cruza la medianoche: su final es mayor que 1.
 */
export const EVENT_WINDOWS: Readonly<Record<'day' | 'night', { from: number; to: number }>> = {
  day: { from: 0.25, to: 0.72 },
  night: { from: 0.76, to: 1.2 },
};

/** Vida normal entre dos eventos (ms). */
export const NORMAL_LIFE_MS = { min: 50_000, max: 70_000 } as const;

/** Duración de un evento (ms); se acorta si se acaba su tramo del día. */
export const EVENT_DURATION_MS = { min: 55_000, max: 80_000 } as const;

/** Duración mínima para que merezca la pena empezar un evento (ms). */
export const EVENT_MIN_MS = 40_000;

/** Vida normal antes del primer evento de la partida (ms). */
export const FIRST_EVENT_DELAY_MS = 20_000;

/** Tiempo que tardan los decorados y figurantes en aparecer o irse (ms). */
export const EVENT_FADE_MS = 5_000;

/** Duración de un evento fijado desde el modo test (ms). */
export const FORCED_EVENT_MS = 600_000;
