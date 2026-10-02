import {
  BOARD_VERTICAL_CHROME_PX,
  GAME_HORIZONTAL_CHROME_PX,
  GAME_LAYOUT_WIDTH_UNITS,
  MAX_RENDER_SCALE,
  MIN_RENDER_SCALE,
} from '../config/render_config';
import { getBoardCanvasSize } from './layout';

/**
 * Mayor escala entera con la que la zona de juego cabe en la ventana: el pozo ocupa
 * casi todo el alto y el conjunto (marcador, pozo y siguiente pieza) cabe a lo ancho.
 * Solo múltiplos enteros, para que el pixel-art siga nítido.
 * @param viewportWidth Ancho de la ventana en píxeles.
 * @param viewportHeight Alto de la ventana en píxeles.
 * @returns Escala entre el mínimo y el máximo configurados.
 */
export function getViewportRenderScale(viewportWidth: number, viewportHeight: number): number {
  const board = getBoardCanvasSize();
  const byHeight = Math.floor((viewportHeight - BOARD_VERTICAL_CHROME_PX) / board.height);
  const byWidth = Math.floor((viewportWidth - GAME_HORIZONTAL_CHROME_PX) / GAME_LAYOUT_WIDTH_UNITS);
  return Math.min(MAX_RENDER_SCALE, Math.max(MIN_RENDER_SCALE, Math.min(byHeight, byWidth)));
}
