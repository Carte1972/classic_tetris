import { BOARD_BACKGROUND_COLOR, BOARD_FLASH_COLOR, PIECE_COLORS } from '../config/palette';
import { getPieceCells } from '../engine/tetrominoes';
import type { Board, GameState } from '../engine/types';
import { drawBlock } from './draw_block';
import { boardCellToPixel, getBoardCanvasSize } from './layout';
import { getPhaseProgress, isBoardFlashing, isColumnCleared } from './line_clear';
import type { RenderContext } from './render_context';

/** Opciones de dibujado del pozo. */
export interface BoardRenderOptions {
  /** Oculta las piezas (por ejemplo, durante la pausa). */
  readonly hidden: boolean;
}

/**
 * Dibuja el pozo completo a partir del estado: fondo, bloques fijados, animación de
 * limpieza y pieza activa. Las filas ocultas no se dibujan.
 * @param ctx Contexto del canvas del pozo.
 * @param state Estado del juego.
 * @param options Opciones de dibujado.
 */
export function drawBoard(ctx: RenderContext, state: GameState, options: BoardRenderOptions): void {
  const size = getBoardCanvasSize();
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = isBoardFlashing(state) ? BOARD_FLASH_COLOR : BOARD_BACKGROUND_COLOR;
  ctx.fillRect(0, 0, size.width, size.height);
  if (options.hidden) {
    return;
  }
  drawLockedCells(ctx, state);
  if (state.activePiece !== null) {
    const colors = PIECE_COLORS[state.activePiece.type];
    for (const cell of getPieceCells(state.activePiece)) {
      const pixel = boardCellToPixel(cell.x, cell.y);
      if (pixel !== null) {
        drawBlock(ctx, pixel.x, pixel.y, colors);
      }
    }
  }
}

/**
 * Dibuja los bloques fijados, ocultando las celdas ya borradas de las filas que se
 * están limpiando.
 * @param ctx Contexto del canvas del pozo.
 * @param state Estado del juego.
 */
function drawLockedCells(ctx: RenderContext, state: GameState): void {
  const board: Board = state.board;
  const progress = state.phase === 'lineClear' ? getPhaseProgress(state) : 0;
  board.forEach((row, y) => {
    const clearing = state.phase === 'lineClear' && state.clearingRows.includes(y);
    row.forEach((cell, x) => {
      const pixel = boardCellToPixel(x, y);
      if (cell === null || pixel === null || (clearing && isColumnCleared(x, progress))) {
        return;
      }
      drawBlock(ctx, pixel.x, pixel.y, PIECE_COLORS[cell]);
    });
  });
}
