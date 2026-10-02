import type { RenderContext } from '../../render/render_context';
import { fillPixelRect } from '../../scene/pixel_shapes';

/** Letras de 3 × 5 píxeles para los rótulos de los escenarios (`#` = píxel encendido). */
const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  М: ['#.#', '###', '#.#', '#.#', '#.#'],
  О: ['###', '#.#', '#.#', '#.#', '###'],
  С: ['###', '#..', '#..', '#..', '###'],
  К: ['#.#', '#.#', '##.', '#.#', '#.#'],
  В: ['##.', '#.#', '##.', '#.#', '##.'],
  А: ['.#.', '#.#', '###', '#.#', '#.#'],
  '-': ['...', '...', '###', '...', '...'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '9': ['###', '#.#', '###', '..#', '###'],
  ' ': ['...', '...', '...', '...', '...'],
};

/** Ancho de una letra más su separación (px a escala 1). */
const ADVANCE = 4;

/**
 * Ancho de un rótulo en píxeles.
 * @param text Texto.
 * @param scale Escala de las letras.
 * @returns Ancho.
 */
export function pixelTextWidth(text: string, scale: number): number {
  return (text.length * ADVANCE - 1) * scale;
}

/**
 * Escribe un rótulo con letras de píxeles.
 * @param ctx Contexto de dibujo.
 * @param text Texto (letras disponibles en `GLYPHS`).
 * @param x Columna izquierda.
 * @param y Fila superior.
 * @param scale Escala de las letras.
 * @param color Color.
 */
export function drawPixelText(
  ctx: RenderContext,
  text: string,
  x: number,
  y: number,
  scale: number,
  color: string,
): void {
  [...text].forEach((char, index) => {
    const glyph = GLYPHS[char] ?? GLYPHS[' '] ?? [];
    glyph.forEach((row, gy) => {
      [...row].forEach((cell, gx) => {
        if (cell === '#') {
          fillPixelRect(
            ctx,
            x + (index * ADVANCE + gx) * scale,
            y + gy * scale,
            scale,
            scale,
            color,
          );
        }
      });
    });
  });
}
