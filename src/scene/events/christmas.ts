import { WALL_TOP } from '../../config/scene_config';
import type { RenderContext } from '../../render/render_context';
import type { SceneActor } from '../actors';
import { depthScale } from '../crowd';
import { fillCircle, fillPixelRect, fillPolygon, withAlpha, type Point } from '../pixel_shapes';
import { GUM_CORNICE } from '../red_square/gum';
import { GALLERY_CORNICE } from '../red_square/st_basil';
import { drawKremlinStar } from '../red_square/architecture';
import { SKINS, hash } from './event_helpers';
import type { PlazaEvent } from './event_types';
import { FIGURE_HEIGHT, drawFigure, type FigureStyle } from './figures';
import { drawBulb, drawStall, type Stall } from './stalls';

/** Milisegundos por segundo. */
const MS_PER_SECOND = 1000;

/** Casetas del mercadillo navideño. */
const STALLS: readonly Stall[] = [
  { x: 32, foot: 342, width: 56, roof: '#b8202a' },
  { x: 92, foot: 330, width: 50, roof: '#2f7a4a' },
  { x: 468, foot: 354, width: 56, roof: '#2f7a4a' },
  { x: 574, foot: 356, width: 56, roof: '#b8202a' },
];

/** Abeto de Año Nuevo: centro, pie, altura y semiancho de la base. */
const TREE = { x: 414, foot: 304, height: 118, halfBase: 26 } as const;

/** Colores del abeto. */
const TREE_COLORS = {
  needles: '#1f5a32',
  needlesLight: '#2f7a44',
  trunk: '#4a2e1a',
  snow: '#f4f7ff',
} as const;

/** Colores de las bolas del árbol. */
const BAUBLES = ['#e0243a', '#f0c24a', '#4aa0ff', '#f4f4f4', '#d04ad0'] as const;

/** Mercancía de las casetas: dulces, adornos y bebidas calientes. */
const GOODS = ['#e0243a', '#f0c24a', '#7ac04a', '#f4f4f4', '#c87a3a'] as const;

/** Ropa de Ded Moroz y de Snegúrochka. */
const DED_MOROZ: FigureStyle = {
  body: '#c8202f',
  legs: '#c8202f',
  skin: SKINS[0],
  headwear: 'cap',
  hat: '#c8202f',
  long: true,
  beard: true,
};
const SNEGUROCHKA: FigureStyle = {
  body: '#7ab8e8',
  legs: '#7ab8e8',
  skin: SKINS[3],
  headwear: 'kokoshnik',
  hat: '#dff0ff',
  long: true,
};

/** Paseo de Ded Moroz y Snegúrochka: fila, velocidad y columnas de inicio y fin. */
const GRANDFATHER_WALK = { y: 346, speed: 9, from: -30, to: 680 } as const;

/**
 * Bombillas a lo largo de una línea.
 * @param ctx Contexto de dibujo.
 * @param from Inicio.
 * @param to Fin.
 * @param spacing Separación entre bombillas.
 * @param timeMs Tiempo de la escena.
 * @param salt Variante del parpadeo.
 */
function drawLightLine(
  ctx: RenderContext,
  from: Point,
  to: Point,
  spacing: number,
  timeMs: number,
  salt: number,
): void {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const count = Math.floor(length / spacing);
  for (let i = 0; i <= count; i++) {
    const t = i / Math.max(1, count);
    const sag = Math.sin(t * count * Math.PI) * 1.5;
    drawBulb(
      ctx,
      Math.round(from.x + (to.x - from.x) * t),
      Math.round(from.y + (to.y - from.y) * t + Math.abs(sag)),
      i + salt,
      timeMs,
      2,
    );
  }
}

/**
 * Abeto de Año Nuevo con nieve, bolas, guirnaldas y la estrella roja en la punta.
 * @param ctx Contexto de dibujo.
 * @param timeMs Tiempo de la escena.
 */
function drawNewYearTree(ctx: RenderContext, timeMs: number): void {
  const top = TREE.foot - TREE.height;
  fillPixelRect(ctx, TREE.x - 3, TREE.foot - 10, 6, 10, TREE_COLORS.trunk);
  // Pisos de ramas: triángulos que se ensanchan hacia abajo.
  const tiers = 6;
  for (let i = 0; i < tiers; i++) {
    const tierTop = top + ((TREE.height - 10) * i) / tiers;
    const tierBottom = top + ((TREE.height - 10) * (i + 1.5)) / tiers;
    const half = TREE.halfBase * ((i + 1.4) / (tiers + 0.4));
    fillPolygon(
      ctx,
      [
        { x: TREE.x, y: tierTop },
        { x: TREE.x + half, y: tierBottom },
        { x: TREE.x - half, y: tierBottom },
      ],
      TREE_COLORS.needles,
    );
    fillPolygon(
      ctx,
      [
        { x: TREE.x, y: tierTop + 1 },
        { x: TREE.x - half * 0.15, y: tierBottom - 1 },
        { x: TREE.x - half + 1, y: tierBottom - 1 },
      ],
      TREE_COLORS.needlesLight,
    );
    fillPixelRect(ctx, TREE.x - half, tierBottom - 1, half * 2, 1, TREE_COLORS.snow);
  }
  // Bolas y luces repartidas por la copa.
  for (let i = 0; i < 70; i++) {
    const t = 0.08 + hash(i, 1) * 0.86;
    const y = top + t * (TREE.height - 12);
    const half = TREE.halfBase * t * 0.9;
    const x = TREE.x + (hash(i, 2) * 2 - 1) * half;
    if (i % 3 === 0) {
      fillCircle(ctx, x, y, 1.5, BAUBLES[i % BAUBLES.length] ?? BAUBLES[0]);
    } else {
      drawBulb(ctx, Math.round(x), Math.round(y), i, timeMs);
    }
  }
  const glow = 0.25 + 0.15 * Math.sin(timeMs / 300);
  fillCircle(ctx, TREE.x, top - 4, 10, withAlpha('#ffd23a', glow));
  drawKremlinStar(ctx, TREE.x, top - 4, 6);
}

/**
 * Mercancía de una caseta: tarros y paquetes de colores.
 * @param ctx Contexto de dibujo.
 * @param left Columna izquierda del mostrador.
 * @param y Fila del mostrador.
 * @param width Ancho del mostrador.
 */
function drawGoods(ctx: RenderContext, left: number, y: number, width: number): void {
  for (let x = left, i = 0; x < left + width - 2; x += 4, i++) {
    const h = 2 + (i % 3);
    fillPixelRect(ctx, x, y - h, 3, h, GOODS[i % GOODS.length] ?? GOODS[0]);
  }
}

/** Navidad y Año Nuevo: mercadillo, abeto, luces y Ded Moroz con Snegúrochka. */
export const CHRISTMAS: PlazaEvent = {
  kind: 'christmas',
  illumination: () => ({ back: 0.22, front: 0.3 }),
  drawBackDecor: (ctx, frame) => {
    drawLightLine(
      ctx,
      { x: 0, y: WALL_TOP.from.y + 2 },
      { x: WALL_TOP.to.x, y: WALL_TOP.to.y + 1 },
      7,
      frame.timeMs,
      0,
    );
    drawLightLine(ctx, GUM_CORNICE.from, GUM_CORNICE.to, 5, frame.timeMs, 50);
  },
  drawFrontDecor: (ctx, frame) => {
    drawLightLine(ctx, GALLERY_CORNICE.from, GALLERY_CORNICE.to, 6, frame.timeMs, 100);
  },
  actors: (frame) => {
    const actors: SceneActor[] = [
      { y: TREE.foot, draw: (ctx) => drawNewYearTree(ctx, frame.timeMs) },
      ...STALLS.map((stall) => ({
        y: stall.foot,
        draw: (ctx: RenderContext) =>
          drawStall(ctx, stall, depthScale(stall.foot), frame.timeMs, true, drawGoods),
      })),
    ];
    const span = GRANDFATHER_WALK.to - GRANDFATHER_WALK.from;
    const s = depthScale(GRANDFATHER_WALK.y);
    const travelled = (GRANDFATHER_WALK.speed * s * frame.elapsedMs) / MS_PER_SECOND;
    const x = GRANDFATHER_WALK.from + (travelled % span);
    const stride = Math.sin(travelled * 0.7) * 0.6;
    actors.push(
      {
        y: GRANDFATHER_WALK.y,
        draw: (ctx) =>
          drawFigure(ctx, x, GRANDFATHER_WALK.y, FIGURE_HEIGHT * s * 1.05, DED_MOROZ, {
            stride,
            arms: 'down',
            prop: { kind: 'staff' },
            night: frame.night,
          }),
      },
      {
        y: GRANDFATHER_WALK.y + 1,
        draw: (ctx) =>
          drawFigure(
            ctx,
            x - 14 * s,
            GRANDFATHER_WALK.y + 1,
            FIGURE_HEIGHT * s * 0.92,
            SNEGUROCHKA,
            {
              stride: -stride,
              arms: 'wave',
              phase: frame.timeMs / 200,
              night: frame.night,
            },
          ),
      },
    );
    return actors;
  },
};
