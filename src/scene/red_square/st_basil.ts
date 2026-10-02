import type { RenderContext } from '../../render/render_context';
import { fillPixelRect, fillPolygon, mixColors } from '../pixel_shapes';
import { fillPatterned, type PixelRect, type RoofLine, type SceneryPiece } from '../scenery';

/** Colores de la catedral de San Basilio. */
const COLORS = {
  outline: '#3a1d18',
  brick: '#b4472f',
  brickDark: '#842f20',
  stone: '#efe5d0',
  stoneShade: '#c8b99d',
  gold: '#e8b947',
  goldDark: '#a77b1f',
  window: '#2a1a24',
  tentGreen: '#3d8a52',
  tentLight: '#e9dfc4',
  shade: '#1a1020',
} as const;

/** Dibujo de una cúpula de bulbo. */
type DomePattern = 'spiral' | 'zigzag' | 'stripes' | 'scales';

/** Cúpula con su tambor. */
interface Dome {
  /** Centro x. */
  readonly cx: number;
  /** Fila de la base de la cúpula (encima del tambor). */
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

/** Cúpulas visibles, de izquierda a derecha (la central tiene cubierta de tienda aparte). */
const DOMES: readonly Dome[] = [
  {
    cx: 116,
    baseY: 80,
    halfWidth: 8,
    height: 15,
    drumBottom: 104,
    pattern: 'spiral',
    colors: ['#3e9a4f', '#f0c24a'],
  },
  {
    cx: 131,
    baseY: 74,
    halfWidth: 6,
    height: 13,
    drumBottom: 100,
    pattern: 'zigzag',
    colors: ['#d23c32', '#f2ead8'],
  },
  {
    cx: 169,
    baseY: 74,
    halfWidth: 6,
    height: 13,
    drumBottom: 100,
    pattern: 'spiral',
    colors: ['#2f6fc4', '#f2ead8'],
  },
  {
    cx: 184,
    baseY: 80,
    halfWidth: 8,
    height: 15,
    drumBottom: 104,
    pattern: 'stripes',
    colors: ['#2f9a6e', '#e2623a'],
  },
  {
    cx: 150,
    baseY: 92,
    halfWidth: 5,
    height: 10,
    drumBottom: 106,
    pattern: 'scales',
    colors: ['#e2a33a', '#3e8f4a'],
  },
];

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
  const period = 4;
  let useSecond: boolean;
  switch (dome.pattern) {
    case 'spiral':
      useSecond = (((dx + y) % period) + period) % period < 2;
      break;
    case 'zigzag':
      useSecond = (((Math.abs(dx) + y) % period) + period) % period < 2;
      break;
    case 'stripes':
      useSecond = Math.floor((rel + 1) * 3) % 2 === 0;
      break;
    case 'scales':
      useSecond = (Math.floor(y / 2) + Math.floor((dx + (Math.floor(y / 2) % 2)) / 2)) % 2 === 0;
      break;
  }
  const base = useSecond ? dome.colors[1] : dome.colors[0];
  if (rel > 0.45) {
    return mixColors(base, COLORS.shade, 0.35 + (rel - 0.45) * 0.6);
  }
  if (rel < -0.55) {
    return mixColors(base, '#ffffff', 0.18);
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
  const drumHalf = Math.round(dome.halfWidth * 0.7);
  // Tambor con cornisa y ventanas estrechas.
  const drumHeight = dome.drumBottom - dome.baseY;
  fillPixelRect(
    ctx,
    dome.cx - drumHalf - 1,
    dome.baseY,
    drumHalf * 2 + 3,
    drumHeight,
    COLORS.outline,
  );
  fillPixelRect(ctx, dome.cx - drumHalf, dome.baseY, drumHalf * 2 + 1, drumHeight, COLORS.brick);
  fillPixelRect(
    ctx,
    dome.cx + Math.ceil(drumHalf / 2),
    dome.baseY,
    Math.ceil(drumHalf / 2) + 1,
    drumHeight,
    COLORS.brickDark,
  );
  // Molduras blancas: cornisa, franja central y pilastras.
  fillPixelRect(ctx, dome.cx - drumHalf - 1, dome.baseY + 1, drumHalf * 2 + 3, 2, COLORS.stone);
  fillPixelRect(
    ctx,
    dome.cx - drumHalf,
    dome.baseY + Math.floor(drumHeight / 2) + 2,
    drumHalf * 2 + 1,
    1,
    COLORS.stone,
  );
  fillPixelRect(ctx, dome.cx - drumHalf, dome.baseY + 3, 1, drumHeight - 3, COLORS.stoneShade);
  fillPixelRect(ctx, dome.cx + drumHalf, dome.baseY + 3, 1, drumHeight - 3, COLORS.stoneShade);
  for (let wx = dome.cx - drumHalf + 2; wx <= dome.cx + drumHalf - 2; wx += 3) {
    const rect = { x: wx, y: dome.baseY + 5, width: 1, height: 4 };
    fillPixelRect(ctx, rect.x - 1, rect.y - 1, 3, rect.height + 1, COLORS.stone);
    fillPixelRect(ctx, rect.x, rect.y, rect.width, rect.height, COLORS.window);
    windows.push(rect);
  }
  // Silueta (contorno) y bulbo con su dibujo.
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
  fillPatterned(ctx, top - 1, dome.baseY, rowSpan(1), () => COLORS.outline);
  fillPatterned(ctx, top + 1, dome.baseY, rowSpan(0), (x, y) =>
    domeColorAt(dome, x, y, bulbHalfWidth(dome.halfWidth, (dome.baseY - y) / dome.height)),
  );
  // Aguja dorada y cruz.
  fillPixelRect(ctx, dome.cx, top - 4, 1, 4, COLORS.gold);
  fillPixelRect(ctx, dome.cx - 1, top - 3, 3, 1, COLORS.gold);
}

/**
 * Dibuja la torre central: cuerpo octogonal con arcos (kokóshniks) y cubierta de
 * tienda con rombos, coronada por una pequeña cúpula dorada.
 * @param ctx Contexto de dibujo.
 * @param windows Lista donde se añaden sus ventanas.
 */
function drawCentralTower(ctx: RenderContext, windows: PixelRect[]): void {
  const cx = 150;
  // Cuerpo de la torre.
  fillPixelRect(ctx, cx - 11, 64, 23, 42, COLORS.outline);
  fillPixelRect(ctx, cx - 10, 64, 21, 42, COLORS.brick);
  fillPixelRect(ctx, cx + 4, 64, 7, 42, COLORS.brickDark);
  fillPixelRect(ctx, cx - 10, 64, 21, 2, COLORS.stone);
  fillPixelRect(ctx, cx - 10, 84, 21, 2, COLORS.stone);
  // Kokóshniks: arcos apuntados en dos filas.
  for (const [row, count] of [
    [80, 4],
    [70, 3],
  ] as const) {
    const width = Math.floor(20 / count);
    for (let i = 0; i < count; i++) {
      const left = cx - 10 + i * width + (row === 70 ? 3 : 0);
      fillPolygon(
        ctx,
        [
          { x: left, y: row },
          { x: left + width / 2, y: row - 5 },
          { x: left + width, y: row },
        ],
        COLORS.stone,
      );
    }
  }
  for (let wx = cx - 7; wx <= cx + 7; wx += 4) {
    const rect = { x: wx, y: 90, width: 2, height: 6 };
    fillPixelRect(ctx, rect.x, rect.y, rect.width, rect.height, COLORS.window);
    windows.push(rect);
  }
  // Cubierta de tienda con rombos verdes y blancos.
  const apexY = 30;
  const baseY = 64;
  const halfBase = 11;
  const rowSpan =
    (grow: number) =>
    (y: number): readonly [number, number] | null => {
      if (y < apexY || y > baseY) {
        return null;
      }
      const half = ((y - apexY) / (baseY - apexY)) * halfBase + grow;
      return [cx - half, cx + half];
    };
  fillPatterned(ctx, apexY - 1, baseY, rowSpan(1), () => COLORS.outline);
  fillPatterned(ctx, apexY, baseY - 1, rowSpan(0), (x, y) => {
    const diamond = (Math.abs(x - cx) + y) % 6 < 1 || (Math.abs(x - cx) - y + 600) % 6 < 1;
    const base = diamond ? COLORS.tentLight : COLORS.tentGreen;
    return x > cx + 2 ? mixColors(base, COLORS.shade, 0.3) : base;
  });
  // Pequeña cúpula dorada y cruz.
  drawDome(
    ctx,
    {
      cx,
      baseY: apexY,
      halfWidth: 3,
      height: 6,
      drumBottom: apexY + 2,
      pattern: 'stripes',
      colors: [COLORS.gold, COLORS.goldDark],
    },
    [],
  );
}

/**
 * Dibuja la galería de la base: ladrillo rojo con arcos blancos y escalinata.
 * @param ctx Contexto de dibujo.
 * @param windows Lista donde se añaden sus ventanas.
 */
function drawGallery(ctx: RenderContext, windows: PixelRect[]): void {
  fillPixelRect(ctx, 102, 102, 97, 17, COLORS.outline);
  fillPixelRect(ctx, 103, 103, 95, 15, COLORS.brick);
  fillPixelRect(ctx, 103, 103, 95, 2, COLORS.stone);
  fillPixelRect(ctx, 103, 115, 95, 3, COLORS.brickDark);
  for (let x = 106; x < 196; x += 7) {
    fillPolygon(
      ctx,
      [
        { x, y: 114 },
        { x, y: 109 },
        { x: x + 2, y: 107 },
        { x: x + 4, y: 109 },
        { x: x + 4, y: 114 },
      ],
      COLORS.stone,
    );
    const rect = { x: x + 1, y: 110, width: 3, height: 4 };
    fillPixelRect(ctx, rect.x, rect.y, rect.width, rect.height, COLORS.window);
    windows.push(rect);
  }
}

/**
 * Catedral de San Basilio, en el centro del fondo.
 * @returns El elemento del decorado.
 */
export function createStBasil(): SceneryPiece {
  const windows: PixelRect[] = [];
  const roofs: RoofLine[] = [
    { from: { x: 102, y: 101 }, to: { x: 198, y: 101 }, thickness: 2 },
    { from: { x: 139, y: 63 }, to: { x: 161, y: 63 }, thickness: 1 },
  ];
  return {
    windows,
    roofs,
    draw: (ctx) => {
      windows.length = 0;
      for (const dome of DOMES.filter((d) => d.cx !== 150)) {
        drawDome(ctx, dome, windows);
      }
      drawCentralTower(ctx, windows);
      const front = DOMES.find((d) => d.cx === 150);
      if (front !== undefined) {
        drawDome(ctx, front, windows);
      }
      drawGallery(ctx, windows);
    },
  };
}
