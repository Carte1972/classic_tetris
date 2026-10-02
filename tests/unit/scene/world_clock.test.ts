import { describe, expect, it } from 'vitest';
import {
  DAY_CYCLE_MS,
  DAY_PHASES,
  SKY_COLORS,
  START_TIME_OF_DAY,
  WEATHER_FADE_MS,
  WEATHER_MAX_MS,
} from '../../../src/config/scene_config';
import {
  advanceWorld,
  createWorld,
  getDaylight,
  getOvercast,
  getSkyColors,
  getTimeOfDay,
  getWeatherIntensity,
  pickNextWeather,
  type WorldState,
} from '../../../src/scene/world_clock';

describe('ciclo de día', () => {
  it('empieza por la mañana y da una vuelta completa cada 3 minutos', () => {
    const world = createWorld(1);
    expect(getTimeOfDay(world)).toBeCloseTo(START_TIME_OF_DAY);
    expect(DAY_CYCLE_MS).toBe(180_000);
    expect(getTimeOfDay(advanceWorld(world, DAY_CYCLE_MS))).toBeCloseTo(START_TIME_OF_DAY);
    expect(getTimeOfDay(advanceWorld(world, DAY_CYCLE_MS / 2))).toBeCloseTo(
      (START_TIME_OF_DAY + 0.5) % 1,
    );
  });

  it('hay luz plena de día, ninguna de noche y transición al amanecer y al atardecer', () => {
    expect(getDaylight(0.5)).toBe(1);
    expect(getDaylight(0.02)).toBe(0);
    expect(getDaylight(0.95)).toBe(0);
    const dawn = getDaylight((DAY_PHASES.dawnStart + DAY_PHASES.dayStart) / 2);
    const dusk = getDaylight((DAY_PHASES.duskStart + DAY_PHASES.nightStart) / 2);
    expect(dawn).toBeCloseTo(0.5);
    expect(dusk).toBeCloseTo(0.5);
  });

  it('el cielo cambia de color con la hora y se agrisa cuando está cubierto', () => {
    expect(getSkyColors(0.5, 0)).toEqual(SKY_COLORS.day);
    expect(getSkyColors(0.02, 0)).toEqual(SKY_COLORS.night);
    expect(getSkyColors(0.5, 1)).not.toEqual(SKY_COLORS.day);
    for (const time of [0.2, 0.25, 0.7, 0.75]) {
      expect(getSkyColors(time, 0).top).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('tiempo atmosférico', () => {
  it('empieza despejado y cambia a otro tiempo distinto al acabar su duración', () => {
    let world: WorldState = createWorld(7);
    expect(world.weather).toBe('clear');
    const kinds = new Set<string>([world.weather]);
    for (let change = 0; change < 40; change++) {
      const previous = world.weather;
      const remaining = world.weatherDurationMs - world.weatherElapsedMs;
      world = advanceWorld(world, remaining - 1);
      expect(world.weather).toBe(previous);
      world = advanceWorld(world, 1);
      expect(world.weather).not.toBe(previous);
      expect(world.weatherDurationMs).toBeLessThanOrEqual(WEATHER_MAX_MS);
      kinds.add(world.weather);
    }
    expect(kinds).toEqual(new Set(['clear', 'cloudy', 'rain', 'snow']));
  });

  it('es determinista para la misma semilla', () => {
    expect(advanceWorld(createWorld(3), 500_000)).toEqual(advanceWorld(createWorld(3), 500_000));
  });

  it('la intensidad sube al empezar y baja al terminar', () => {
    const world = createWorld(1);
    expect(getWeatherIntensity(world)).toBe(0);
    expect(getWeatherIntensity({ ...world, weatherElapsedMs: WEATHER_FADE_MS / 2 })).toBeCloseTo(
      0.5,
    );
    expect(getWeatherIntensity({ ...world, weatherElapsedMs: WEATHER_FADE_MS * 2 })).toBe(1);
    expect(getWeatherIntensity({ ...world, weatherElapsedMs: world.weatherDurationMs })).toBe(0);
  });

  it('la nieve se acumula al nevar y se funde después', () => {
    const snowing: WorldState = {
      ...createWorld(1),
      weather: 'snow',
      weatherElapsedMs: WEATHER_FADE_MS,
      weatherDurationMs: 1_000_000,
    };
    const covered = advanceWorld(snowing, 20_000);
    expect(covered.snowCover).toBeGreaterThan(0.4);
    const melting = advanceWorld({ ...covered, weather: 'clear' }, 20_000);
    expect(melting.snowCover).toBeLessThan(covered.snowCover);
  });

  it('la lluvia moja el suelo y se seca después', () => {
    const raining: WorldState = {
      ...createWorld(1),
      weather: 'rain',
      weatherElapsedMs: WEATHER_FADE_MS,
      weatherDurationMs: 1_000_000,
    };
    const wet = advanceWorld(raining, 10_000);
    expect(wet.wetness).toBeGreaterThan(0.4);
    expect(advanceWorld({ ...wet, weather: 'clear' }, 10_000).wetness).toBeLessThan(wet.wetness);
  });

  it('la nubosidad depende del tiempo', () => {
    const settled = {
      ...createWorld(1),
      weatherElapsedMs: WEATHER_FADE_MS,
      weatherDurationMs: 1e6,
    };
    expect(getOvercast({ ...settled, weather: 'clear' })).toBe(0);
    expect(getOvercast({ ...settled, weather: 'cloudy' })).toBeGreaterThan(0);
    expect(getOvercast({ ...settled, weather: 'rain' })).toBe(1);
    expect(getOvercast({ ...settled, weather: 'snow' })).toBe(1);
  });

  it('pickNextWeather nunca repite el tiempo actual', () => {
    for (let value = 0; value < 1; value += 0.05) {
      expect(pickNextWeather('rain', value)).not.toBe('rain');
    }
    expect(pickNextWeather('clear', 0.999_999)).not.toBe('clear');
  });
});
