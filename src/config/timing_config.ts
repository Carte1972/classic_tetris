/** Frames por segundo de la lógica del juego (timestep fijo). */
export const FRAMES_PER_SECOND = 60;

/** Milisegundos que dura un frame. */
export const FRAME_DURATION_MS = 1000 / FRAMES_PER_SECOND;

/** Frames entre cada fila de caída con soft drop. */
export const SOFT_DROP_FRAMES_PER_ROW = 2;

/** Frames que dura la animación de limpieza de líneas. */
export const LINE_CLEAR_ANIMATION_FRAMES = 20;

/** Retardo de entrada (ARE) mínimo, cuando la pieza se fija en las filas más bajas. */
export const ENTRY_DELAY_BASE_FRAMES = 10;

/** Frames que se añaden al ARE por cada tramo de altura. */
export const ENTRY_DELAY_STEP_FRAMES = 2;

/** Filas inferiores que usan el ARE mínimo. */
export const ENTRY_DELAY_BOTTOM_ROWS = 2;

/** Filas que forman cada tramo de altura del ARE. */
export const ENTRY_DELAY_ROWS_PER_STEP = 4;

/** Retardo de entrada (ARE) máximo. */
export const ENTRY_DELAY_MAX_FRAMES = 18;
