import {
  PARTICLE_COUNT,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type WeatherKind,
} from '../config/scene_config';
import type { RenderContext } from '../render/render_context';
import { withAlpha } from './pixel_shapes';

/** Milisegundos por segundo. */
const MS_PER_SECOND = 1000;

/** Velocidad de caída de la lluvia y la nieve (px por segundo). */
const FALL_SPEED = { rain: 380, snow: 44 } as const;

/** Desplazamiento lateral por el viento (px por segundo). */
const WIND = { rain: -80, snow: -12 } as const;

/** Colores de las gotas y los copos. */
const COLORS = { rain: '#c5d6ea', snow: '#ffffff' } as const;

/**
 * Pseudoaleatorio estable a partir de un índice (para repartir las partículas).
 * @param index Índice de la partícula.
 * @param salt Variante.
 * @returns Valor en [0, 1).
 */
function hash(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Dibuja la lluvia o la nieve. Cada partícula sigue una trayectoria fija que depende
 * solo de su índice y del tiempo, así que no hace falta guardar su estado.
 * @param ctx Contexto de dibujo.
 * @param weather Tiempo actual.
 * @param intensity Intensidad (0–1): cuántas partículas se ven.
 * @param timeMs Tiempo de la escena.
 */
export function drawWeatherParticles(
  ctx: RenderContext,
  weather: WeatherKind,
  intensity: number,
  timeMs: number,
): void {
  if ((weather !== 'rain' && weather !== 'snow') || intensity <= 0) {
    return;
  }
  const seconds = timeMs / MS_PER_SECOND;
  const count = Math.round(PARTICLE_COUNT * intensity);
  ctx.fillStyle = withAlpha(COLORS[weather], weather === 'rain' ? 0.55 : 0.9);
  for (let i = 0; i < count; i++) {
    const speed = FALL_SPEED[weather] * (0.7 + 0.6 * hash(i, 1));
    const y = (hash(i, 2) * SCENE_HEIGHT + speed * seconds) % SCENE_HEIGHT;
    const drift = weather === 'snow' ? Math.sin(seconds * 1.5 + i) * 6 : 0;
    const rawX = hash(i, 3) * SCENE_WIDTH + WIND[weather] * seconds + drift;
    const x = ((rawX % SCENE_WIDTH) + SCENE_WIDTH) % SCENE_WIDTH;
    if (weather === 'rain') {
      ctx.fillRect(Math.round(x), Math.round(y), 1, 7);
    } else {
      const size = hash(i, 4) < 0.3 ? 3 : 2;
      ctx.fillRect(Math.round(x), Math.round(y), size, size);
    }
  }
}
