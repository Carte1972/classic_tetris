/** Lado de una celda en píxeles lógicos del canvas (estilo pixel-art). */
export const CELL_SIZE_PX = 8;

/** Separación entre bloques contiguos, en píxeles lógicos. */
export const BLOCK_GAP_PX = 1;

/** Grosor del bisel claro y oscuro de cada bloque, en píxeles lógicos. */
export const BLOCK_BEVEL_PX = 1;

/**
 * Escala de referencia de la zona de juego: los tamaños de la interfaz (textos,
 * márgenes) están pensados para ella y se multiplican por `escala / RENDER_SCALE`.
 */
export const RENDER_SCALE = 4;

/** Escala entera mínima de la zona de juego (ventanas pequeñas). */
export const MIN_RENDER_SCALE = 2;

/** Escala entera máxima de la zona de juego (pantallas muy grandes). */
export const MAX_RENDER_SCALE = 10;

/**
 * Píxeles de pantalla que no ocupa el pozo en vertical a escala de referencia: margen
 * de la página y bordes del marco.
 */
export const BOARD_VERTICAL_CHROME_PX = 56;

/**
 * Ancho de la zona de juego en píxeles lógicos del pozo, contando el marcador, la
 * siguiente pieza y las separaciones (se usa para que quepa a lo ancho).
 */
export const GAME_LAYOUT_WIDTH_UNITS = 200;

/** Margen horizontal total de la página en píxeles de pantalla. */
export const GAME_HORIZONTAL_CHROME_PX = 64;

/** Columnas del recuadro de la siguiente pieza. */
export const PREVIEW_COLUMNS = 5;

/** Filas del recuadro de la siguiente pieza. */
export const PREVIEW_ROWS = 3;

/** Líneas limpiadas a la vez que activan el destello del pozo. */
export const FLASH_LINE_COUNT = 4;

/** Frames que dura cada fase (encendido/apagado) del destello de 4 líneas. */
export const FLASH_PERIOD_FRAMES = 4;
