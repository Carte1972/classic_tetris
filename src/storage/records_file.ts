import { RECORDS_API_PATH } from '../config/storage_config';
import { parseRecords, type RecordEntry } from './records_store';

/** Tipo de contenido de las respuestas y peticiones con récords. */
const JSON_CONTENT_TYPE = 'application/json';

/** Sangría del JSON guardado, para que `records.json` se pueda leer a mano. */
const JSON_INDENT = 2;

/** Respuesta HTTP mínima que usa el cliente (la de `fetch` la cumple). */
export interface RecordsResponse {
  readonly ok: boolean;
  readonly headers: { readonly get: (name: string) => string | null };
  readonly json: () => Promise<unknown>;
}

/** Petición HTTP mínima que hace el cliente. */
export interface RecordsRequest {
  readonly method: 'GET' | 'PUT';
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
}

/** Función `fetch` (inyectable para los tests). */
export type RecordsFetch = (url: string, init: RecordsRequest) => Promise<RecordsResponse>;

/** Ranking guardado en el disco (`records.json`) a través del servidor local de los lanzadores. */
export interface RecordsFile {
  /**
   * Lee el ranking del archivo.
   * @returns Los récords, o `null` si no hay servidor de récords (juego abierto sin lanzador).
   */
  readonly load: () => Promise<readonly RecordEntry[] | null>;
  /**
   * Guarda el ranking en el archivo.
   * @returns `true` si se ha guardado.
   */
  readonly save: (records: readonly RecordEntry[]) => Promise<boolean>;
}

/**
 * Crea el cliente del archivo de récords.
 * @param fetchRecords Función `fetch` del navegador.
 * @returns El cliente.
 */
export function createRecordsFile(fetchRecords: RecordsFetch): RecordsFile {
  return {
    load: async () => {
      try {
        const response = await fetchRecords(RECORDS_API_PATH, { method: 'GET' });
        // Sin el servidor de los lanzadores (por ejemplo, con Vite) la ruta devuelve la página.
        const type = response.headers.get('content-type') ?? '';
        if (!response.ok || !type.startsWith(JSON_CONTENT_TYPE)) {
          return null;
        }
        return parseRecords(await response.json());
      } catch {
        return null;
      }
    },
    save: async (records) => {
      try {
        const response = await fetchRecords(RECORDS_API_PATH, {
          method: 'PUT',
          headers: { 'Content-Type': JSON_CONTENT_TYPE },
          body: `${JSON.stringify(records, null, JSON_INDENT)}\n`,
        });
        return response.ok;
      } catch {
        return false;
      }
    },
  };
}
