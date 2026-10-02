/** Ancho de la escena de fondo en píxeles lógicos (16:9). */
export const SCENE_WIDTH = 320;

/** Alto de la escena de fondo en píxeles lógicos. */
export const SCENE_HEIGHT = 180;

/** Fila del horizonte: donde acaba el cielo y empiezan los edificios. */
export const HORIZON_Y = 118;

/** Fila más lejana del suelo de la plaza por la que caminan los paseantes. */
export const GROUND_FAR_Y = 124;

/** Fila más cercana del suelo de la plaza por la que caminan los paseantes. */
export const GROUND_NEAR_Y = 178;

/** Duración de un día completo (amanecer, día, atardecer y noche), en ms. */
export const DAY_CYCLE_MS = 180_000;

/** Momento del día al empezar (0 = medianoche, 0,5 = mediodía). */
export const START_TIME_OF_DAY = 0.32;

/**
 * Tramos del día como fracción de la vuelta: noche hasta `dawnStart`, amanecer hasta
 * `dayStart`, día hasta `duskStart`, atardecer hasta `nightStart` y noche hasta el final.
 */
export const DAY_PHASES = { dawnStart: 0.18, dayStart: 0.27, duskStart: 0.68, nightStart: 0.78 };

/** Colores del cielo (arriba y abajo) en cada momento clave del día. */
export const SKY_COLORS = {
  night: { top: '#070b22', bottom: '#1b2350' },
  dawn: { top: '#3a4a8c', bottom: '#f2a273' },
  day: { top: '#3f86dc', bottom: '#acd6f6' },
  dusk: { top: '#35296b', bottom: '#f07346' },
} as const;

/** Colores del cielo cubierto (lluvia o nieve) de día. */
export const OVERCAST_SKY = { top: '#6f7a8c', bottom: '#b4bcc8' } as const;

/** Tipos de tiempo atmosférico. */
export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'snow';

/** Duración mínima de cada tipo de tiempo (ms). */
export const WEATHER_MIN_MS = 45_000;

/** Duración máxima de cada tipo de tiempo (ms). */
export const WEATHER_MAX_MS = 75_000;

/** Tiempo que tarda el tiempo en empezar o en amainar (ms). */
export const WEATHER_FADE_MS = 8_000;

/** Probabilidad relativa de cada tipo de tiempo al cambiar. */
export const WEATHER_WEIGHTS: Readonly<Record<WeatherKind, number>> = {
  clear: 3,
  cloudy: 2,
  rain: 2,
  snow: 2,
};

/** Tiempo con el que empieza la partida. */
export const INITIAL_WEATHER: WeatherKind = 'clear';

/** Fracción de nieve acumulada que se gana por segundo nevando a plena intensidad. */
export const SNOW_ACCUMULATION_PER_S = 0.03;

/** Fracción de nieve acumulada que se funde por segundo sin nevar. */
export const SNOW_MELT_PER_S = 0.01;

/** Fracción de humedad (charcos) que se gana por segundo lloviendo a plena intensidad. */
export const WETNESS_GAIN_PER_S = 0.05;

/** Fracción de humedad que se seca por segundo sin llover. */
export const WETNESS_DRY_PER_S = 0.015;

/** Número de paseantes en la plaza. */
export const WALKER_COUNT = 18;

/** Velocidad mínima y máxima de los paseantes (px lógicos por segundo, a escala cercana). */
export const WALKER_SPEED = { min: 6, max: 14 } as const;

/** Número de palomas. */
export const PIGEON_COUNT = 9;

/** Distancia (px) a la que un paseante hace volar a una paloma. */
export const PIGEON_SCARE_DISTANCE = 10;

/** Tiempo que tarda una paloma en volver a posarse tras volar (ms). */
export const PIGEON_RETURN_MS = 9_000;

/** Número de nubes. */
export const CLOUD_COUNT = 6;

/** Número de gotas de lluvia y copos de nieve a plena intensidad. */
export const PARTICLE_COUNT = 140;

/** Número de estrellas visibles de noche. */
export const STAR_COUNT = 60;

/** Nubosidad del tiempo "nublado" (el cielo de lluvia o nieve está cubierto del todo). */
export const CLOUDY_OVERCAST = 0.45;

/** Cuánto se acerca el color del cielo al gris cuando está totalmente cubierto. */
export const OVERCAST_SKY_BLEND = 0.85;
