import { PIECE_COLORS, PREVIEW_BACKGROUND_COLOR } from '../config/palette';
import type { PieceType } from '../engine/types';
import { drawBlock } from './draw_block';
import { getPreviewBlockPositions, getPreviewCanvasSize } from './layout';
import type { RenderContext } from './render_context';

/**
 * Dibuja la siguiente pieza centrada en su recuadro.
 * @param ctx Contexto del canvas de vista previa.
 * @param type Pieza siguiente.
 */
export function drawNextPiece(ctx: RenderContext, type: PieceType): void {
  const size = getPreviewCanvasSize();
  ctx.fillStyle = PREVIEW_BACKGROUND_COLOR;
  ctx.fillRect(0, 0, size.width, size.height);
  for (const position of getPreviewBlockPositions(type)) {
    drawBlock(ctx, position.x, position.y, PIECE_COLORS[type]);
  }
}
