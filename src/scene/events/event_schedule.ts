import { DAY_CYCLE_MS } from '../../config/scene_config';
import {
  EVENT_DURATION_MS,
  EVENT_FADE_MS,
  EVENT_MIN_MS,
  EVENT_WINDOWS,
  FIRST_EVENT_DELAY_MS,
  NORMAL_LIFE_MS,
  PLAZA_EVENT_KINDS,
  PLAZA_EVENT_RULES,
  type EventTime,
  type PlazaEventKind,
} from '../../config/plaza_events_config';
import { nextRandom, normalizeSeed } from '../../engine/random';

/** Estado del calendario de eventos de la plaza. */
export interface EventSchedule {
  /** Evento en curso, o `null` durante la vida normal. */
  readonly current: PlazaEventKind | null;
  /** Tiempo que lleva el evento o la vida normal (ms). */
  readonly elapsedMs: number;
  /** Duración prevista del evento o de la vida normal (ms). */
  readonly durationMs: number;
  /** Eventos en el orden en que se intentarán (el primero que quepa a esa hora). */
  readonly queue: readonly PlazaEventKind[];
  readonly rngState: number;
}

/** Resultado de avanzar el calendario. */
export interface ScheduleStep {
  readonly schedule: EventSchedule;
  /** Evento que acaba de empezar en este paso, si alguno. */
  readonly started: PlazaEventKind | null;
}

/**
 * Crea el calendario: vida normal al principio y los eventos barajados.
 * @param seed Semilla.
 * @returns Estado inicial.
 */
export function createEventSchedule(seed: number): EventSchedule {
  let rngState = normalizeSeed(seed + 1);
  const queue = [...PLAZA_EVENT_KINDS];
  for (let i = queue.length - 1; i > 0; i--) {
    const roll = nextRandom(rngState);
    rngState = roll.state;
    const j = Math.floor(roll.value * (i + 1));
    const a = queue[i];
    const b = queue[j];
    if (a !== undefined && b !== undefined) {
      queue[i] = b;
      queue[j] = a;
    }
  }
  return { current: null, elapsedMs: 0, durationMs: FIRST_EVENT_DELAY_MS, queue, rngState };
}

/**
 * Tiempo que queda del tramo del día en que cabe un evento.
 * @param timeOfDay Momento del día (0–1).
 * @param time Cuándo se celebra el evento.
 * @returns Milisegundos que quedan, 0 si ahora no es su momento.
 */
export function remainingWindowMs(timeOfDay: number, time: EventTime): number {
  if (time === 'any') {
    return Number.POSITIVE_INFINITY;
  }
  const window = EVENT_WINDOWS[time];
  for (const t of [timeOfDay, timeOfDay + 1]) {
    if (t >= window.from && t < window.to) {
      return (window.to - t) * DAY_CYCLE_MS;
    }
  }
  return 0;
}

/**
 * Presencia del evento en curso, de 0 a 1: sube al empezar y baja al acabar.
 * @param schedule Calendario.
 * @returns Presencia (0 en la vida normal).
 */
export function getEventPresence(schedule: EventSchedule): number {
  if (schedule.current === null) {
    return 0;
  }
  const fadeIn = schedule.elapsedMs / EVENT_FADE_MS;
  const fadeOut = (schedule.durationMs - schedule.elapsedMs) / EVENT_FADE_MS;
  return Math.max(0, Math.min(1, fadeIn, fadeOut));
}

/**
 * Empieza un evento ya, con la duración indicada.
 * @param schedule Calendario.
 * @param kind Evento.
 * @param durationMs Duración.
 * @param elapsedMs Tiempo que ya lleva (para el modo test).
 * @returns Nuevo calendario, con el evento al final de la cola.
 */
export function startEvent(
  schedule: EventSchedule,
  kind: PlazaEventKind,
  durationMs: number,
  elapsedMs = 0,
): EventSchedule {
  return {
    ...schedule,
    current: kind,
    elapsedMs,
    durationMs,
    queue: [...schedule.queue.filter((k) => k !== kind), kind],
  };
}

/**
 * Vuelve a la vida normal durante un tiempo aleatorio.
 * @param schedule Calendario.
 * @returns Nuevo calendario.
 */
export function startNormalLife(schedule: EventSchedule): EventSchedule {
  const roll = nextRandom(schedule.rngState);
  return {
    ...schedule,
    current: null,
    elapsedMs: 0,
    durationMs: NORMAL_LIFE_MS.min + roll.value * (NORMAL_LIFE_MS.max - NORMAL_LIFE_MS.min),
    rngState: roll.state,
  };
}

/**
 * Avanza el calendario. Al acabar la vida normal empieza el primer evento de la cola
 * que quepa a esa hora (si ninguno cabe, espera); al acabar un evento vuelve la vida
 * normal.
 * @param schedule Estado actual.
 * @param dtMs Tiempo transcurrido.
 * @param timeOfDay Momento del día (0–1).
 * @returns Nuevo estado y el evento que haya empezado.
 */
export function advanceEventSchedule(
  schedule: EventSchedule,
  dtMs: number,
  timeOfDay: number,
): ScheduleStep {
  const elapsedMs = schedule.elapsedMs + Math.max(0, dtMs);
  if (elapsedMs < schedule.durationMs) {
    return { schedule: { ...schedule, elapsedMs }, started: null };
  }
  if (schedule.current !== null) {
    return { schedule: startNormalLife(schedule), started: null };
  }
  const next = schedule.queue.find(
    (kind) => remainingWindowMs(timeOfDay, PLAZA_EVENT_RULES[kind].time) >= EVENT_MIN_MS,
  );
  if (next === undefined) {
    return { schedule: { ...schedule, elapsedMs }, started: null };
  }
  const roll = nextRandom(schedule.rngState);
  const wanted =
    EVENT_DURATION_MS.min + roll.value * (EVENT_DURATION_MS.max - EVENT_DURATION_MS.min);
  const durationMs = Math.min(wanted, remainingWindowMs(timeOfDay, PLAZA_EVENT_RULES[next].time));
  return {
    schedule: startEvent({ ...schedule, rngState: roll.state }, next, durationMs),
    started: next,
  };
}
