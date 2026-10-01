/** Lado de una celda en píxeles lógicos del canvas (estilo pixel-art). */
export const CELL_SIZE_PX = 8;

/** Separación entre bloques contiguos, en píxeles lógicos. */
export const BLOCK_GAP_PX = 1;

/** Grosor del bisel claro y oscuro de cada bloque, en píxeles lógicos. */
export const BLOCK_BEVEL_PX = 1;

/** Factor de escalado entero con el que se muestra el canvas en pantalla. */
export const RENDER_SCALE = 4;

/** Columnas del recuadro de la siguiente pieza. */
export const PREVIEW_COLUMNS = 5;

/** Filas del recuadro de la siguiente pieza. */
export const PREVIEW_ROWS = 3;

/** Líneas limpiadas a la vez que activan el destello del pozo. */
export const FLASH_LINE_COUNT = 4;

/** Frames que dura cada fase (encendido/apagado) del destello de 4 líneas. */
export const FLASH_PERIOD_FRAMES = 4;
