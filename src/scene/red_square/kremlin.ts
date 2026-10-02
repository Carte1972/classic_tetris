import type { RenderContext } from '../../render/render_context';
import { fillCircle, fillPixelRect, fillPolygon, mixColors, type Point } from '../pixel_shapes';
import { fillPatterned, type PixelRect, type SceneryPiece } from '../scenery';

/** Colores de la torre Spásskaya y la muralla del Kremlin. */
const COLORS = {
  outline: '#3a1714',
  brick: '#b23a2c',
  brickDark: '#7f261d',
  brickLight: '#cc5a43',
  stone: '#efe5d0',
  stoneShade: '#c9b99c',
  spire: '#2f7a4a',
  spireDark: '#1d5032',
  gold: '#e8b947',
  clockFace: '#1f2a33',
  clockRim: '#e8b947',
  star: '#e0243a',
  starLight: '#ff7a7a',
  window: '#2a1a24',
  shade: '#1a1020',
} as const;

/** Centro x de la torre Spásskaya. */
const TOWER_CX = 238;

/** Centro y radio del reloj de la torre. */
export const CLOCK = { cx: TOWER_CX, cy: 66, radius: 6 } as const;

/**
 * Almenas en forma de cola de golondrina sobre el borde superior de un muro.
 * @param ctx Contexto de dibujo.
 * @param from Extremo izquierdo del borde.
 * @param to Extremo derecho del borde.
 * @param size Altura de las almenas cerca del extremo izquierdo.
 * @param sizeEnd Altura de las almenas cerca del extremo derecho.
 */
function drawMerlons(
  ctx: RenderContext,
  from: Point,
  to: Point,
  size: number,
  sizeEnd: number,
): void {
  const steps = Math.max(1, Math.round((to.x - from.x) / (size * 1.6)));
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.25) / steps;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    const h = size + (sizeEnd - size) * t;
    const w = Math.min(h * 0.9, to.x - x - 1);
    if (w <= 0) {
      continue;
    }
    fillPolygon(
      ctx,
      [
        { x: x - 0.5, y: y + 0.5 },
        { x: x - 0.5, y: y - h },
        { x: x + w * 0.5, y: y - h * 0.6 },
        { x: x + w + 0.5, y: y - h },
        { x: x + w + 0.5, y: y + 0.5 },
      ],
      COLORS.brick,
    );
  }
}

/**
 * Muralla del Kremlin en perspectiva, desde la torre hacia el espectador por la derecha,
 * con almenas de cola de golondrina y la torre del Senado.
 * @param ctx Contexto de dibujo.
 */
function drawWall(ctx: RenderContext): void {
  // Tramo lejano a la izquierda de la torre (detrás de San Basilio).
  fillPixelRect(ctx, 196, 104, 32, 15, COLORS.brickDark);
  drawMerlons(ctx, { x: 196, y: 104 }, { x: 228, y: 104 }, 2, 2);
  // Tramo derecho en perspectiva: se acerca al espectador.
  const wall: Point[] = [
    { x: 248, y: 100 },
    { x: 320, y: 84 },
    { x: 320, y: 132 },
    { x: 248, y: 119 },
  ];
  fillPolygon(ctx, wall, COLORS.brick);
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    fillPolygon(
      ctx,
      [
        { x: 248, y: 100 + (119 - 100) * t },
        { x: 320, y: 84 + (132 - 84) * t },
        { x: 320, y: 85 + (132 - 84) * t },
        { x: 248, y: 101 + (119 - 100) * t },
      ],
      COLORS.brickDark,
    );
  }
  drawMerlons(ctx, { x: 248, y: 100 }, { x: 320, y: 84 }, 2, 5);
  // Torre del Senado, a media muralla.
  fillPixelRect(ctx, 286, 72, 12, 30, COLORS.outline);
  fillPixelRect(ctx, 287, 73, 10, 29, COLORS.brick);
  fillPixelRect(ctx, 293, 73, 4, 29, COLORS.brickDark);
  fillPolygon(
    ctx,
    [
      { x: 285, y: 73 },
      { x: 292, y: 56 },
      { x: 299, y: 73 },
    ],
    COLORS.spire,
  );
  fillPixelRect(ctx, 291, 52, 2, 4, COLORS.gold);
}

/**
 * Torre Spásskaya: cuerpo de ladrillo con remates blancos, reloj, chapitel verde y la
 * estrella roja en lo alto.
 * @param ctx Contexto de dibujo.
 * @param windows Lista donde se añaden sus ventanas.
 */
function drawSpasskaya(ctx: RenderContext, windows: PixelRect[]): void {
  const cx = TOWER_CX;
  // Cuerpo bajo con el arco de la puerta.
  fillPixelRect(ctx, cx - 12, 84, 25, 35, COLORS.outline);
  fillPixelRect(ctx, cx - 11, 85, 23, 34, COLORS.brick);
  fillPixelRect(ctx, cx + 4, 85, 8, 34, COLORS.brickDark);
  fillPolygon(
    ctx,
    [
      { x: cx - 4, y: 119 },
      { x: cx - 4, y: 108 },
      { x: cx, y: 104 },
      { x: cx + 4, y: 108 },
      { x: cx + 4, y: 119 },
    ],
    COLORS.window,
  );
  fillPixelRect(ctx, cx - 12, 84, 25, 2, COLORS.stone);
  fillPixelRect(ctx, cx - 11, 96, 23, 1, COLORS.stoneShade);
  // Pináculos blancos en las esquinas del primer cuerpo.
  for (const px of [cx - 12, cx + 10]) {
    fillPixelRect(ctx, px, 78, 3, 7, COLORS.stone);
    fillPolygon(
      ctx,
      [
        { x: px, y: 78 },
        { x: px + 1.5, y: 72 },
        { x: px + 3, y: 78 },
      ],
      COLORS.stone,
    );
  }
  // Cuerpo del reloj.
  fillPixelRect(ctx, cx - 9, 56, 19, 29, COLORS.outline);
  fillPixelRect(ctx, cx - 8, 57, 17, 28, COLORS.brick);
  fillPixelRect(ctx, cx + 3, 57, 6, 28, COLORS.brickDark);
  fillPixelRect(ctx, cx - 9, 56, 19, 2, COLORS.stone);
  fillCircle(ctx, CLOCK.cx, CLOCK.cy, CLOCK.radius + 1, COLORS.clockRim);
  fillCircle(ctx, CLOCK.cx, CLOCK.cy, CLOCK.radius, COLORS.clockFace);
  for (let hour = 0; hour < 12; hour += 3) {
    const angle = (hour / 12) * Math.PI * 2;
    fillPixelRect(
      ctx,
      Math.round(CLOCK.cx + Math.sin(angle) * (CLOCK.radius - 1)),
      Math.round(CLOCK.cy - Math.cos(angle) * (CLOCK.radius - 1)),
      1,
      1,
      COLORS.gold,
    );
  }
  // Cuerpo alto con arcos abiertos (campanario).
  fillPixelRect(ctx, cx - 7, 42, 15, 15, COLORS.outline);
  fillPixelRect(ctx, cx - 6, 43, 13, 14, COLORS.stone);
  fillPixelRect(ctx, cx + 3, 43, 4, 14, COLORS.stoneShade);
  for (const ax of [cx - 4, cx + 1]) {
    const rect = { x: ax, y: 47, width: 3, height: 7 };
    fillPixelRect(ctx, rect.x, rect.y, rect.width, rect.height, COLORS.window);
    windows.push(rect);
  }
  for (const px of [cx - 8, cx + 7]) {
    fillPolygon(
      ctx,
      [
        { x: px, y: 44 },
        { x: px + 1, y: 37 },
        { x: px + 2, y: 44 },
      ],
      COLORS.stone,
    );
  }
  // Chapitel verde octogonal.
  const apexY = 18;
  const baseY = 42;
  const rowSpan =
    (grow: number) =>
    (y: number): readonly [number, number] | null => {
      if (y < apexY || y > baseY) {
        return null;
      }
      const half = ((y - apexY) / (baseY - apexY)) * 7 + grow;
      return [cx - half, cx + half];
    };
  fillPatterned(ctx, apexY - 1, baseY, rowSpan(1), () => COLORS.outline);
  fillPatterned(ctx, apexY, baseY - 1, rowSpan(0), (x) =>
    x > cx + 1
      ? COLORS.spireDark
      : x === cx - 2
        ? mixColors(COLORS.spire, '#ffffff', 0.25)
        : COLORS.spire,
  );
  // Estrella roja de cinco puntas.
  const star: Point[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 4 : 1.8;
    star.push({ x: cx + 0.5 + Math.cos(angle) * r, y: 13 + Math.sin(angle) * r });
  }
  fillPolygon(ctx, star, COLORS.star);
  fillPixelRect(ctx, cx, 11, 1, 2, COLORS.starLight);
}

/**
 * Agujas del reloj de la torre según la hora del día.
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
  drawHand(
    ctx,
    center,
    { x: center.x + Math.sin(minuteAngle) * 5, y: center.y - Math.cos(minuteAngle) * 5 },
    COLORS.gold,
  );
  drawHand(
    ctx,
    center,
    { x: center.x + Math.sin(hourAngle) * 3, y: center.y - Math.cos(hourAngle) * 3 },
    COLORS.gold,
  );
}

/**
 * Torre Spásskaya y muralla del Kremlin, a la derecha del fondo.
 * @returns El elemento del decorado.
 */
export function createKremlin(): SceneryPiece {
  const windows: PixelRect[] = [];
  return {
    windows,
    roofs: [
      { from: { x: 226, y: 83 }, to: { x: 250, y: 83 }, thickness: 2 },
      { from: { x: 229, y: 55 }, to: { x: 247, y: 55 }, thickness: 1 },
      { from: { x: 248, y: 97 }, to: { x: 320, y: 79 }, thickness: 2 },
      { from: { x: 196, y: 102 }, to: { x: 228, y: 102 }, thickness: 1 },
    ],
    draw: (ctx) => {
      windows.length = 0;
      drawWall(ctx);
      drawSpasskaya(ctx, windows);
    },
  };
}
