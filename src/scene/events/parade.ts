import { LAWN_EDGE, SCENE_WIDTH } from '../../config/scene_config';
import type { RenderContext } from '../../render/render_context';
import type { SceneActor } from '../actors';
import { depthScale } from '../crowd';
import { drawLine, fillPixelRect, fillPolygon, mixColors, withAlpha } from '../pixel_shapes';
import { RUSSIAN_FLAG, SKINS, pick } from './event_helpers';
import type { EventFrame, PlazaEvent } from './event_types';
import { FIGURE_HEIGHT, drawFigure, type FigureStyle } from './figures';

/** Milisegundos por segundo. */
const MS_PER_SECOND = 1000;

/** Tipo de unidad del desfile. */
type UnitKind = 'infantry' | 'sailors' | 'guard' | 'cadets' | 'tank' | 'katyusha';

/** Orden de las unidades (se repite si el desfile dura más). */
const UNIT_ORDER: readonly UnitKind[] = [
  'guard',
  'infantry',
  'sailors',
  'cadets',
  'tank',
  'tank',
  'tank',
  'katyusha',
  'katyusha',
  'infantry',
];

/** Uniformes de las tropas a pie. */
const UNIFORMS: Readonly<Record<Exclude<UnitKind, 'tank' | 'katyusha'>, FigureStyle>> = {
  guard: { body: '#3a4a5a', legs: '#26303a', skin: SKINS[0], headwear: 'cap', hat: '#2a3644' },
  infantry: { body: '#6b7a3a', legs: '#3e4a24', skin: SKINS[1], headwear: 'cap', hat: '#4a5a2a' },
  sailors: { body: '#1e2236', legs: '#1e2236', skin: SKINS[2], headwear: 'sailor', hat: '#f4f4f4' },
  cadets: { body: '#1a1a22', legs: '#3a1a1e', skin: SKINS[3], headwear: 'cap', hat: '#c8202f' },
};

/** Primera unidad: sale nada más empezar (ms). */
const FIRST_UNIT_MS = 1500;

/** Separación entre unidades (ms). */
const UNIT_INTERVAL_MS = 6500;

/** Velocidad de marcha, la misma para tropas y vehículos (px por segundo). */
const MARCH_SPEED = 17;

/** Columna de entrada y de salida del desfile. */
const PATH_X = { from: -90, to: SCENE_WIDTH + 90 } as const;

/** Filas de las tres hileras de una formación y de los vehículos. */
const RANKS = [331, 337, 343] as const;
const VEHICLE_ROW = 345;

/** Columnas de una formación respecto a su primera fila (a escala cercana). */
const FILES = [0, 9, 18, 27, 36] as const;

/** Colores de la Bandera de la Victoria y de los vehículos. */
const COLORS = {
  victoryBanner: '#c8202f',
  bannerGold: '#e8b947',
  armor: '#4b5a32',
  armorDark: '#323d20',
  armorLight: '#6a7a48',
  track: '#25251f',
  wheel: '#5a5a4a',
  star: '#d8202f',
  rail: '#2a2a22',
  rocket: '#8a8a7a',
  jet: '#5a6170',
  jetLight: '#8a92a2',
} as const;

/** Estelas de colores de los aviones (blanco, azul y rojo, como la bandera). */
const TRAILS = RUSSIAN_FLAG;

/** Pasadas de los aviones (fracción de la duración del evento en que empiezan). */
const FLYOVERS = [0.32, 0.68] as const;

/** Velocidad de los aviones (px por segundo) y fila por la que pasan. */
const JET = { speed: 140, y: 46 } as const;

/** Mástiles con banderas en el césped y en la explanada de San Basilio. */
const FLAGPOLES = [
  { x: 48, foot: 303, height: 54, stripes: RUSSIAN_FLAG },
  { x: 108, foot: 300, height: 48, stripes: [COLORS.victoryBanner] },
  { x: 430, foot: 324, height: 50, stripes: [COLORS.victoryBanner] },
  { x: 604, foot: 324, height: 56, stripes: RUSSIAN_FLAG },
] as const;

/**
 * Dibuja un tanque T-34 de perfil, hacia la derecha.
 * @param ctx Contexto de dibujo.
 * @param x Columna del centro.
 * @param y Fila de las cadenas.
 * @param s Escala.
 * @param distance Distancia recorrida (para girar las ruedas).
 */
function drawTank(ctx: RenderContext, x: number, y: number, s: number, distance: number): void {
  const u = (value: number): number => Math.round(value * s);
  fillPixelRect(ctx, x - u(19), y - u(6), u(38), u(6), COLORS.track);
  for (let i = 0; i < 5; i++) {
    const wx = x - u(15) + u(7.5 * i);
    fillPixelRect(ctx, wx, y - u(5), u(4), u(4), COLORS.wheel);
    fillPixelRect(
      ctx,
      wx + ((Math.floor(distance / 3) + i) % 2 === 0 ? 1 : u(2)),
      y - u(4),
      1,
      1,
      COLORS.track,
    );
  }
  fillPolygon(
    ctx,
    [
      { x: x - u(20), y: y - u(6) },
      { x: x - u(17), y: y - u(11) },
      { x: x + u(14), y: y - u(11) },
      { x: x + u(21), y: y - u(6) },
    ],
    COLORS.armor,
  );
  fillPixelRect(ctx, x - u(17), y - u(11), u(31), 1, COLORS.armorLight);
  fillPolygon(
    ctx,
    [
      { x: x - u(9), y: y - u(11) },
      { x: x - u(7), y: y - u(17) },
      { x: x + u(6), y: y - u(17) },
      { x: x + u(9), y: y - u(11) },
    ],
    COLORS.armorDark,
  );
  fillPixelRect(ctx, x + u(8), y - u(15), u(16), Math.max(1, u(1.5)), COLORS.armorDark);
  fillPixelRect(ctx, x - u(2), y - u(15), Math.max(1, u(3)), Math.max(1, u(3)), COLORS.star);
}

/**
 * Dibuja un lanzacohetes Katiusha (camión con rampa de cohetes), hacia la derecha.
 * @param ctx Contexto de dibujo.
 * @param x Columna del centro.
 * @param y Fila de las ruedas.
 * @param s Escala.
 */
function drawKatyusha(ctx: RenderContext, x: number, y: number, s: number): void {
  const u = (value: number): number => Math.round(value * s);
  for (const wx of [x - u(14), x - u(6), x + u(12)]) {
    fillPixelRect(ctx, wx - u(3), y - u(6), u(6), u(6), COLORS.track);
    fillPixelRect(ctx, wx - 1, y - u(4), u(2), u(2), COLORS.wheel);
  }
  fillPixelRect(ctx, x - u(19), y - u(9), u(30), u(4), COLORS.armorDark);
  fillPolygon(
    ctx,
    [
      { x: x + u(11), y: y - u(5) },
      { x: x + u(11), y: y - u(15) },
      { x: x + u(17), y: y - u(15) },
      { x: x + u(21), y: y - u(9) },
      { x: x + u(21), y: y - u(5) },
    ],
    COLORS.armor,
  );
  fillPixelRect(ctx, x + u(13), y - u(14), u(4), u(4), COLORS.armorLight);
  // Rampa inclinada con los cohetes.
  for (let i = 0; i < 4; i++) {
    const from = { x: x - u(18), y: y - u(10) - i * Math.max(1, u(1.5)) };
    const to = { x: x + u(8), y: y - u(17) - i * Math.max(1, u(1.5)) };
    drawLine(ctx, from, to, 1, i % 2 === 0 ? COLORS.rail : COLORS.rocket);
  }
}

/**
 * Actores de una unidad en un instante: soldados en formación o un vehículo.
 * @param kind Tipo de unidad.
 * @param index Índice de la unidad (para los colores de piel).
 * @param travelled Distancia recorrida desde la entrada (px a escala cercana).
 * @param timeMs Tiempo de la escena.
 * @returns Actores de la unidad.
 */
function unitActors(
  kind: UnitKind,
  index: number,
  travelled: number,
  timeMs: number,
): SceneActor[] {
  if (kind === 'tank' || kind === 'katyusha') {
    const s = depthScale(VEHICLE_ROW);
    const x = PATH_X.from + travelled * s;
    return [
      {
        y: VEHICLE_ROW,
        draw: (ctx) =>
          kind === 'tank'
            ? drawTank(ctx, x, VEHICLE_ROW, s * 1.25, travelled)
            : drawKatyusha(ctx, x, VEHICLE_ROW, s * 1.25),
      },
    ];
  }
  const uniform = UNIFORMS[kind];
  const stride = Math.sin(travelled * 0.55);
  const actors: SceneActor[] = [];
  RANKS.forEach((row, rank) => {
    const s = depthScale(row);
    const leadX = PATH_X.from + travelled * s;
    FILES.forEach((offset, file) => {
      const style = { ...uniform, skin: pick(SKINS, index * 31 + rank * 7 + file) };
      actors.push({
        y: row,
        draw: (ctx) =>
          drawFigure(ctx, leadX - offset * s, row, FIGURE_HEIGHT * s, style, {
            stride,
            arms: 'down',
            prop: { kind: 'rifle' },
          }),
      });
    });
  });
  // Abanderado con la Bandera de la Victoria delante de la formación.
  const row = RANKS[1];
  const s = depthScale(row);
  actors.push({
    y: row,
    draw: (ctx) =>
      drawFigure(ctx, PATH_X.from + travelled * s + 14 * s, row, FIGURE_HEIGHT * s, uniform, {
        stride,
        arms: 'down',
        prop: {
          kind: 'flag',
          stripes: [COLORS.victoryBanner, COLORS.victoryBanner, COLORS.bannerGold],
          wave: timeMs / 160,
        },
      }),
  });
  return actors;
}

/**
 * Público a lo largo del césped de la muralla, saludando con banderitas.
 * @param frame Fotograma del evento.
 * @returns Actores del público.
 */
function spectators(frame: EventFrame): SceneActor[] {
  const actors: SceneActor[] = [];
  const edgeAt = (x: number): number =>
    LAWN_EDGE.from.y + ((LAWN_EDGE.to.y - LAWN_EDGE.from.y) * x) / LAWN_EDGE.to.x;
  for (let i = 0; i < 26; i++) {
    const x = 4 + i * 9 + (i % 3);
    const y = Math.round(edgeAt(x) + 3 + (i % 2) * 3);
    actors.push(cheeringFan(x, y, i, frame.timeMs));
  }
  for (let i = 0; i < 18; i++) {
    const x = 436 + i * 9 + (i % 2) * 3;
    actors.push(cheeringFan(x, 323 + (i % 2), i + 40, frame.timeMs));
  }
  return actors;
}

/**
 * Espectador que saluda con una banderita.
 * @param x Columna.
 * @param y Fila de los pies.
 * @param index Índice (colores y ritmo).
 * @param timeMs Tiempo de la escena.
 * @returns Actor.
 */
function cheeringFan(x: number, y: number, index: number, timeMs: number): SceneActor {
  const clothes = ['#b23a4a', '#3a5aa0', '#e8e2d0', '#2f7a6a', '#6a3a7a', '#e2623a'] as const;
  const style: FigureStyle = {
    body: pick(clothes, index),
    legs: '#2a2a32',
    skin: pick(SKINS, index, 2),
    headwear: index % 3 === 0 ? 'scarf' : 'none',
    hat: pick(clothes, index, 3),
  };
  const s = depthScale(y);
  return {
    y,
    draw: (ctx) =>
      drawFigure(ctx, x, y, FIGURE_HEIGHT * s, style, {
        stride: 0,
        arms: 'wave',
        phase: timeMs / 180 + index,
        prop:
          index % 2 === 0
            ? { kind: 'flag', stripes: RUSSIAN_FLAG, wave: timeMs / 150 + index }
            : undefined,
      }),
  };
}

/**
 * Mástil con una bandera ondeando.
 * @param pole Mástil.
 * @param pole.x Columna.
 * @param pole.foot Fila del pie.
 * @param pole.height Altura.
 * @param pole.stripes Franjas de la bandera.
 * @param timeMs Tiempo de la escena.
 * @returns Actor.
 */
function flagpole(
  pole: {
    readonly x: number;
    readonly foot: number;
    readonly height: number;
    readonly stripes: readonly string[];
  },
  timeMs: number,
): SceneActor {
  return {
    y: pole.foot,
    draw: (ctx) => {
      const top = pole.foot - pole.height;
      fillPixelRect(ctx, pole.x, top, 1, pole.height, '#c9c2b6');
      fillPixelRect(ctx, pole.x, top - 2, 1, 2, COLORS.bannerGold);
      const width = Math.round(pole.height * 0.45);
      const stripe = Math.max(2, Math.round((pole.height * 0.3) / pole.stripes.length));
      for (let col = 0; col < width; col++) {
        const wave = Math.round(Math.sin(timeMs / 220 + col * 0.35) * 2 * (col / width));
        pole.stripes.forEach((color, i) => {
          const shade = col % 6 < 2 ? mixColors(color, '#000000', 0.12) : color;
          fillPixelRect(ctx, pole.x + 1 + col, top + 1 + wave + i * stripe, 1, stripe, shade);
        });
      }
    },
  };
}

/**
 * Dibuja una pasada de aviones en formación con estelas de colores.
 * @param ctx Contexto de dibujo.
 * @param progressMs Tiempo desde que empezó la pasada.
 */
function drawFlyover(ctx: RenderContext, progressMs: number): void {
  const leadX = -40 + (JET.speed * progressMs) / MS_PER_SECOND;
  const formation = [
    { dx: 0, dy: 0, trail: TRAILS[1] },
    { dx: -14, dy: -7, trail: TRAILS[0] },
    { dx: -14, dy: 7, trail: TRAILS[2] },
    { dx: -28, dy: -14, trail: null },
    { dx: -28, dy: 14, trail: null },
  ];
  for (const jet of formation) {
    const x = leadX + jet.dx;
    const y = JET.y + jet.dy;
    if (jet.trail !== null) {
      const start = Math.max(-40, x - 360);
      fillPixelRect(ctx, start, y, x - 8 - start, 2, withAlpha(jet.trail, 0.75));
    }
    fillPolygon(
      ctx,
      [
        { x: x - 8, y: y },
        { x: x + 4, y: y - 1 },
        { x: x + 8, y: y + 1 },
        { x: x - 8, y: y + 2 },
      ],
      COLORS.jet,
    );
    fillPolygon(
      ctx,
      [
        { x: x - 3, y: y + 1 },
        { x: x - 7, y: y + 5 },
        { x: x - 4, y: y + 5 },
        { x: x + 1, y: y + 1 },
      ],
      COLORS.jetLight,
    );
    fillPixelRect(ctx, x - 8, y - 3, 2, 3, COLORS.jet);
  }
}

/** Desfile de la Victoria: tropas, tanques, aviones y público con banderas. */
export const PARADE: PlazaEvent = {
  kind: 'parade',
  drawSky: (ctx, frame) => {
    for (const start of FLYOVERS) {
      const progress = frame.elapsedMs - start * frame.durationMs;
      if (progress > 0 && progress < ((SCENE_WIDTH + 500) / JET.speed) * MS_PER_SECOND) {
        drawFlyover(ctx, progress);
      }
    }
  },
  actors: (frame) => {
    const actors: SceneActor[] = [
      ...FLAGPOLES.map((pole) => flagpole(pole, frame.timeMs)),
      ...spectators(frame),
    ];
    const pathLength = PATH_X.to - PATH_X.from;
    for (let index = 0; ; index++) {
      const startMs = FIRST_UNIT_MS + index * UNIT_INTERVAL_MS;
      if (startMs > frame.elapsedMs) {
        break;
      }
      const kind = UNIT_ORDER[index % UNIT_ORDER.length] ?? 'infantry';
      const travelled = (MARCH_SPEED * (frame.elapsedMs - startMs)) / MS_PER_SECOND;
      if (travelled * depthScale(VEHICLE_ROW) < pathLength + 60) {
        actors.push(...unitActors(kind, index, travelled, frame.timeMs));
      }
    }
    return actors;
  },
};
