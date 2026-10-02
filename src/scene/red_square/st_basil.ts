import type { RenderContext } from '../../render/render_context';
import { fillPixelRect, fillPolygon, mixColors } from '../pixel_shapes';
import { fillPatterned, type PixelRect, type RoofLine, type SceneryPiece } from '../scenery';
import {
  STONE,
  drawKokoshniks,
  drawTentRoof,
  drawTree,
  drawWindowRow,
  fillBlock,
} from './architecture';

/** Colores propios de la catedral. */
const COLORS = {
  tent: '#c8483a',
  tentLight: '#f2e6d0',
  porch: '#3d8a52',
  porchLight: '#7cc08a',
  belfryTent: '#2f6e4a',
  belfryTentLight: '#4f9a66',
  platform: '#bfb6a6',
  platformShade: '#8f877a',
} as const;

/** Ladrillo de la catedral. */
const BRICK = { front: STONE.brick, side: STONE.brickDark } as const;

/** Dibujo de una cúpula de bulbo. */
type DomePattern = 'spiral' | 'zigzag' | 'stripes' | 'scales';

/** Cúpula con su tambor. */
interface Dome {
  /** Centro x. */
  readonly cx: number;
  /** Fila de la base del bulbo (encima del tambor). */
  readonly baseY: number;
  /** Semiancho máximo del bulbo. */
  readonly halfWidth: number;
  /** Alto del bulbo. */
  readonly height: number;
  /** Fila donde acaba el tambor por abajo. */
  readonly drumBottom: number;
  readonly pattern: DomePattern;
  /** Los dos colores del dibujo. */
  readonly colors: readonly [string, string];
}

/** Cúpulas de detrás de la torre central, de izquierda a derecha. */
const BACK_DOMES: readonly Dome[] = [
  {
    cx: 462,
    baseY: 214,
    halfWidth: 15,
    height: 30,
    drumBottom: 268,
    pattern: 'spiral',
    colors: ['#3e9a4f', '#f0c24a'],
  },
  {
    cx: 487,
    baseY: 200,
    halfWidth: 11,
    height: 24,
    drumBottom: 268,
    pattern: 'scales',
    colors: ['#e8b947', '#a77b1f'],
  },
  {
    cx: 541,
    baseY: 198,
    halfWidth: 12,
    height: 26,
    drumBottom: 268,
    pattern: 'zigzag',
    colors: ['#e0506a', '#f6e6e0'],
  },
  {
    cx: 568,
    baseY: 214,
    halfWidth: 15,
    height: 30,
    drumBottom: 268,
    pattern: 'spiral',
    colors: ['#2f9a6e', '#f2ead8'],
  },
];

/** Cúpulas de delante de la torre central. */
const FRONT_DOMES: readonly Dome[] = [
  {
    cx: 514,
    baseY: 232,
    halfWidth: 11,
    height: 22,
    drumBottom: 270,
    pattern: 'scales',
    colors: ['#e2a33a', '#3e8f4a'],
  },
  {
    cx: 553,
    baseY: 240,
    halfWidth: 7,
    height: 15,
    drumBottom: 270,
    pattern: 'stripes',
    colors: ['#2f8fa0', '#f0c24a'],
  },
];

/** Cornisa de la galería de la base (para colgar adornos). */
export const GALLERY_CORNICE = { from: { x: 432, y: 267 }, to: { x: 598, y: 267 } } as const;

/** Centro x de la torre central. */
const TOWER_X = 514;

/** Proporción del alto del bulbo donde está su parte más ancha. */
const BULGE_AT = 0.42;

/** Ancho relativo del cuello del bulbo respecto a su parte más ancha. */
const NECK_RATIO = 0.62;

/**
 * Semiancho del bulbo a una altura relativa `t` (0 en la base, 1 en la punta).
 * @param halfWidth Semiancho máximo.
 * @param t Altura relativa.
 * @returns Semiancho en esa fila.
 */
function bulbHalfWidth(halfWidth: number, t: number): number {
  if (t < BULGE_AT) {
    return halfWidth * (NECK_RATIO + (1 - NECK_RATIO) * Math.sin((t / BULGE_AT) * (Math.PI / 2)));
  }
  const fall = (t - BULGE_AT) / (1 - BULGE_AT);
  return halfWidth * Math.pow(Math.cos(fall * (Math.PI / 2)), 1.3);
}

/**
 * Color del dibujo de una cúpula en un píxel, con sombra a la derecha y brillo a la
 * izquierda para dar volumen.
 * @param dome Cúpula.
 * @param x Columna.
 * @param y Fila.
 * @param half Semiancho del bulbo en esa fila.
 * @returns Color del píxel.
 */
function domeColorAt(dome: Dome, x: number, y: number, half: number): string {
  const dx = x - dome.cx;
  const rel = half > 0 ? dx / half : 0;
  const period = 6;
  const wrap = (value: number): number => ((value % period) + period) % period;
  let useSecond: boolean;
  switch (dome.pattern) {
    case 'spiral':
      useSecond = wrap(dx + y) < 3;
      break;
    case 'zigzag':
      useSecond = wrap(Math.abs(dx) + y) < 3;
      break;
    case 'stripes':
      useSecond = Math.floor((rel + 1) * 3.5) % 2 === 0;
      break;
    case 'scales': {
      const row = Math.floor(y / 3);
      useSecond = (row + Math.floor((dx + (row % 2) * 2) / 3)) % 2 === 0;
      break;
    }
  }
  const base = useSecond ? dome.colors[1] : dome.colors[0];
  if (rel > 0.4) {
    return mixColors(base, STONE.shade, 0.3 + (rel - 0.4) * 0.6);
  }
  if (rel < -0.55) {
    return mixColors(base, '#ffffff', 0.2);
  }
  return base;
}

/**
 * Dibuja una cúpula de bulbo con contorno, su tambor con ventanas, la aguja y la cruz.
 * @param ctx Contexto de dibujo.
 * @param dome Cúpula.
 * @param windows Lista donde se añaden sus ventanas.
 */
function drawDome(ctx: RenderContext, dome: Dome, windows: PixelRect[]): void {
  const top = dome.baseY - dome.height;
  const drumHalf = Math.round(dome.halfWidth * 0.68);
  const drumHeight = dome.drumBottom - dome.baseY;
  if (drumHeight > 0) {
    fillBlock(ctx, dome.cx - drumHalf, dome.baseY, drumHalf * 2 + 1, drumHeight, BRICK, 0.28);
    fillPixelRect(ctx, dome.cx - drumHalf - 1, dome.baseY + 1, drumHalf * 2 + 3, 2, STONE.white);
    drawKokoshniks(
      ctx,
      dome.cx - drumHalf,
      dome.cx + drumHalf + 1,
      dome.baseY + Math.min(drumHeight, 12),
      Math.max(2, Math.round(drumHalf / 3)),
      5,
      STONE.white,
    );
    if (drumHeight > 18) {
      const count = Math.max(1, Math.floor((drumHalf * 2 - 2) / 4));
      drawWindowRow(ctx, windows, dome.cx - drumHalf + 2, dome.baseY + 16, count, 4, {
        width: 1,
        height: 5,
      });
    }
  }
  const rowSpan =
    (grow: number) =>
    (y: number): readonly [number, number] | null => {
      const t = (dome.baseY - y) / dome.height;
      if (t < 0 || t > 1) {
        return null;
      }
      const half = bulbHalfWidth(dome.halfWidth, t) + grow;
      return [dome.cx - half, dome.cx + half];
    };
  fillPatterned(ctx, top - 1, dome.baseY, rowSpan(1), () => STONE.outline);
  fillPatterned(ctx, top + 1, dome.baseY, rowSpan(0), (x, y) =>
    domeColorAt(dome, x, y, bulbHalfWidth(dome.halfWidth, (dome.baseY - y) / dome.height)),
  );
  // Aguja dorada y cruz ortodoxa.
  const crossHeight = Math.max(4, Math.round(dome.height * 0.3));
  fillPixelRect(ctx, dome.cx, top - crossHeight, 1, crossHeight, STONE.gold);
  fillPixelRect(ctx, dome.cx - 2, top - crossHeight + 2, 5, 1, STONE.gold);
  fillPixelRect(ctx, dome.cx - 1, top - crossHeight + 4, 3, 1, STONE.gold);
}

/**
 * Torre central: cuerpo con dos filas de kokóshniks, cubierta de tienda con rombos y
 * una pequeña cúpula dorada.
 * @param ctx Contexto de dibujo.
 * @param windows Lista donde se añaden sus ventanas.
 */
function drawCentralTower(ctx: RenderContext, windows: PixelRect[]): void {
  const cx = TOWER_X;
  fillBlock(ctx, cx - 17, 204, 34, 64, BRICK);
  fillPixelRect(ctx, cx - 18, 204, 36, 3, STONE.white);
  drawKokoshniks(ctx, cx - 17, cx + 17, 220, 4, 9, STONE.white);
  drawKokoshniks(ctx, cx - 17, cx + 17, 232, 5, 8, STONE.white);
  drawWindowRow(ctx, windows, cx - 12, 240, 5, 6, { width: 2, height: 9 });
  drawTentRoof(ctx, {
    cx,
    apexY: 118,
    baseY: 204,
    halfBase: 16,
    color: COLORS.tent,
    accent: COLORS.tentLight,
    pattern: 'diamonds',
  });
  fillPixelRect(ctx, cx - 4, 112, 9, 6, STONE.gold);
  drawDome(
    ctx,
    {
      cx,
      baseY: 112,
      halfWidth: 5,
      height: 11,
      drumBottom: 112,
      pattern: 'stripes',
      colors: [STONE.gold, STONE.goldDark],
    },
    windows,
  );
}

/**
 * Pórtico con escalera cubierta por una pequeña tienda verde.
 * @param ctx Contexto de dibujo.
 * @param cx Centro x.
 */
function drawPorch(ctx: RenderContext, cx: number): void {
  fillBlock(ctx, cx - 7, 288, 14, 30, BRICK);
  fillPolygon(
    ctx,
    [
      { x: cx - 4, y: 318 },
      { x: cx - 4, y: 302 },
      { x: cx, y: 297 },
      { x: cx + 4, y: 302 },
      { x: cx + 4, y: 318 },
    ],
    STONE.shade,
  );
  drawTentRoof(ctx, {
    cx,
    apexY: 268,
    baseY: 288,
    halfBase: 9,
    color: COLORS.porch,
    accent: COLORS.porchLight,
    pattern: 'plain',
  });
  fillPixelRect(ctx, cx, 263, 1, 5, STONE.gold);
}

/**
 * Galería de la base con dos filas de arcos blancos.
 * @param ctx Contexto de dibujo.
 * @param windows Lista donde se añaden sus ventanas.
 */
function drawGallery(ctx: RenderContext, windows: PixelRect[]): void {
  fillBlock(ctx, 432, 266, 166, 52, BRICK, 0.22);
  fillPixelRect(ctx, 431, 266, 168, 3, STONE.white);
  fillPixelRect(ctx, 432, 300, 166, 2, STONE.white);
  fillPixelRect(ctx, 432, 312, 166, 6, STONE.brickDark);
  for (const [top, bottom] of [[276, 298]] as const) {
    for (let x = 438; x < 590; x += 12) {
      fillPolygon(
        ctx,
        [
          { x, y: bottom },
          { x, y: top + 4 },
          { x: x + 4, y: top },
          { x: x + 8, y: top + 4 },
          { x: x + 8, y: bottom },
        ],
        STONE.white,
      );
      const rect = { x: x + 2, y: top + 5, width: 5, height: bottom - top - 6 };
      fillPixelRect(ctx, rect.x, rect.y, rect.width, rect.height, STONE.window);
      windows.push(rect);
    }
  }
  drawWindowRow(ctx, windows, 440, 305, 13, 12, { width: 4, height: 5 }, null);
}

/**
 * Campanario a la derecha de la catedral, cortado por el borde de la escena.
 * @param ctx Contexto de dibujo.
 * @param windows Lista donde se añaden sus ventanas.
 */
function drawBellTower(ctx: RenderContext, windows: PixelRect[]): void {
  const cx = 624;
  fillBlock(ctx, cx - 13, 214, 26, 104, BRICK);
  fillPixelRect(ctx, cx - 14, 214, 28, 2, STONE.white);
  fillPixelRect(ctx, cx - 13, 262, 26, 1, STONE.whiteShade);
  drawWindowRow(ctx, windows, cx - 8, 230, 3, 7, { width: 3, height: 8 });
  fillBlock(ctx, cx - 11, 194, 22, 20, { front: STONE.white, side: STONE.whiteShade });
  for (let i = 0; i < 3; i++) {
    const x = cx - 9 + i * 7;
    fillPolygon(
      ctx,
      [
        { x, y: 212 },
        { x, y: 201 },
        { x: x + 2, y: 198 },
        { x: x + 4, y: 201 },
        { x: x + 4, y: 212 },
      ],
      STONE.shade,
    );
  }
  drawTentRoof(ctx, {
    cx,
    apexY: 158,
    baseY: 194,
    halfBase: 12,
    color: COLORS.belfryTent,
    accent: COLORS.belfryTentLight,
    pattern: 'stripes',
  });
  drawDome(
    ctx,
    {
      cx,
      baseY: 158,
      halfWidth: 4,
      height: 9,
      drumBottom: 158,
      pattern: 'stripes',
      colors: [COLORS.belfryTent, COLORS.belfryTentLight],
    },
    windows,
  );
}

/**
 * Catedral de San Basilio a la derecha, en primer plano, con su campanario.
 * @returns El elemento del decorado.
 */
export function createStBasil(): SceneryPiece {
  const windows: PixelRect[] = [];
  const roofs: RoofLine[] = [
    { from: { x: 431, y: 265 }, to: { x: 599, y: 265 }, thickness: 3 },
    { from: { x: 420, y: 317 }, to: { x: 640, y: 317 }, thickness: 2 },
    { from: { x: 514, y: 120 }, to: { x: 499, y: 203 }, thickness: 2 },
    { from: { x: 496, y: 203 }, to: { x: 532, y: 203 }, thickness: 2 },
    { from: { x: 446, y: 269 }, to: { x: 437, y: 287 }, thickness: 1 },
    { from: { x: 584, y: 269 }, to: { x: 575, y: 287 }, thickness: 1 },
    { from: { x: 624, y: 160 }, to: { x: 612, y: 193 }, thickness: 1 },
    { from: { x: 610, y: 213 }, to: { x: 638, y: 213 }, thickness: 2 },
  ];
  return {
    windows,
    roofs,
    draw: (ctx) => {
      windows.length = 0;
      drawTree(ctx, 600, 318, 16);
      drawTree(ctx, 590, 318, 11);
      drawBellTower(ctx, windows);
      BACK_DOMES.forEach((dome) => drawDome(ctx, dome, windows));
      drawCentralTower(ctx, windows);
      FRONT_DOMES.forEach((dome) => drawDome(ctx, dome, windows));
      drawGallery(ctx, windows);
      drawPorch(ctx, 446);
      drawPorch(ctx, 584);
      fillPixelRect(ctx, 419, 317, 222, 10, STONE.outline);
      fillPixelRect(ctx, 420, 318, 220, 8, COLORS.platform);
      fillPixelRect(ctx, 420, 324, 220, 2, COLORS.platformShade);
    },
  };
}
