import { PIECE_COLORS } from '../config/palette';
import { CELL_SIZE_PX } from '../config/render_config';
import { PIECE_TYPES } from '../config/tetromino_config';
import { TEXTS } from '../config/texts';
import { TITLE_GLYPHS, TITLE_LETTER_SPACING } from '../config/title_config';
import { drawBlock } from './draw_block';
import type { CanvasSize, RenderContext } from './render_context';

/** Celda ocupada en las matrices de las letras. */
const FILLED = '#';

/**
 * Matriz de una letra del título.
 * @param letter Letra.
 * @returns Filas de la letra.
 */
function glyphFor(letter: string): readonly string[] {
  const glyph = TITLE_GLYPHS[letter];
  if (glyph === undefined) {
    throw new Error(`No hay dibujo para la letra ${letter}`);
  }
  return glyph;
}

/**
 * Tamaño del canvas del título en píxeles lógicos.
 * @param text Texto del título.
 * @returns Ancho y alto.
 */
export function getTitleCanvasSize(text: string = TEXTS.title): CanvasSize {
  const glyphs = [...text].map(glyphFor);
  const columns =
    glyphs.reduce((total, glyph) => total + (glyph[0]?.length ?? 0), 0) +
    TITLE_LETTER_SPACING * (glyphs.length - 1);
  const rows = Math.max(...glyphs.map((glyph) => glyph.length));
  return { width: columns * CELL_SIZE_PX, height: rows * CELL_SIZE_PX };
}

/**
 * Dibuja el título con bloques del juego, cada letra con el color de una pieza.
 * @param ctx Contexto del canvas del título.
 * @param text Texto del título.
 */
export function drawTitle(ctx: RenderContext, text: string = TEXTS.title): void {
  let column = 0;
  [...text].forEach((letter, index) => {
    const glyph = glyphFor(letter);
    const pieceType = PIECE_TYPES[index % PIECE_TYPES.length] ?? 'T';
    const colors = PIECE_COLORS[pieceType];
    glyph.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell === FILLED) {
          drawBlock(ctx, (column + x) * CELL_SIZE_PX, y * CELL_SIZE_PX, colors);
        }
      });
    });
    column += (glyph[0]?.length ?? 0) + TITLE_LETTER_SPACING;
  });
}
