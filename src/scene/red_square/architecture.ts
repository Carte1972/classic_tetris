import type { RenderContext } from '../../render/render_context';
import { fillEllipse, fillPixelRect, fillPolygon, mixColors, type Point } from '../pixel_shapes';
import { fillPatterned, type PixelRect } from '../scenery';

/** Colores comunes de la arquitectura de la plaza. */
export const STONE = {
  outline: '#3a1714',
  brick: '#b23a2c',
  brickDark: '#7f261d',
  brickLight: '#cc5a43',
  white: '#efe5d0',
  whiteShade: '#c9b99c',
  gold: '#e8b947',
  goldDark: '#a77b1f',
  window: '#2a1a24',
  shade: '#1a1020',
} as const;

/** Colores de los árboles de la plaza. */
const TREE = { dark: '#1f4a2a', mid: '#2f6e36', light: '#4f9a48', trunk: '#3a2a1e' } as const;

/**
 * Árbol de copa redonda con tronco corto y volumen de luz y sombra.
 * @param ctx Contexto de dibujo.
 * @param x Columna del tronco.
 * @param foot Fila del pie del tronco.
 * @param radius Radio de la copa.
 */
export function drawTree(ctx: RenderContext, x: number, foot: number, radius: number): void {
  const cy = foot - radius * 1.25;
  fillPixelRect(ctx, x - 1, cy, Math.max(1, radius * 0.18), foot - cy, TREE.trunk);
  fillEllipse(ctx, x, cy, radius + 1, radius * 0.9 + 1, TREE.dark);
  fillEllipse(ctx, x - radius * 0.15, cy - radius * 0.1, radius * 0.85, radius * 0.75, TREE.mid);
  fillEllipse(ctx, x - radius * 0.35, cy - radius * 0.35, radius * 0.4, radius * 0.32, TREE.light);
}

/**
 * Bloque de ladrillo con contorno y la cara derecha en sombra, para dar volumen.
 * @param ctx Contexto de dibujo.
 * @param x Columna izquierda.
 * @param y Fila superior.
 * @param width Ancho.
 * @param height Alto.
 * @param colors Colores del frente y de la sombra.
 * @param colors.front Color del frente.
 * @param colors.side Color de la cara en sombra.
 * @param sideRatio Proporción del ancho que queda en sombra.
 */
export function fillBlock(
  ctx: RenderContext,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: { readonly front: string; readonly side: string },
  sideRatio = 0.3,
): void {
  fillPixelRect(ctx, x - 1, y - 1, width + 2, height + 1, STONE.outline);
  fillPixelRect(ctx, x, y, width, height, colors.front);
  const side = Math.max(1, Math.round(width * sideRatio));
  fillPixelRect(ctx, x + width - side, y, side, height, colors.side);
}

/** Patrón de las tejas de una cubierta de tienda. */
export type TentPattern = 'plain' | 'diamonds' | 'stripes';

/** Cubierta de tienda (chapitel piramidal) vista de frente. */
export interface TentRoof {
  /** Centro x. */
  readonly cx: number;
  /** Fila del vértice. */
  readonly apexY: number;
  /** Fila de la base. */
  readonly baseY: number;
  /** Semiancho de la base. */
  readonly halfBase: number;
  readonly color: string;
  /** Color de las juntas o rombos. */
  readonly accent: string;
  readonly pattern: TentPattern;
}

/**
 * Dibuja una cubierta de tienda con contorno, la mitad derecha en sombra y su patrón.
 * @param ctx Contexto de dibujo.
 * @param roof Cubierta.
 */
export function drawTentRoof(ctx: RenderContext, roof: TentRoof): void {
  const { cx, apexY, baseY, halfBase } = roof;
  const rowSpan =
    (grow: number) =>
    (y: number): readonly [number, number] | null => {
      if (y < apexY || y > baseY) {
        return null;
      }
      const half = ((y - apexY) / Math.max(1, baseY - apexY)) * halfBase + grow;
      return [cx - half, cx + half];
    };
  fillPatterned(ctx, apexY - 1, baseY, rowSpan(1), () => STONE.outline);
  fillPatterned(ctx, apexY, baseY - 1, rowSpan(0), (x, y) => {
    const dx = x - cx;
    let accent = false;
    switch (roof.pattern) {
      case 'diamonds':
        accent = (Math.abs(dx) + y) % 6 === 0 || (Math.abs(dx) - y + 600) % 6 === 0;
        break;
      case 'stripes':
        accent = dx % 3 === 0;
        break;
      case 'plain':
        accent = false;
        break;
    }
    const base = accent ? roof.accent : roof.color;
    return dx > 0 ? mixColors(base, STONE.shade, 0.32) : base;
  });
}

/**
 * Almenas en cola de golondrina a lo largo del borde superior de un muro, con el tamaño
 * interpolado entre los extremos (más pequeñas cuanto más lejos).
 * @param ctx Contexto de dibujo.
 * @param from Extremo izquierdo del borde.
 * @param to Extremo derecho del borde.
 * @param sizeFrom Altura de las almenas en el extremo izquierdo.
 * @param sizeTo Altura de las almenas en el extremo derecho.
 * @param color Color del ladrillo.
 */
export function drawMerlons(
  ctx: RenderContext,
  from: Point,
  to: Point,
  sizeFrom: number,
  sizeTo: number,
  color: string,
): void {
  let t = 0;
  while (t < 1) {
    const size = sizeFrom + (sizeTo - sizeFrom) * t;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    const w = Math.max(1, size * 0.85);
    if (size >= 3) {
      fillPolygon(
        ctx,
        [
          { x: x - 0.5, y: y + 0.5 },
          { x: x - 0.5, y: y - size },
          { x: x + w / 2, y: y - size * 0.6 },
          { x: x + w + 0.5, y: y - size },
          { x: x + w + 0.5, y: y + 0.5 },
        ],
        color,
      );
    } else {
      fillPixelRect(ctx, x, y - size, Math.max(1, w), size + 1, color);
    }
    t += (size * 1.7) / Math.max(1, to.x - from.x);
  }
}

/**
 * Fila de kokóshniks: arcos apuntados decorativos típicos de la arquitectura rusa.
 * @param ctx Contexto de dibujo.
 * @param left Columna izquierda.
 * @param right Columna derecha.
 * @param baseY Fila de la base de los arcos.
 * @param count Número de arcos.
 * @param height Altura de cada arco.
 * @param color Color de la moldura.
 */
export function drawKokoshniks(
  ctx: RenderContext,
  left: number,
  right: number,
  baseY: number,
  count: number,
  height: number,
  color: string,
): void {
  const width = (right - left) / count;
  for (let i = 0; i < count; i++) {
    const x = left + i * width;
    fillPolygon(
      ctx,
      [
        { x, y: baseY },
        { x: x + width * 0.15, y: baseY - height * 0.6 },
        { x: x + width / 2, y: baseY - height },
        { x: x + width * 0.85, y: baseY - height * 0.6 },
        { x: x + width, y: baseY },
      ],
      color,
    );
  }
}

/**
 * Estrella roja de cinco puntas (como las de las torres del Kremlin), con borde dorado.
 * @param ctx Contexto de dibujo.
 * @param cx Centro x.
 * @param cy Centro y.
 * @param radius Radio de las puntas.
 */
export function drawKremlinStar(ctx: RenderContext, cx: number, cy: number, radius: number): void {
  const points = (r: number): Point[] =>
    Array.from({ length: 10 }, (_, i) => {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const reach = i % 2 === 0 ? r : r * 0.45;
      return { x: cx + Math.cos(angle) * reach, y: cy + Math.sin(angle) * reach };
    });
  fillPolygon(ctx, points(radius + 1), STONE.goldDark);
  fillPolygon(ctx, points(radius), '#d8202f');
  fillPixelRect(ctx, cx - 1, cy - radius * 0.5, 1, radius * 0.6, '#ff8a8a');
}

/**
 * Pináculo blanco con remate dorado (las torrecillas de las esquinas).
 * @param ctx Contexto de dibujo.
 * @param cx Centro x.
 * @param baseY Fila de la base.
 * @param height Altura.
 * @param halfWidth Semiancho de la base.
 */
export function drawPinnacle(
  ctx: RenderContext,
  cx: number,
  baseY: number,
  height: number,
  halfWidth: number,
): void {
  fillPolygon(
    ctx,
    [
      { x: cx - halfWidth - 0.5, y: baseY },
      { x: cx, y: baseY - height },
      { x: cx + halfWidth + 0.5, y: baseY },
    ],
    STONE.white,
  );
  fillPixelRect(ctx, cx, baseY - height, 1, Math.max(1, height * 0.5), STONE.whiteShade);
  fillPixelRect(ctx, cx, baseY - height - 2, 1, 2, STONE.gold);
}

/**
 * Hilera de ventanas iguales; las guarda para iluminarlas de noche.
 * @param ctx Contexto de dibujo.
 * @param windows Lista donde se añaden.
 * @param left Columna de la primera ventana.
 * @param y Fila superior.
 * @param count Número de ventanas.
 * @param spacing Distancia entre ventanas.
 * @param size Ancho y alto de cada ventana.
 * @param size.width Ancho.
 * @param size.height Alto.
 * @param frame Color del marco blanco, o `null` sin marco.
 */
export function drawWindowRow(
  ctx: RenderContext,
  windows: PixelRect[],
  left: number,
  y: number,
  count: number,
  spacing: number,
  size: { readonly width: number; readonly height: number },
  frame: string | null = STONE.white,
): void {
  for (let i = 0; i < count; i++) {
    const rect = { x: Math.round(left + i * spacing), y, width: size.width, height: size.height };
    if (frame !== null) {
      fillPixelRect(ctx, rect.x - 1, rect.y - 1, rect.width + 2, rect.height + 1, frame);
    }
    fillPixelRect(ctx, rect.x, rect.y, rect.width, rect.height, STONE.window);
    windows.push(rect);
  }
}
