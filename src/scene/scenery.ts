import type { RenderContext } from '../render/render_context';
import type { Point } from './pixel_shapes';

/** Rectángulo en píxeles lógicos. */
export interface PixelRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Borde de un tejado o cornisa (puede ir inclinado) donde se acumula la nieve. */
export interface RoofLine {
  readonly from: Point;
  readonly to: Point;
  /** Grosor de la nieve acumulada al máximo (px). */
  readonly thickness: number;
}

/** Elemento fijo del decorado. */
export interface SceneryPiece {
  /** Dibuja el elemento con sus colores de día. */
  readonly draw: (ctx: RenderContext) => void;
  /** Ventanas que se iluminan de noche. */
  readonly windows: readonly PixelRect[];
  /** Bordes superiores de tejados y cornisas donde se acumula la nieve. */
  readonly roofs: readonly RoofLine[];
}

/**
 * Rellena una región por filas con un color que depende de cada píxel (para dibujar
 * franjas, espirales o zigzags en las cúpulas). Agrupa píxeles contiguos del mismo color.
 * @param ctx Contexto de dibujo.
 * @param top Primera fila.
 * @param bottom Última fila.
 * @param rowSpan Columnas que ocupa la región en cada fila (`null` si la fila está vacía).
 * @param colorAt Color de cada píxel.
 */
export function fillPatterned(
  ctx: RenderContext,
  top: number,
  bottom: number,
  rowSpan: (y: number) => readonly [number, number] | null,
  colorAt: (x: number, y: number) => string,
): void {
  for (let y = top; y <= bottom; y++) {
    const range = rowSpan(y);
    if (range === null) {
      continue;
    }
    const [from, to] = range;
    let runStart = Math.round(from);
    let runColor = colorAt(runStart, y);
    for (let x = runStart + 1; x <= Math.round(to) + 1; x++) {
      const color = x <= Math.round(to) ? colorAt(x, y) : '';
      if (color !== runColor) {
        ctx.fillStyle = runColor;
        ctx.fillRect(runStart, y, x - runStart, 1);
        runStart = x;
        runColor = color;
      }
    }
  }
}
