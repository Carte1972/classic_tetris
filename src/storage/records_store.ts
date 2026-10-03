import {
  MAX_NAME_LENGTH,
  MAX_RECORDS,
  RECORDS_STORAGE_KEY,
  UNNAMED_RECORD,
} from '../config/storage_config';
import { readJson, writeJson, type KeyValueStorage } from './key_value_storage';

/** Una partida del top 10. */
export interface RecordEntry {
  /** Nombre del jugador, en mayúsculas. */
  readonly name: string;
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

/** Caracteres que no pueden ir en un nombre (se admiten letras de cualquier alfabeto, cifras, espacio, punto y guion). */
const NAME_FORBIDDEN_CHARACTERS = /[^\p{L}\p{N} .-]/gu;

/** Espacios repetidos dentro de un nombre. */
const REPEATED_SPACES = / {2,}/g;

/**
 * Deja un nombre escrito por el jugador listo para el ranking: en mayúsculas, sin
 * caracteres no admitidos ni espacios sobrantes y con 10 caracteres como máximo.
 * @param raw Texto escrito.
 * @returns El nombre, o `---` si queda vacío.
 */
export function normalizeRecordName(raw: string): string {
  const cleaned = raw
    .toLocaleUpperCase('es-ES')
    .replace(NAME_FORBIDDEN_CHARACTERS, '')
    .replace(REPEATED_SPACES, ' ')
    .trim();
  const name = Array.from(cleaned).slice(0, MAX_NAME_LENGTH).join('').trim();
  return name === '' ? UNNAMED_RECORD : name;
}

/**
 * Convierte unos récords leídos (del navegador o de `records.json`) descartando las
 * entradas inválidas. Las guardadas antes de pedir el nombre quedan como `---`.
 * @param raw Valor leído, sin validar.
 * @returns Récords ordenados de mayor a menor puntuación (como máximo 10).
 */
export function parseRecords(raw: unknown): readonly RecordEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .flatMap((value: unknown) => {
      const entry = toRecordEntry(value);
      return entry === null ? [] : [entry];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RECORDS);
}

/**
 * Lee los récords guardados en el navegador descartando las entradas inválidas.
 * @param storage Almacenamiento.
 * @returns Récords ordenados de mayor a menor puntuación (como máximo 10).
 */
export function loadRecords(storage: KeyValueStorage | null): readonly RecordEntry[] {
  return parseRecords(readJson(storage, RECORDS_STORAGE_KEY));
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
 * Posición que ocuparía una puntuación en el ranking: tiene que superar la de esa
 * posición, y las posiciones vacías valen 0 (así, una partida de 0 puntos nunca entra).
 * A igual puntuación, la partida más antigua queda por delante.
 * @param records Récords actuales, ordenados.
 * @param score Puntuación de la partida.
 * @returns La posición (0 = la mejor), o `null` si no entra.
 */
export function getRecordRank(records: readonly RecordEntry[], score: number): number | null {
  const index = records.findIndex((record) => score > record.score);
  const position = index === -1 ? records.length : index;
  return position >= MAX_RECORDS || score <= 0 ? null : position;
}

/**
 * Añade una partida a los récords si entra en el top 10 (ver `getRecordRank`).
 * @param records Récords actuales, ordenados.
 * @param entry Partida terminada.
 * @returns Los récords nuevos y la posición obtenida.
 */
export function insertRecord(records: readonly RecordEntry[], entry: RecordEntry): RecordInsertion {
  const position = getRecordRank(records, entry.score);
  if (position === null) {
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
 * Convierte un valor leído en un récord si tiene su forma. Sin nombre (récords de antes
 * de pedirlo) queda como `---`; con un nombre no válido, se descarta.
 * @param value Valor desconocido.
 * @returns El récord, o `null` si no es válido.
 */
function toRecordEntry(value: unknown): RecordEntry | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const data = value as Record<string, unknown>;
  const { score, lines, level, date } = data;
  const name = data['name'] ?? UNNAMED_RECORD;
  if (
    !isNonNegativeInteger(score) ||
    !isNonNegativeInteger(lines) ||
    !isNonNegativeInteger(level) ||
    typeof date !== 'string' ||
    !ISO_DATE_PATTERN.test(date) ||
    typeof name !== 'string' ||
    normalizeRecordName(name) !== name
  ) {
    return null;
  }
  return { name, score, lines, level, date };
}

/**
 * Indica si un valor es un entero mayor o igual que cero.
 * @param value Valor desconocido.
 * @returns `true` si lo es.
 */
function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
