import { SCENE_WIDTH } from '../../config/scene_config';
import type { RenderContext } from '../../render/render_context';
import type { SceneActor } from '../actors';
import { depthScale } from '../crowd';
import {
  fillCircle,
  fillEllipse,
  fillPixelRect,
  fillPolygon,
  mixColors,
  withAlpha,
} from '../pixel_shapes';
import { SKINS, hash, pick } from './event_helpers';
import type { EventFrame, PlazaEvent } from './event_types';
import { FIGURE_HEIGHT, drawFigure, type FigureStyle } from './figures';
import { drawStall, type Stall } from './stalls';

/** Milisegundos por segundo. */
const MS_PER_SECOND = 1000;

/** Muñeco de Maslenitsa: pie, altura. */
const EFFIGY = { x: 70, foot: 334, height: 68 } as const;

/** Fracción del evento a partir de la cual arde el muñeco. */
const BURN_FROM = 0.62;

/** Tiempo que tarda el fuego en consumir el muñeco (ms). */
const BURN_MS = 16_000;

/** Corro alrededor del muñeco: semiejes y número de bailarines. */
const KHOROVOD = { rx: 36, ry: 8, dancers: 10, turnMs: 14_000 } as const;

/** Casetas de blinis. */
const STALLS: readonly Stall[] = [
  { x: 470, foot: 354, width: 54, roof: '#d8902a' },
  { x: 580, foot: 356, width: 54, roof: '#b8202a' },
];

/** Troika: fila, velocidad, intervalo entre pasadas y recorrido. */
const TROIKA = { y: 352, speed: 70, intervalMs: 22_000, from: -80, to: SCENE_WIDTH + 80 } as const;

/** Colores de la fiesta. */
const COLORS = {
  straw: '#d8b45a',
  strawDark: '#a8843a',
  pole: '#6a4a2a',
  dress: '#c8202f',
  dressFlower: '#f0c24a',
  kerchief: '#f4f4f4',
  kerchiefDot: '#c8202f',
  char: '#2a1e18',
  flame: '#ff8a1a',
  flameCore: '#ffe05a',
  smoke: '#6a6a72',
  horse: '#5a3a24',
  horseDark: '#3a2414',
  mane: '#1e140c',
  sleigh: '#b8202a',
  sleighTrim: '#f0c24a',
  duga: '#2f6fc4',
  pancake: '#e8b45a',
  samovar: '#e8b947',
} as const;

/** Trajes del corro: sarafanes y camisas rojas. */
const COSTUMES: readonly FigureStyle[] = [
  {
    body: '#c8202f',
    legs: '#c8202f',
    skin: SKINS[0],
    headwear: 'kokoshnik',
    hat: '#f0c24a',
    long: true,
  },
  {
    body: '#2f6fc4',
    legs: '#2f6fc4',
    skin: SKINS[3],
    headwear: 'kokoshnik',
    hat: '#e0243a',
    long: true,
  },
  { body: '#e0243a', legs: '#2a2a32', skin: SKINS[1], headwear: 'cap', hat: '#1a1a22' },
  {
    body: '#2f8a4a',
    legs: '#2f8a4a',
    skin: SKINS[2],
    headwear: 'scarf',
    hat: '#f0c24a',
    long: true,
  },
];

/**
 * Progreso del fuego (0 sin arder, 1 consumido).
 * @param frame Fotograma.
 * @returns Progreso.
 */
function burnProgress(frame: EventFrame): number {
  const start = frame.durationMs * BURN_FROM;
  return Math.min(1, Math.max(0, (frame.elapsedMs - start) / BURN_MS));
}

/**
 * Muñeco de paja vestido con sarafán y pañuelo, con los brazos abiertos. Al arder se
 * va ennegreciendo de abajo arriba.
 * @param ctx Contexto de dibujo.
 * @param burnt Fracción consumida.
 */
function drawEffigy(ctx: RenderContext, burnt: number): void {
  const { x, foot, height } = EFFIGY;
  const top = foot - height;
  const charLine = foot - burnt * height * 1.1;
  const tone = (color: string, y: number): string => (y > charLine ? COLORS.char : color);
  fillPixelRect(ctx, x - 1, top + 6, 2, height - 6, tone(COLORS.pole, foot));
  // Falda de paja y vestido.
  for (let y = top + 26; y < foot - 10; y++) {
    const half = 4 + ((y - top - 26) / (height - 36)) * 11;
    for (let dx = -Math.round(half); dx <= Math.round(half); dx++) {
      const flower = (dx * 3 + y * 5) % 11 === 0;
      fillPixelRect(ctx, x + dx, y, 1, 1, tone(flower ? COLORS.dressFlower : COLORS.dress, y));
    }
  }
  // Tronco de paja con brazos abiertos.
  fillPixelRect(ctx, x - 5, top + 14, 10, 13, tone(COLORS.straw, top + 20));
  fillPixelRect(ctx, x - 20, top + 15, 40, 3, tone(COLORS.straw, top + 16));
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      fillPixelRect(
        ctx,
        x + side * (20 + i),
        top + 13 + i * 2,
        1,
        2,
        tone(COLORS.strawDark, top + 14),
      );
    }
  }
  // Cabeza con pañuelo de lunares y cara.
  fillCircle(ctx, x, top + 9, 6, tone(COLORS.kerchief, top + 9));
  fillCircle(ctx, x, top + 10, 4, tone('#f2d2b0', top + 10));
  for (const [dx, dy] of [
    [-4, 5],
    [3, 4],
    [-2, 2],
    [4, 9],
  ] as const) {
    fillPixelRect(ctx, x + dx, top + dy, 1, 1, tone(COLORS.kerchiefDot, top + dy));
  }
  if (burnt < 0.9) {
    fillPixelRect(ctx, x - 2, top + 9, 1, 1, '#2a2a32');
    fillPixelRect(ctx, x + 2, top + 9, 1, 1, '#2a2a32');
    fillPixelRect(ctx, x - 1, top + 12, 3, 1, '#c8202f');
  }
}

/**
 * Llamas y humo de la hoguera del muñeco.
 * @param ctx Contexto de dibujo.
 * @param burn Progreso del fuego.
 * @param timeMs Tiempo de la escena.
 */
function drawBonfire(ctx: RenderContext, burn: number, timeMs: number): void {
  if (burn <= 0) {
    return;
  }
  const { x, foot, height } = EFFIGY;
  const strength = Math.min(1, burn * 3) * (burn > 0.85 ? (1 - burn) / 0.15 : 1);
  const flameHeight = height * 0.9 * strength;
  for (let i = 0; i < 9; i++) {
    const dx = (i - 4) * 4;
    const flicker = Math.sin(timeMs / 70 + i * 1.9) * 0.25 + 0.75;
    const h = flameHeight * flicker * (1 - Math.abs(i - 4) / 6);
    fillPolygon(
      ctx,
      [
        { x: x + dx - 4, y: foot },
        { x: x + dx + Math.sin(timeMs / 90 + i) * 2, y: foot - h },
        { x: x + dx + 4, y: foot },
      ],
      withAlpha(COLORS.flame, 0.85),
    );
    fillPolygon(
      ctx,
      [
        { x: x + dx - 2, y: foot },
        { x: x + dx, y: foot - h * 0.6 },
        { x: x + dx + 2, y: foot },
      ],
      withAlpha(COLORS.flameCore, 0.9),
    );
  }
  fillCircle(
    ctx,
    x,
    foot - flameHeight * 0.4,
    flameHeight * 0.7,
    withAlpha(COLORS.flameCore, 0.12 * strength),
  );
  // Humo que sube y se deshace.
  for (let i = 0; i < 10; i++) {
    const age = ((timeMs / 1000 + i * 0.6) % 6) / 6;
    const y = foot - height * 0.8 - age * 120;
    const drift = Math.sin(i + age * 3) * 8 + age * 20;
    fillCircle(
      ctx,
      x + drift,
      y,
      6 + age * 14,
      withAlpha(COLORS.smoke, 0.35 * (1 - age) * strength),
    );
  }
}

/**
 * Caballo de la troika, de perfil hacia la derecha.
 * @param ctx Contexto de dibujo.
 * @param x Columna del centro.
 * @param y Fila de los cascos.
 * @param s Escala.
 * @param gallop Fase del galope.
 * @param shade Tono del pelaje.
 */
function drawHorse(
  ctx: RenderContext,
  x: number,
  y: number,
  s: number,
  gallop: number,
  shade: number,
): void {
  const u = (value: number): number => Math.round(value * s);
  const coat = mixColors(COLORS.horse, COLORS.horseDark, shade);
  for (const [dx, phase] of [
    [-6, 0],
    [-3, Math.PI],
    [4, Math.PI / 2],
    [7, Math.PI * 1.5],
  ] as const) {
    const swing = Math.round(Math.sin(gallop + phase) * u(2));
    fillPixelRect(ctx, x + u(dx) + swing, y - u(8), Math.max(1, u(1.5)), u(8), COLORS.horseDark);
  }
  fillEllipse(ctx, x, y - u(11), u(10), u(4), coat);
  fillPolygon(
    ctx,
    [
      { x: x + u(7), y: y - u(13) },
      { x: x + u(12), y: y - u(21) },
      { x: x + u(16), y: y - u(19) },
      { x: x + u(11), y: y - u(11) },
    ],
    coat,
  );
  fillPixelRect(ctx, x + u(9), y - u(21), u(3), u(6), COLORS.mane);
  fillPixelRect(ctx, x - u(11), y - u(13), u(3), u(6), COLORS.mane);
}

/**
 * Troika: tres caballos con la duga pintada tirando de un trineo con pasajeros.
 * @param ctx Contexto de dibujo.
 * @param x Columna del caballo central.
 * @param timeMs Tiempo de la escena.
 * @param night Nivel de noche.
 */
function drawTroika(ctx: RenderContext, x: number, timeMs: number, night: number): void {
  const s = depthScale(TROIKA.y) * 1.1;
  const u = (value: number): number => Math.round(value * s);
  const gallop = timeMs / 90;
  // Trineo con pasajeros.
  const sx = x - u(34);
  fillPixelRect(ctx, sx - u(14), TROIKA.y - u(2), u(30), u(2), COLORS.sleighTrim);
  fillPolygon(
    ctx,
    [
      { x: sx - u(12), y: TROIKA.y - u(3) },
      { x: sx - u(14), y: TROIKA.y - u(14) },
      { x: sx + u(10), y: TROIKA.y - u(10) },
      { x: sx + u(16), y: TROIKA.y - u(3) },
    ],
    COLORS.sleigh,
  );
  fillPixelRect(ctx, sx - u(12), TROIKA.y - u(9), u(24), 1, COLORS.sleighTrim);
  [-6, 2].forEach((dx, i) => {
    drawFigure(ctx, sx + u(dx), TROIKA.y - u(8), FIGURE_HEIGHT * s * 0.6, pick(COSTUMES, i + 1), {
      stride: 0,
      arms: i === 0 ? 'wave' : 'down',
      phase: timeMs / 200,
      night,
    });
  });
  // Tres caballos (el central, un poco más adelante) y la duga.
  drawHorse(ctx, x - u(3), TROIKA.y - u(2), s, gallop + 1, 0.4);
  drawHorse(ctx, x + u(2), TROIKA.y, s, gallop, 0);
  drawHorse(ctx, x - u(1), TROIKA.y + u(2), s, gallop + 2, 0.6);
  fillPixelRect(ctx, x + u(1), TROIKA.y - u(24), u(2), u(10), COLORS.duga);
  fillPixelRect(ctx, x - u(2), TROIKA.y - u(25), u(8), u(2), COLORS.duga);
  fillCircle(ctx, x + u(2), TROIKA.y - u(22), Math.max(1, u(1.2)), COLORS.sleighTrim);
}

/**
 * Mercancía de las casetas: pilas de blinis y un samovar.
 * @param ctx Contexto de dibujo.
 * @param left Columna izquierda del mostrador.
 * @param y Fila del mostrador.
 * @param width Ancho del mostrador.
 */
function drawBlini(ctx: RenderContext, left: number, y: number, width: number): void {
  for (let i = 0; i < 4; i++) {
    fillPixelRect(
      ctx,
      left + 2,
      y - 1 - i,
      8,
      1,
      mixColors(COLORS.pancake, '#a8642a', (i % 2) * 0.3),
    );
  }
  const sx = left + width - 8;
  fillPixelRect(ctx, sx, y - 8, 6, 8, COLORS.samovar);
  fillPixelRect(ctx, sx + 1, y - 10, 4, 2, COLORS.samovar);
  fillPixelRect(ctx, sx + 2, y - 4, 1, 1, '#3a2a1a');
}

/** Maslenitsa: despedida del invierno con muñeco de paja, corro, blinis y troika. */
export const MASLENITSA: PlazaEvent = {
  kind: 'maslenitsa',
  actors: (frame) => {
    const burn = burnProgress(frame);
    const actors: SceneActor[] = [
      {
        y: EFFIGY.foot,
        draw: (ctx) => {
          if (burn < 1) {
            drawEffigy(ctx, burn);
          }
          drawBonfire(ctx, burn, frame.timeMs);
        },
      },
      ...STALLS.map((stall) => ({
        y: stall.foot,
        draw: (ctx: RenderContext) => {
          drawStall(ctx, stall, depthScale(stall.foot), frame.timeMs, true, drawBlini);
          // Vapor de los blinis recién hechos.
          for (let i = 0; i < 3; i++) {
            const age = ((frame.timeMs / 1000 + i * 0.7) % 2) / 2;
            fillCircle(
              ctx,
              stall.x - 10 + i * 4 + Math.sin(age * 6) * 2,
              stall.foot - 34 - age * 18,
              2 + age * 3,
              withAlpha('#ffffff', 0.4 * (1 - age)),
            );
          }
        },
      })),
    ];
    // Corro que gira alrededor del muñeco.
    const turn = (frame.elapsedMs / KHOROVOD.turnMs) * Math.PI * 2;
    for (let i = 0; i < KHOROVOD.dancers; i++) {
      const angle = turn + (i / KHOROVOD.dancers) * Math.PI * 2;
      const x = EFFIGY.x + Math.cos(angle) * KHOROVOD.rx;
      const y = Math.round(EFFIGY.foot + Math.sin(angle) * KHOROVOD.ry);
      const style = pick(COSTUMES, i, 1);
      actors.push({
        y,
        draw: (ctx) =>
          drawFigure(ctx, x, y, FIGURE_HEIGHT * depthScale(y), style, {
            stride: Math.sin(frame.timeMs / 160 + i) * 0.7,
            arms: hash(i, 3) < 0.5 ? 'up' : 'down',
            jump: Math.max(0, Math.sin(frame.timeMs / 220 + i)) * 0.06,
          }),
      });
    }
    // Troika que cruza la plaza de vez en cuando.
    const lap = frame.elapsedMs % TROIKA.intervalMs;
    const x = TROIKA.from + (TROIKA.speed * lap) / MS_PER_SECOND;
    if (x < TROIKA.to) {
      actors.push({ y: TROIKA.y, draw: (ctx) => drawTroika(ctx, x, frame.timeMs, frame.night) });
    }
    return actors;
  },
};
