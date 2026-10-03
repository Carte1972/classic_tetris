/** Puerto del servidor de vista previa del build de producción (ranking en el navegador). */
export const PREVIEW_PORT = 4173;

/**
 * Puerto del servidor de récords de los lanzadores (records_server.pl) sirviendo el mismo
 * build: con él, el ranking se guarda en el disco.
 */
export const RECORDS_SERVER_PORT = 4175;

/** Dirección del juego servido por el servidor de récords. */
export const RECORDS_SERVER_URL = `http://127.0.0.1:${RECORDS_SERVER_PORT}`;

/** Archivo donde guarda el ranking el servidor de récords durante los e2e. */
export const E2E_RECORDS_FILE = '.e2e-records.json';
