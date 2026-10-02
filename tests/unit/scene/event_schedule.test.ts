import { describe, expect, it } from 'vitest';
import {
  EVENT_DURATION_MS,
  EVENT_FADE_MS,
  EVENT_MIN_MS,
  FIRST_EVENT_DELAY_MS,
  NORMAL_LIFE_MS,
  PLAZA_EVENT_KINDS,
  PLAZA_EVENT_RULES,
} from '../../../src/config/plaza_events_config';
import {
  advanceEventSchedule,
  createEventSchedule,
  getEventPresence,
  remainingWindowMs,
  startEvent,
  type EventSchedule,
} from '../../../src/scene/events/event_schedule';

/** Media mañana y primeras horas de la noche. */
const MORNING = 0.4;
const MIDNIGHT = 0.85;

describe('event_schedule', () => {
  it('empieza con vida normal y todos los eventos en la cola', () => {
    const schedule = createEventSchedule(7);
    expect(schedule.current).toBeNull();
    expect(schedule.durationMs).toBe(FIRST_EVENT_DELAY_MS);
    expect([...schedule.queue].sort()).toEqual([...PLAZA_EVENT_KINDS].sort());
  });

  it('calcula lo que queda del tramo de día o de noche', () => {
    expect(remainingWindowMs(MORNING, 'day')).toBeGreaterThan(EVENT_MIN_MS);
    expect(remainingWindowMs(MORNING, 'night')).toBe(0);
    expect(remainingWindowMs(MIDNIGHT, 'night')).toBeGreaterThan(EVENT_MIN_MS);
    expect(remainingWindowMs(MIDNIGHT, 'day')).toBe(0);
    expect(remainingWindowMs(0.2, 'any')).toBe(Number.POSITIVE_INFINITY);
  });

  it('al acabar la vida normal empieza un evento que quepa a esa hora', () => {
    for (const timeOfDay of [MORNING, MIDNIGHT]) {
      const step = advanceEventSchedule(createEventSchedule(3), FIRST_EVENT_DELAY_MS, timeOfDay);
      expect(step.started).not.toBeNull();
      const kind = step.schedule.current;
      if (kind === null) {
        throw new Error('Debería haber un evento');
      }
      expect(step.started).toBe(kind);
      const time = PLAZA_EVENT_RULES[kind].time;
      expect(time === 'any' || remainingWindowMs(timeOfDay, time) > 0).toBe(true);
      expect(step.schedule.durationMs).toBeGreaterThanOrEqual(EVENT_MIN_MS);
      expect(step.schedule.durationMs).toBeLessThanOrEqual(EVENT_DURATION_MS.max);
      expect(step.schedule.queue.at(-1)).toBe(kind);
    }
  });

  it('si no cabe ningún evento, espera', () => {
    const onlyDay: EventSchedule = { ...createEventSchedule(3), queue: ['parade'] };
    const step = advanceEventSchedule(onlyDay, FIRST_EVENT_DELAY_MS, MIDNIGHT);
    expect(step.started).toBeNull();
    expect(step.schedule.current).toBeNull();
  });

  it('el evento aparece y se va poco a poco, y después vuelve la vida normal', () => {
    const event = startEvent(createEventSchedule(3), 'christmas', 60_000);
    expect(getEventPresence(event)).toBe(0);
    const middle = advanceEventSchedule(event, 30_000, MORNING).schedule;
    expect(getEventPresence(middle)).toBe(1);
    const ending = advanceEventSchedule(middle, 30_000 - EVENT_FADE_MS / 2, MORNING).schedule;
    expect(getEventPresence(ending)).toBeCloseTo(0.5);
    const after = advanceEventSchedule(ending, EVENT_FADE_MS, MORNING).schedule;
    expect(after.current).toBeNull();
    expect(getEventPresence(after)).toBe(0);
    expect(after.durationMs).toBeGreaterThanOrEqual(NORMAL_LIFE_MS.min);
    expect(after.durationMs).toBeLessThanOrEqual(NORMAL_LIFE_MS.max);
  });

  it('en una partida larga salen todos los eventos', () => {
    let schedule = createEventSchedule(11);
    let elapsed = 0;
    const seen = new Set<string>();
    while (elapsed < 30 * 60_000) {
      const timeOfDay = (0.32 + elapsed / 180_000) % 1;
      const step = advanceEventSchedule(schedule, 1000, timeOfDay);
      schedule = step.schedule;
      if (step.started !== null) {
        seen.add(step.started);
      }
      elapsed += 1000;
    }
    expect([...seen].sort()).toEqual([...PLAZA_EVENT_KINDS].sort());
  });
});
