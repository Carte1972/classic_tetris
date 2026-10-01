import type { BlockColors } from '../config/palette';
import { BLOCK_BEVEL_PX, BLOCK_GAP_PX, CELL_SIZE_PX } from '../config/render_config';
import type { RenderContext } from './render_context';

/**
 * Dibuja un bloque pixel-art con bisel claro arriba a la izquierda, bisel oscuro abajo
 * a la derecha y un píxel de brillo.
 * @param ctx Contexto de dibujo.
 * @param px Coordenada x de la esquina superior izquierda, en píxeles lógicos.
 * @param py Coordenada y de la esquina superior izquierda, en píxeles lógicos.
 * @param colors Colores del bloque.
 */
export function drawBlock(ctx: RenderContext, px: number, py: number, colors: BlockColors): void {
  const size = CELL_SIZE_PX - BLOCK_GAP_PX;
  const far = size - BLOCK_BEVEL_PX;
  ctx.fillStyle = colors.fill;
  ctx.fillRect(px, py, size, size);
  ctx.fillStyle = colors.highlight;
  ctx.fillRect(px, py, size, BLOCK_BEVEL_PX);
  ctx.fillRect(px, py, BLOCK_BEVEL_PX, size);
  ctx.fillStyle = colors.shadow;
  ctx.fillRect(px, py + far, size, BLOCK_BEVEL_PX);
  ctx.fillRect(px + far, py, BLOCK_BEVEL_PX, size);
  ctx.fillStyle = colors.shine;
  ctx.fillRect(px + BLOCK_BEVEL_PX, py + BLOCK_BEVEL_PX, BLOCK_BEVEL_PX, BLOCK_BEVEL_PX);
}
