/** Clave de localStorage de las preferencias. */
export const PREFERENCES_STORAGE_KEY = 'tetris.preferences';

/** Clave de localStorage de los récords. */
export const RECORDS_STORAGE_KEY = 'tetris.records';

/** Número de récords que se guardan (el ranking tiene siempre estas posiciones). */
export const MAX_RECORDS = 10;

/** Longitud máxima del nombre de un récord, en caracteres. */
export const MAX_NAME_LENGTH = 10;

/** Nombre de los récords sin nombre (los guardados antes de pedirlo) y de los huecos del ranking. */
export const UNNAMED_RECORD = '---';

/**
 * Ruta del servidor local de los lanzadores que lee y guarda el ranking en `records.json`.
 * Si no responde (juego abierto con `file://`), el ranking se guarda en el navegador.
 */
export const RECORDS_API_PATH = '/api/records';
