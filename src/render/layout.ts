import { BOARD_COLUMNS, HIDDEN_ROWS, VISIBLE_ROWS } from '../config/board_config';
import { CELL_SIZE_PX, PREVIEW_COLUMNS, PREVIEW_ROWS } from '../config/render_config';
import { getPieceOffsets } from '../engine/tetrominoes';
import type { PieceType } from '../engine/types';
import type { CanvasSize } from './render_context';

/** Posición en píxeles lógicos. */
export interface PixelPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Tamaño del canvas del pozo (solo filas visibles).
 * @returns Ancho y alto en píxeles lógicos.
 */
export function getBoardCanvasSize(): CanvasSize {
  return { width: BOARD_COLUMNS * CELL_SIZE_PX, height: VISIBLE_ROWS * CELL_SIZE_PX };
}

/**
 * Tamaño del canvas de la siguiente pieza.
 * @returns Ancho y alto en píxeles lógicos.
 */
export function getPreviewCanvasSize(): CanvasSize {
  return { width: PREVIEW_COLUMNS * CELL_SIZE_PX, height: PREVIEW_ROWS * CELL_SIZE_PX };
}

/**
 * Convierte una celda del tablero en su posición en el canvas del pozo, o `null` si
 * está en las filas ocultas.
 * @param x Columna.
 * @param y Fila del tablero (incluidas las ocultas).
 * @returns Esquina superior izquierda en píxeles lógicos.
 */
export function boardCellToPixel(x: number, y: number): PixelPoint | null {
  const visibleRow = y - HIDDEN_ROWS;
  if (visibleRow < 0) {
    return null;
  }
  return { x: x * CELL_SIZE_PX, y: visibleRow * CELL_SIZE_PX };
}

/**
 * Posiciones de las celdas de una pieza centrada en el recuadro de vista previa.
 * @param type Pieza a mostrar (en su orientación de aparición).
 * @returns Esquina superior izquierda de cada bloque, en píxeles lógicos.
 */
export function getPreviewBlockPositions(type: PieceType): readonly PixelPoint[] {
  const offsets = getPieceOffsets(type, 0);
  const xs = offsets.map((o) => o.x);
  const ys = offsets.map((o) => o.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const pieceWidth = (Math.max(...xs) - minX + 1) * CELL_SIZE_PX;
  const pieceHeight = (Math.max(...ys) - minY + 1) * CELL_SIZE_PX;
  const size = getPreviewCanvasSize();
  const originX = Math.floor((size.width - pieceWidth) / 2);
  const originY = Math.floor((size.height - pieceHeight) / 2);
  return offsets.map((o) => ({
    x: originX + (o.x - minX) * CELL_SIZE_PX,
    y: originY + (o.y - minY) * CELL_SIZE_PX,
  }));
}
