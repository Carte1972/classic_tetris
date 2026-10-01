import type { PieceType } from '../engine/types';

/** Colores de un bloque pixel-art: relleno, bisel claro, bisel oscuro y brillo. */
export interface BlockColors {
  readonly fill: string;
  readonly highlight: string;
  readonly shadow: string;
  readonly shine: string;
}

/** Paleta propia de Bloques: un color por pieza (no sigue la paleta oficial de ninguna versión). */
export const PIECE_COLORS: Readonly<Record<PieceType, BlockColors>> = {
  I: { fill: '#d94a5c', highlight: '#f07a88', shadow: '#8e2636', shine: '#ffe3e6' },
  O: { fill: '#9a6ad6', highlight: '#bd95ec', shadow: '#5d3a8f', shine: '#f1e6ff' },
  T: { fill: '#f2b134', highlight: '#ffd27a', shadow: '#a8701a', shine: '#fff6dc' },
  S: { fill: '#4a9be0', highlight: '#82c0f2', shadow: '#245f96', shine: '#e2f2ff' },
  Z: { fill: '#3fb8a5', highlight: '#7ddccb', shadow: '#1d7366', shine: '#e0fff9' },
  J: { fill: '#ef7d3b', highlight: '#ffa775', shadow: '#a24a17', shine: '#fff0e4' },
  L: { fill: '#9ccc4a', highlight: '#c2e77f', shadow: '#5f8424', shine: '#f4ffe2' },
};

/** Color de fondo del pozo. */
export const BOARD_BACKGROUND_COLOR = '#0b0d17';

/** Color de fondo del pozo durante el destello de 4 líneas. */
export const BOARD_FLASH_COLOR = '#e9e4d4';

/** Color de fondo del recuadro de la siguiente pieza. */
export const PREVIEW_BACKGROUND_COLOR = '#0b0d17';
