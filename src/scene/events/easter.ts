import { LAWN_EDGE, SCENE_WIDTH } from '../../config/scene_config';
import type { RenderContext } from '../../render/render_context';
import type { SceneActor } from '../actors';
import { depthScale } from '../crowd';
import { fillEllipse, fillPixelRect, mixColors, withAlpha } from '../pixel_shapes';
import { SKINS, hash, pick } from './event_helpers';
import type { PlazaEvent } from './event_types';
import { FIGURE_HEIGHT, drawFigure, type FigureProp, type FigureStyle } from './figures';

/** Milisegundos por segundo. */
const MS_PER_SECOND = 1000;

/** Velocidad de la procesión (px por segundo a escala cercana). */
const PROCESSION_SPEED = 12;

/** Separación entre los participantes de la procesión (px a escala cercana). */
const PROCESSION_GAP = 11;

/** Filas de las dos hileras de la procesión. */
const PROCESSION_ROWS = [340, 347] as const;

/** Columna por la que entra la procesión (por la derecha) y por la que sale. */
const PROCESSION_X = { from: SCENE_WIDTH + 40, to: -60 } as const;

/** Colores de la Pascua. */
const COLORS = {
  vestment: '#e8c45a',
  vestmentDark: '#b8902a',
  cassock: '#1a1a22',
  banner: '#b8202a',
  bannerTrim: '#e8b947',
  wave: '#fff3c8',
} as const;

/** Campanarios que repican: centro de las campanas. */
const BELLS = { back: { x: 94, y: 120 }, front: { x: 624, y: 204 } } as const;

/** Periodo del repique (ms). */
const BELL_PERIOD_MS = 1300;

/** Huevos de Pascua gigantes: pie, altura y colores. */
const EGGS = [
  { x: 16, y: 328, height: 18, colors: ['#2f6fc4', '#f0c24a', '#f4f4f4'] },
  { x: 66, y: 340, height: 28, colors: ['#c8202f', '#f0c24a', '#2f8a4a'] },
  { x: 470, y: 352, height: 26, colors: ['#2f8a4a', '#f4f4f4', '#c8202f'] },
  { x: 592, y: 342, height: 20, colors: ['#e0506a', '#f6e6e0', '#2f6fc4'] },
] as const;

/** Ropa de los fieles. */
const FAITHFUL_CLOTHES = ['#3a3f52', '#5a3a2a', '#6a3a4a', '#2f4a3a', '#4a4a55'] as const;

/** Pañuelos de las mujeres. */
const SCARVES = ['#f2f2f2', '#e8d27a', '#d94a5a', '#7a9ad0'] as const;

/** Papel de cada puesto de la procesión, de cabeza a cola. */
type Role = 'cross' | 'banner' | 'icon' | 'bishop' | 'priest' | 'faithful';

/** Cabeza de la procesión; detrás vienen los fieles. */
const HEAD: readonly Role[] = [
  'cross',
  'banner',
  'banner',
  'icon',
  'priest',
  'bishop',
  'priest',
  'icon',
];

/** Número total de puestos de la procesión. */
const PROCESSION_LENGTH = 36;

/**
 * Ropa y objeto de un participante.
 * @param role Papel.
 * @param index Puesto.
 * @param flicker Parpadeo de la vela.
 * @returns Estilo y objeto.
 */
function participant(
  role: Role,
  index: number,
  flicker: number,
): { style: FigureStyle; prop: FigureProp } {
  const skin = pick(SKINS, index, 5);
  switch (role) {
    case 'cross':
      return {
        style: {
          body: COLORS.vestment,
          legs: COLORS.cassock,
          skin,
          headwear: 'none',
          hat: '#000',
          long: true,
        },
        prop: { kind: 'cross' },
      };
    case 'banner':
      return {
        style: {
          body: COLORS.vestmentDark,
          legs: COLORS.cassock,
          skin,
          headwear: 'none',
          hat: '#000',
          long: true,
        },
        prop: { kind: 'banner', color: COLORS.banner, trim: COLORS.bannerTrim },
      };
    case 'icon':
      return {
        style: {
          body: COLORS.cassock,
          legs: COLORS.cassock,
          skin,
          headwear: 'none',
          hat: '#000',
          long: true,
        },
        prop: { kind: 'icon' },
      };
    case 'bishop':
      return {
        style: {
          body: COLORS.vestment,
          legs: COLORS.cassock,
          skin,
          headwear: 'mitre',
          hat: COLORS.vestment,
          long: true,
          beard: true,
        },
        prop: { kind: 'candle', flicker },
      };
    case 'priest':
      return {
        style: {
          body: COLORS.vestment,
          legs: COLORS.cassock,
          skin,
          headwear: 'cap',
          hat: COLORS.cassock,
          long: true,
          beard: true,
        },
        prop: { kind: 'candle', flicker },
      };
    case 'faithful': {
      const woman = hash(index, 9) < 0.55;
      return {
        style: {
          body: pick(FAITHFUL_CLOTHES, index),
          legs: '#22222a',
          skin,
          headwear: woman ? 'scarf' : 'none',
          hat: pick(SCARVES, index, 4),
          long: woman,
        },
        prop: { kind: 'candle', flicker },
      };
    }
  }
}

/**
 * Huevo de Pascua gigante con franjas, zigzag y puntos.
 * @param ctx Contexto de dibujo.
 * @param egg Huevo.
 * @param egg.x Columna del centro.
 * @param egg.y Fila de la base.
 * @param egg.height Altura.
 * @param egg.colors Colores de fondo, franjas y adornos.
 */
function drawEgg(
  ctx: RenderContext,
  egg: {
    readonly x: number;
    readonly y: number;
    readonly height: number;
    readonly colors: readonly string[];
  },
): void {
  const [base = '#c8202f', band = '#f0c24a', dots = '#ffffff'] = egg.colors;
  const half = egg.height * 0.36;
  const top = egg.y - egg.height;
  fillEllipse(ctx, egg.x, egg.y - 1, half * 1.1, 2, withAlpha('#000000', 0.25));
  for (let y = top; y < egg.y; y++) {
    const t = (y - top) / egg.height;
    // Más estrecho arriba que abajo, como un huevo.
    const width =
      half * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.58) / 0.58, 2))) * (0.75 + t * 0.35);
    if (width < 0.5) {
      continue;
    }
    const bandRow = Math.abs(t - 0.5) < 0.08;
    const zig = Math.abs(t - 0.28) < 0.05 || Math.abs(t - 0.72) < 0.05;
    for (let x = Math.round(egg.x - width); x <= Math.round(egg.x + width); x++) {
      const rel = (x - egg.x) / width;
      let color = base;
      if (bandRow) {
        color = band;
      } else if (zig && (x + y) % 4 < 2) {
        color = dots;
      } else if ((t < 0.2 || (t > 0.36 && t < 0.42) || t > 0.8) && (x * 3 + y * 5) % 7 === 0) {
        color = dots;
      }
      if (rel > 0.45) {
        color = mixColors(color, '#1a1020', 0.35);
      } else if (rel < -0.6) {
        color = mixColors(color, '#ffffff', 0.25);
      }
      fillPixelRect(ctx, x, y, 1, 1, color);
    }
  }
}

/**
 * Ondas del repique de unas campanas.
 * @param ctx Contexto de dibujo.
 * @param center Campanas.
 * @param center.x Columna.
 * @param center.y Fila.
 * @param timeMs Tiempo de la escena.
 */
function drawBellWaves(
  ctx: RenderContext,
  center: { readonly x: number; readonly y: number },
  timeMs: number,
): void {
  for (let ring = 0; ring < 3; ring++) {
    const t = ((timeMs + ring * (BELL_PERIOD_MS / 3)) % BELL_PERIOD_MS) / BELL_PERIOD_MS;
    const radius = 6 + t * 20;
    const color = withAlpha(COLORS.wave, (1 - t) * 0.8);
    for (let a = -0.9; a <= 0.9; a += 0.12) {
      for (const side of [-1, 1]) {
        fillPixelRect(
          ctx,
          Math.round(center.x + side * Math.cos(a) * radius),
          Math.round(center.y + Math.sin(a) * radius * 0.8),
          1,
          1,
          color,
        );
      }
    }
  }
}

/**
 * Fieles que esperan con velas a ambos lados de la plaza.
 * @param timeMs Tiempo de la escena.
 * @param night Nivel de noche.
 * @returns Actores.
 */
function waitingFaithful(timeMs: number, night: number): SceneActor[] {
  const actors: SceneActor[] = [];
  const edgeAt = (x: number): number =>
    LAWN_EDGE.from.y + ((LAWN_EDGE.to.y - LAWN_EDGE.from.y) * x) / LAWN_EDGE.to.x;
  const place = (x: number, y: number, index: number): void => {
    const { style, prop } = participant(
      'faithful',
      index,
      Math.round(Math.sin(timeMs / 90 + index) + 1),
    );
    actors.push({
      y,
      draw: (ctx) =>
        drawFigure(ctx, x, y, FIGURE_HEIGHT * depthScale(y), style, {
          stride: 0,
          arms: 'down',
          prop,
          night,
        }),
    });
  };
  for (let i = 0; i < 22; i++) {
    const x = 6 + i * 10 + (i % 2) * 3;
    place(x, Math.round(edgeAt(x) + 4 + (i % 2) * 3), i + 100);
  }
  for (let i = 0; i < 16; i++) {
    place(438 + i * 10 + (i % 2) * 2, 323 + (i % 2), i + 200);
  }
  return actors;
}

/** Pascua ortodoxa de noche: procesión con velas, campanas y huevos gigantes. */
export const EASTER: PlazaEvent = {
  kind: 'easter',
  illumination: () => ({ back: 0.3, front: 0.6 }),
  drawBackDecor: (ctx, frame) => drawBellWaves(ctx, BELLS.back, frame.timeMs),
  drawFrontDecor: (ctx, frame) => drawBellWaves(ctx, BELLS.front, frame.timeMs + 400),
  actors: (frame) => {
    const actors: SceneActor[] = [
      ...EGGS.map((egg) => ({ y: egg.y, draw: (ctx: RenderContext) => drawEgg(ctx, egg) })),
      ...waitingFaithful(frame.timeMs, frame.night),
    ];
    const travelled = (PROCESSION_SPEED * frame.elapsedMs) / MS_PER_SECOND;
    for (let i = 0; i < PROCESSION_LENGTH; i++) {
      const role: Role = HEAD[i] ?? 'faithful';
      // La cabeza va en una sola fila; los fieles, en dos.
      const inHead = i < HEAD.length;
      const row = inHead
        ? PROCESSION_ROWS[0]
        : i % 2 === 0
          ? PROCESSION_ROWS[0]
          : PROCESSION_ROWS[1];
      const place = inHead ? i : HEAD.length + Math.floor((i - HEAD.length) / 2);
      const s = depthScale(row);
      const x = PROCESSION_X.from - (travelled - place * PROCESSION_GAP) * s;
      if (x > PROCESSION_X.from + 1 || x < PROCESSION_X.to) {
        continue;
      }
      const flicker = Math.round(Math.sin(frame.timeMs / 80 + i * 1.7) + 1);
      const { style, prop } = participant(role, i, flicker);
      actors.push({
        y: row,
        draw: (ctx) =>
          drawFigure(ctx, x, row, FIGURE_HEIGHT * s, style, {
            stride: Math.sin((travelled + i * 3) * 0.5) * 0.6,
            arms: 'down',
            prop,
            night: frame.night,
          }),
      });
    }
    return actors;
  },
};
