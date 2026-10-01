import { MAX_RECORDS, RECORDS_STORAGE_KEY } from '../config/storage_config';
import { readJson, writeJson, type KeyValueStorage } from './key_value_storage';

/** Una partida del top 10. */
export interface RecordEntry {
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  /** Fecha de la partida en formato ISO (AAAA-MM-DD). */
  readonly date: string;
}

/** Resultado de intentar añadir una partida a los récords. */
export interface RecordInsertion {
  /** Récords actualizados. */
  readonly records: readonly RecordEntry[];
  /** Posición (0 = la mejor) de la partida, o `null` si no entra en el top. */
  readonly rank: number | null;
}

/** Formato de fecha ISO aceptado. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Lee los récords guardados descartando las entradas inválidas.
 * @param storage Almacenamiento.
 * @returns Récords ordenados de mayor a menor puntuación (como máximo 10).
 */
export function loadRecords(storage: KeyValueStorage | null): readonly RecordEntry[] {
  const raw = readJson(storage, RECORDS_STORAGE_KEY);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter(isRecordEntry)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RECORDS);
}

/**
 * Guarda los récords.
 * @param storage Almacenamiento.
 * @param records Récords a guardar.
 */
export function saveRecords(
  storage: KeyValueStorage | null,
  records: readonly RecordEntry[],
): void {
  writeJson(storage, RECORDS_STORAGE_KEY, records);
}

/**
 * Añade una partida a los récords si entra en el top 10. A igual puntuación, la partida
 * más antigua queda por delante.
 * @param records Récords actuales, ordenados.
 * @param entry Partida terminada.
 * @returns Los récords nuevos y la posición obtenida.
 */
export function insertRecord(records: readonly RecordEntry[], entry: RecordEntry): RecordInsertion {
  const index = records.findIndex((record) => entry.score > record.score);
  const position = index === -1 ? records.length : index;
  if (position >= MAX_RECORDS) {
    return { records, rank: null };
  }
  const updated = [...records.slice(0, position), entry, ...records.slice(position)].slice(
    0,
    MAX_RECORDS,
  );
  return { records: updated, rank: position };
}

/**
 * Formatea una fecha como AAAA-MM-DD en hora local.
 * @param date Fecha.
 * @returns Fecha en formato ISO corto.
 */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Comprueba que un valor leído tiene la forma de un récord.
 * @param value Valor desconocido.
 * @returns `true` si es un récord válido.
 */
function isRecordEntry(value: unknown): value is RecordEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const data = value as Record<string, unknown>;
  return (
    isNonNegativeInteger(data['score']) &&
    isNonNegativeInteger(data['lines']) &&
    isNonNegativeInteger(data['level']) &&
    typeof data['date'] === 'string' &&
    ISO_DATE_PATTERN.test(data['date'])
  );
}

/**
 * Indica si un valor es un entero mayor o igual que cero.
 * @param value Valor desconocido.
 * @returns `true` si lo es.
 */
function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
