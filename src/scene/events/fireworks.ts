import { LAWN_EDGE } from '../../config/scene_config';
import type { RenderContext } from '../../render/render_context';
import type { SceneActor } from '../actors';
import { depthScale } from '../crowd';
import { fillCircle, fillPixelRect, mixColors, withAlpha } from '../pixel_shapes';
import { SKINS, hash, pick } from './event_helpers';
import type { EventFrame, PlazaEvent } from './event_types';
import { FIGURE_HEIGHT, drawFigure, type FigureStyle } from './figures';

/** Milisegundos por segundo. */
const MS_PER_SECOND = 1000;

/** Cada cuánto se lanza un cohete (ms). */
const LAUNCH_INTERVAL_MS = 380;

/** Tiempo de subida del cohete y de la palmera de chispas (ms). */
const RISE_MS = 900;
const BURST_MS = 2200;

/** Chispas de cada estallido. */
const SPARKS = 44;

/** Fila desde la que suben los cohetes (detrás de los edificios). */
const LAUNCH_Y = 268;

/** Zonas del cielo donde estallan: columnas mínima y máxima. */
const ZONES = [
  { from: 12, to: 112 },
  { from: 440, to: 630 },
  { from: 20, to: 120 },
  { from: 520, to: 630 },
  { from: 150, to: 420 },
] as const;

/** Colores de los estallidos. */
const BURST_COLORS = [
  '#ff5a5a',
  '#ffd23a',
  '#5aff8a',
  '#5ab0ff',
  '#ff8ae0',
  '#ffffff',
  '#ffa03a',
] as const;

/** Gravedad que hace caer las chispas (px/s²). */
const GRAVITY = 26;

/** Un cohete con su estallido. */
interface Rocket {
  readonly launchMs: number;
  readonly x: number;
  readonly apexY: number;
  readonly radius: number;
  readonly color: string;
  readonly second: string;
}

/**
 * Cohete número `i` del espectáculo (todo depende solo del índice).
 * @param i Índice.
 * @returns El cohete.
 */
function rocketAt(i: number): Rocket {
  const zone = ZONES[i % ZONES.length] ?? ZONES[0];
  return {
    launchMs: i * LAUNCH_INTERVAL_MS + hash(i, 1) * 300,
    x: zone.from + hash(i, 2) * (zone.to - zone.from),
    apexY: 30 + hash(i, 3) * 110,
    radius: 34 + hash(i, 4) * 34,
    color: pick(BURST_COLORS, i, 5),
    second: pick(BURST_COLORS, i, 6),
  };
}

/**
 * Cohetes visibles en un instante (subiendo o estallando).
 * @param elapsedMs Tiempo del evento.
 * @returns Cohetes con su tiempo desde el lanzamiento.
 */
function activeRockets(elapsedMs: number): { rocket: Rocket; age: number }[] {
  const last = Math.floor(elapsedMs / LAUNCH_INTERVAL_MS);
  const first = Math.max(0, last - Math.ceil((RISE_MS + BURST_MS) / LAUNCH_INTERVAL_MS) - 1);
  const active: { rocket: Rocket; age: number }[] = [];
  for (let i = first; i <= last; i++) {
    const rocket = rocketAt(i);
    const age = elapsedMs - rocket.launchMs;
    if (age >= 0 && age < RISE_MS + BURST_MS) {
      active.push({ rocket, age });
    }
  }
  return active;
}

/**
 * Destello de los estallidos recientes (0–1), para iluminar la plaza.
 * @param elapsedMs Tiempo del evento.
 * @returns Intensidad del destello.
 */
function flashAt(elapsedMs: number): number {
  let flash = 0;
  for (const { age } of activeRockets(elapsedMs)) {
    const sinceBurst = age - RISE_MS;
    if (sinceBurst >= 0 && sinceBurst < 400) {
      flash += 1 - sinceBurst / 400;
    }
  }
  return Math.min(1, flash);
}

/**
 * Dibuja un cohete subiendo o su palmera de chispas.
 * @param ctx Contexto de dibujo.
 * @param rocket Cohete.
 * @param age Tiempo desde el lanzamiento (ms).
 */
function drawRocket(ctx: RenderContext, rocket: Rocket, age: number): void {
  if (age < RISE_MS) {
    const t = age / RISE_MS;
    const y = LAUNCH_Y + (rocket.apexY - LAUNCH_Y) * (1 - (1 - t) * (1 - t));
    fillPixelRect(ctx, rocket.x, y, 1, 6, withAlpha('#ffe8b0', 0.5));
    fillPixelRect(ctx, rocket.x, y, 1, 2, '#fff6dc');
    return;
  }
  const seconds = (age - RISE_MS) / MS_PER_SECOND;
  const life = (age - RISE_MS) / BURST_MS;
  const fade = 1 - life;
  const spread = rocket.radius * (1 - Math.pow(1 - Math.min(1, life * 2.2), 2));
  const drop = 0.5 * GRAVITY * seconds * seconds;
  if (life < 0.15) {
    const flash = 1 - life / 0.15;
    fillCircle(ctx, rocket.x, rocket.apexY, 3 + life * 30, withAlpha('#fff6dc', 0.45 * flash));
  }
  for (let i = 0; i < SPARKS; i++) {
    const angle = (i / SPARKS) * Math.PI * 2 + hash(i, rocket.launchMs) * 0.2;
    // Chispas a distintas distancias: una palmera llena, no un anillo.
    const reach = spread * (0.35 + hash(i, rocket.apexY) * 0.65);
    const x = rocket.x + Math.cos(angle) * reach;
    const y = rocket.apexY + Math.sin(angle) * reach * 0.85 + drop;
    const color = i % 2 === 0 ? rocket.color : rocket.second;
    const twinkle = life > 0.6 && (i + Math.floor(age / 90)) % 3 === 0 ? 0.3 : 1;
    fillPixelRect(ctx, x - 1, y - 1, 3, 3, withAlpha(color, fade * twinkle * 0.35));
    fillPixelRect(ctx, x, y, 2, 2, withAlpha(mixColors(color, '#ffffff', 0.3), fade * twinkle));
    // Estela hacia el centro, cada vez más tenue.
    for (const [back, alpha] of [
      [0.88, 0.6],
      [0.76, 0.4],
      [0.64, 0.22],
    ] as const) {
      const tx = rocket.x + Math.cos(angle) * reach * back;
      const ty = rocket.apexY + Math.sin(angle) * reach * back * 0.85 + drop * back;
      fillPixelRect(ctx, tx, ty, 1, 1, withAlpha(color, fade * alpha));
    }
  }
}

/**
 * Público que mira el espectáculo con los brazos en alto o con el móvil.
 * @param frame Fotograma.
 * @returns Actores.
 */
function audience(frame: EventFrame): SceneActor[] {
  const clothes = ['#3b3f52', '#5a3a2a', '#b23a4a', '#3a5aa0', '#2f4a3a', '#6a3a7a'] as const;
  const edgeAt = (x: number): number =>
    LAWN_EDGE.from.y + ((LAWN_EDGE.to.y - LAWN_EDGE.from.y) * x) / LAWN_EDGE.to.x;
  const spots: { x: number; y: number }[] = [];
  for (let i = 0; i < 24; i++) {
    const x = 6 + i * 10 + (i % 3) * 2;
    spots.push({ x, y: Math.round(edgeAt(x) + 4 + (i % 2) * 4) });
  }
  for (let i = 0; i < 18; i++) {
    spots.push({ x: 436 + i * 10, y: 323 + (i % 2) });
  }
  for (let i = 0; i < 14; i++) {
    spots.push({ x: 8 + i * 46 + (i % 2) * 10, y: 350 + (i % 3) * 3 });
  }
  return spots.map((spot, i) => {
    const style: FigureStyle = {
      body: pick(clothes, i),
      legs: '#22222a',
      skin: pick(SKINS, i, 3),
      headwear: i % 4 === 0 ? 'cap' : 'none',
      hat: pick(clothes, i, 2),
    };
    const phone = i % 5 === 0;
    return {
      y: spot.y,
      draw: (ctx: RenderContext) => {
        const s = depthScale(spot.y);
        drawFigure(ctx, spot.x, spot.y, FIGURE_HEIGHT * s, style, {
          stride: 0,
          arms: phone || i % 3 === 0 ? 'wave' : 'down',
          phase: frame.timeMs / 250 + i,
          night: frame.night,
        });
        if (phone) {
          // Pantalla del móvil grabando los fuegos.
          const top = spot.y - Math.round(FIGURE_HEIGHT * s * 1.1);
          fillPixelRect(ctx, spot.x + Math.round(FIGURE_HEIGHT * s * 0.16), top, 2, 3, '#cfe8ff');
        }
      },
    };
  });
}

/** Fuegos artificiales de noche sobre el Kremlin y San Basilio. */
export const FIREWORKS: PlazaEvent = {
  kind: 'fireworks',
  drawSky: (ctx, frame) => {
    for (const { rocket, age } of activeRockets(frame.elapsedMs)) {
      drawRocket(ctx, rocket, age);
    }
  },
  illumination: (frame) => {
    const flash = flashAt(frame.elapsedMs) * 0.45;
    return { back: 0.12 + flash, front: 0.15 + flash };
  },
  actors: audience,
};
