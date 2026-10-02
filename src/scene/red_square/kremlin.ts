import { WALL_FOOT } from '../../config/scene_config';
import type { RenderContext } from '../../render/render_context';
import { fillCircle, fillPixelRect, fillPolygon, mixColors, type Point } from '../pixel_shapes';
import type { PixelRect, RoofLine, SceneryPiece } from '../scenery';
import {
  STONE,
  drawKokoshniks,
  drawKremlinStar,
  drawMerlons,
  drawPinnacle,
  drawTentRoof,
  drawTree,
  drawWindowRow,
  fillBlock,
} from './architecture';

/** Colores propios del Kremlin. */
const COLORS = {
  spire: '#2f7a4a',
  spireLight: '#5fae74',
  slate: '#2c4743',
  slateLight: '#4c6e66',
  clockFace: '#1c2c4a',
} as const;

/** Colores del ladrillo de las torres. */
const BRICK = { front: STONE.brick, side: STONE.brickDark } as const;

/** Borde superior de la muralla: del borde izquierdo al fondo de la plaza. */
const WALL_TOP = { from: { x: 0, y: 214 }, to: { x: 300, y: 250 } } as const;

/** Centro x de la torre Spásskaya. */
const SPASSKAYA_X = 94;

/** Centro y radio del reloj de la torre Spásskaya. */
export const CLOCK = { cx: SPASSKAYA_X, cy: 146, radius: 9 } as const;

/**
 * Fila de una recta (definida por dos puntos) en una columna.
 * @param line Recta.
 * @param line.from Primer punto.
 * @param line.to Segundo punto.
 * @param x Columna.
 * @returns Fila.
 */
function rowAt(line: { readonly from: Point; readonly to: Point }, x: number): number {
  return line.from.y + ((line.to.y - line.from.y) * (x - line.from.x)) / (line.to.x - line.from.x);
}

/**
 * Muralla en perspectiva desde el borde izquierdo hasta el fondo de la plaza.
 * @param ctx Contexto de dibujo.
 */
function drawWall(ctx: RenderContext): void {
  const face: Point[] = [WALL_TOP.from, WALL_TOP.to, WALL_FOOT.to, WALL_FOOT.from];
  fillPolygon(ctx, face, STONE.brick);
  // Zócalo más oscuro y juntas verticales cada vez más juntas con la distancia.
  for (let x = 0; x < WALL_TOP.to.x; x++) {
    const top = rowAt(WALL_TOP, x);
    const foot = rowAt(WALL_FOOT, x);
    const height = foot - top;
    fillPixelRect(ctx, x, top + height * 0.82, 1, height * 0.18, STONE.brickDark);
    fillPixelRect(ctx, x, top, 1, 1, mixColors(STONE.brick, STONE.shade, 0.25));
  }
  for (let x = 6; x < WALL_TOP.to.x; x += 6 + Math.floor(x / 30)) {
    const top = rowAt(WALL_TOP, x);
    const foot = rowAt(WALL_FOOT, x);
    fillPixelRect(ctx, x, top + 2, 1, (foot - top) * 0.8, STONE.brickLight);
  }
  drawMerlons(ctx, WALL_TOP.from, WALL_TOP.to, 8, 2, STONE.brick);
}

/**
 * Torre Spásskaya: puerta, cuerpos escalonados con pináculos blancos, reloj, campanario
 * y chapitel verde con la estrella roja.
 * @param ctx Contexto de dibujo.
 * @param windows Lista donde se añaden sus ventanas.
 */
function drawSpasskaya(ctx: RenderContext, windows: PixelRect[]): void {
  const cx = SPASSKAYA_X;
  // Cuerpo inferior con la puerta.
  fillBlock(ctx, cx - 18, 196, 36, 92, BRICK);
  fillPixelRect(ctx, cx - 19, 196, 38, 3, STONE.white);
  fillPixelRect(ctx, cx - 18, 230, 36, 1, STONE.whiteShade);
  fillPolygon(
    ctx,
    [
      { x: cx - 6, y: 288 },
      { x: cx - 6, y: 270 },
      { x: cx, y: 263 },
      { x: cx + 6, y: 270 },
      { x: cx + 6, y: 288 },
    ],
    STONE.shade,
  );
  drawWindowRow(ctx, windows, cx - 11, 238, 2, 19, { width: 3, height: 6 });
  drawWindowRow(ctx, windows, cx - 11, 210, 2, 19, { width: 3, height: 5 });
  // Segundo cuerpo, con arcos blancos.
  fillBlock(ctx, cx - 14, 164, 28, 32, BRICK);
  fillPixelRect(ctx, cx - 15, 164, 30, 2, STONE.white);
  drawKokoshniks(ctx, cx - 14, cx + 14, 176, 4, 7, STONE.white);
  drawWindowRow(ctx, windows, cx - 6, 182, 2, 10, { width: 3, height: 6 });
  // Pináculos de las esquinas de los dos cuerpos.
  for (const [x, height, half] of [
    [cx - 17, 17, 3],
    [cx + 17, 17, 3],
    [cx - 9, 10, 2],
    [cx + 9, 10, 2],
  ] as const) {
    drawPinnacle(ctx, x, 196, height, half);
  }
  drawPinnacle(ctx, cx - 13, 164, 12, 2);
  drawPinnacle(ctx, cx + 13, 164, 12, 2);
  // Cuerpo del reloj.
  fillBlock(ctx, cx - 11, 128, 22, 36, BRICK);
  fillPixelRect(ctx, cx - 11, 128, 1, 36, STONE.white);
  fillPixelRect(ctx, cx + 10, 128, 1, 36, STONE.whiteShade);
  fillPixelRect(ctx, cx - 12, 128, 24, 2, STONE.white);
  fillCircle(ctx, CLOCK.cx, CLOCK.cy, CLOCK.radius + 0.5, STONE.goldDark);
  fillCircle(ctx, CLOCK.cx, CLOCK.cy, CLOCK.radius - 0.5, STONE.gold);
  fillCircle(ctx, CLOCK.cx, CLOCK.cy, CLOCK.radius - 2, COLORS.clockFace);
  for (let hour = 0; hour < 12; hour++) {
    const angle = (hour / 12) * Math.PI * 2;
    fillPixelRect(
      ctx,
      Math.round(CLOCK.cx + Math.sin(angle) * (CLOCK.radius - 3)),
      Math.round(CLOCK.cy - Math.cos(angle) * (CLOCK.radius - 3)),
      1,
      1,
      STONE.gold,
    );
  }
  // Campanario abierto con columnas blancas.
  fillBlock(ctx, cx - 9, 112, 18, 16, { front: STONE.white, side: STONE.whiteShade });
  for (let i = 0; i < 3; i++) {
    const x = cx - 7 + i * 5;
    fillPolygon(
      ctx,
      [
        { x, y: 126 },
        { x, y: 118 },
        { x: x + 1.5, y: 116 },
        { x: x + 3, y: 118 },
        { x: x + 3, y: 126 },
      ],
      STONE.shade,
    );
  }
  // Chapitel con tejas verdes y estrella.
  drawTentRoof(ctx, {
    cx,
    apexY: 80,
    baseY: 112,
    halfBase: 9,
    color: COLORS.spire,
    accent: COLORS.spireLight,
    pattern: 'diamonds',
  });
  fillPixelRect(ctx, cx, 76, 1, 4, STONE.gold);
  drawKremlinStar(ctx, cx, 70, 6);
}

/**
 * Torre Nabátnaya, en primer plano a la izquierda, con su tejado de pizarra.
 * @param ctx Contexto de dibujo.
 * @param windows Lista donde se añaden sus ventanas.
 */
function drawNabatnaya(ctx: RenderContext, windows: PixelRect[]): void {
  const cx = 22;
  fillBlock(ctx, cx - 18, 204, 36, 96, BRICK);
  fillBlock(ctx, cx - 20, 196, 40, 8, BRICK, 0.25);
  drawMerlons(ctx, { x: cx - 20, y: 196 }, { x: cx + 20, y: 196 }, 5, 5, STONE.brick);
  fillPixelRect(ctx, cx - 18, 240, 36, 1, STONE.whiteShade);
  drawWindowRow(ctx, windows, cx - 9, 222, 2, 15, { width: 3, height: 7 });
  drawWindowRow(ctx, windows, cx - 2, 256, 1, 0, { width: 4, height: 8 });
  // Cuerpo superior y tejado.
  fillBlock(ctx, cx - 10, 168, 20, 26, BRICK);
  fillPixelRect(ctx, cx - 11, 168, 22, 2, STONE.white);
  drawWindowRow(ctx, windows, cx - 5, 176, 2, 8, { width: 2, height: 6 });
  drawTentRoof(ctx, {
    cx,
    apexY: 128,
    baseY: 168,
    halfBase: 13,
    color: COLORS.slate,
    accent: COLORS.slateLight,
    pattern: 'stripes',
  });
  fillPixelRect(ctx, cx, 116, 1, 12, STONE.gold);
  fillPixelRect(ctx, cx + 1, 117, 4, 3, STONE.gold);
}

/**
 * Torrecilla Tsárskaya: un pequeño templete sobre la muralla.
 * @param ctx Contexto de dibujo.
 */
function drawTsarskaya(ctx: RenderContext): void {
  const cx = 58;
  const foot = Math.round(rowAt(WALL_TOP, cx));
  fillPixelRect(ctx, cx - 5, 205, 10, foot - 205, STONE.shade);
  fillPixelRect(ctx, cx - 5, 205, 2, foot - 205, STONE.white);
  fillPixelRect(ctx, cx + 3, 205, 2, foot - 205, STONE.whiteShade);
  drawTentRoof(ctx, {
    cx,
    apexY: 188,
    baseY: 205,
    halfBase: 7,
    color: COLORS.spire,
    accent: COLORS.spireLight,
    pattern: 'plain',
  });
  fillPixelRect(ctx, cx, 182, 1, 6, STONE.gold);
}

/**
 * Torre lejana de la muralla con chapitel verde y estrella (Senado y Nikólskaya).
 * @param ctx Contexto de dibujo.
 * @param cx Centro x.
 * @param halfWidth Semiancho del cuerpo.
 * @param spireHeight Altura del chapitel.
 * @param starRadius Radio de la estrella.
 */
function drawFarTower(
  ctx: RenderContext,
  cx: number,
  halfWidth: number,
  spireHeight: number,
  starRadius: number,
): void {
  const top = Math.round(rowAt(WALL_TOP, cx)) - halfWidth * 2;
  const foot = Math.round(rowAt(WALL_FOOT, cx));
  fillBlock(ctx, cx - halfWidth, top, halfWidth * 2, foot - top, BRICK);
  fillPixelRect(ctx, cx - halfWidth - 1, top, halfWidth * 2 + 2, 1, STONE.white);
  drawTentRoof(ctx, {
    cx,
    apexY: top - spireHeight,
    baseY: top,
    halfBase: halfWidth,
    color: COLORS.spire,
    accent: COLORS.spireLight,
    pattern: 'plain',
  });
  drawKremlinStar(ctx, cx, top - spireHeight - starRadius, starRadius);
}

/**
 * Hilera de árboles delante de la muralla, más pequeños cuanto más lejos.
 * @param ctx Contexto de dibujo.
 */
function drawTrees(ctx: RenderContext): void {
  let x = 108;
  while (x < WALL_FOOT.to.x) {
    const t = x / WALL_FOOT.to.x;
    const radius = 17 - 13 * t;
    drawTree(ctx, x, rowAt(WALL_FOOT, x) + 1, radius);
    x += radius * 1.5;
  }
}

/**
 * Muralla del Kremlin a la izquierda, con las torres Nabátnaya, Tsárskaya y Spásskaya,
 * las del Senado y Nikólskaya al fondo y los árboles que crecen delante.
 * @returns El elemento del decorado.
 */
export function createKremlin(): SceneryPiece {
  const windows: PixelRect[] = [];
  const roofs: RoofLine[] = [
    { from: { x: 0, y: 213 }, to: { x: 300, y: 249 }, thickness: 3 },
    { from: { x: 76, y: 195 }, to: { x: 112, y: 195 }, thickness: 3 },
    { from: { x: 80, y: 163 }, to: { x: 108, y: 163 }, thickness: 2 },
    { from: { x: 83, y: 127 }, to: { x: 105, y: 127 }, thickness: 2 },
    { from: { x: 94, y: 81 }, to: { x: 85, y: 111 }, thickness: 1 },
    { from: { x: 2, y: 195 }, to: { x: 42, y: 195 }, thickness: 3 },
    { from: { x: 22, y: 129 }, to: { x: 9, y: 167 }, thickness: 2 },
    { from: { x: 22, y: 129 }, to: { x: 35, y: 167 }, thickness: 1 },
  ];
  return {
    windows,
    roofs,
    draw: (ctx) => {
      windows.length = 0;
      drawWall(ctx);
      drawFarTower(ctx, 272, 4, 20, 2);
      drawFarTower(ctx, 196, 6, 18, 3);
      drawTsarskaya(ctx);
      drawSpasskaya(ctx, windows);
      drawNabatnaya(ctx, windows);
      drawTrees(ctx);
    },
  };
}

/**
 * Agujas del reloj de la torre Spásskaya según la hora del día.
 * @param ctx Contexto de dibujo.
 * @param timeOfDay Momento del día (0–1).
 * @param drawHand Función que dibuja una línea.
 */
export function drawClockHands(
  ctx: RenderContext,
  timeOfDay: number,
  drawHand: (ctx: RenderContext, from: Point, to: Point, color: string) => void,
): void {
  const hours = timeOfDay * 24;
  const hourAngle = ((hours % 12) / 12) * Math.PI * 2;
  const minuteAngle = (hours % 1) * Math.PI * 2;
  const center = { x: CLOCK.cx, y: CLOCK.cy };
  const minuteLength = CLOCK.radius - 3;
  const hourLength = CLOCK.radius - 5;
  drawHand(
    ctx,
    center,
    {
      x: center.x + Math.sin(minuteAngle) * minuteLength,
      y: center.y - Math.cos(minuteAngle) * minuteLength,
    },
    STONE.gold,
  );
  drawHand(
    ctx,
    center,
    {
      x: center.x + Math.sin(hourAngle) * hourLength,
      y: center.y - Math.cos(hourAngle) * hourLength,
    },
    STONE.gold,
  );
}
