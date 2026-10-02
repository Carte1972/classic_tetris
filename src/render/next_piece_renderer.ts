import { PIECE_COLORS, PREVIEW_BACKGROUND_COLOR } from '../config/palette';
import type { PieceType } from '../engine/types';
import { drawBlock } from './draw_block';
import { getPreviewBlockPositions, getPreviewCanvasSize } from './layout';
import type { RenderContext } from './render_context';

/**
 * Dibuja la siguiente pieza centrada en su recuadro, o solo el fondo si está oculta.
 * @param ctx Contexto del canvas de vista previa.
 * @param type Pieza siguiente, o `null` si no se muestra.
 */
export function drawNextPiece(ctx: RenderContext, type: PieceType | null): void {
  const size = getPreviewCanvasSize();
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = PREVIEW_BACKGROUND_COLOR;
  ctx.fillRect(0, 0, size.width, size.height);
  if (type === null) {
    return;
  }
  for (const position of getPreviewBlockPositions(type)) {
    drawBlock(ctx, position.x, position.y, PIECE_COLORS[type]);
  }
}
