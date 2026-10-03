import { describe, expect, it } from 'vitest';
import { MAX_RECORDS, RECORDS_STORAGE_KEY } from '../../../src/config/storage_config';
import {
  getRecordRank,
  insertRecord,
  loadRecords,
  normalizeRecordName,
  parseRecords,
  saveRecords,
  toIsoDate,
  type RecordEntry,
} from '../../../src/storage/records_store';
import { createMemoryStorage } from './memory_storage';

/** Récord de prueba con la puntuación indicada. */
const entry = (score: number, date = '2026-10-01'): RecordEntry => ({
  name: 'ANA',
  score,
  lines: 1,
  level: 0,
  date,
});

describe('insertRecord', () => {
  it('ordena de mayor a menor puntuación e indica la posición', () => {
    const first = insertRecord([], entry(100));
    expect(first.rank).toBe(0);
    const second = insertRecord(first.records, entry(300));
    expect(second.rank).toBe(0);
    const third = insertRecord(second.records, entry(200));
    expect(third.rank).toBe(1);
    expect(third.records.map((r) => r.score)).toEqual([300, 200, 100]);
  });

  it('a igual puntuación, la partida anterior queda delante', () => {
    const records = [entry(100, '2026-01-01')];
    const result = insertRecord(records, entry(100, '2026-02-02'));
    expect(result.rank).toBe(1);
    expect(result.records[0]?.date).toBe('2026-01-01');
  });

  it('guarda como máximo 10 y descarta las que no entran', () => {
    const full = Array.from({ length: MAX_RECORDS }, (_, i) => entry(1000 - i * 10));
    const rejected = insertRecord(full, entry(5));
    expect(rejected.rank).toBeNull();
    expect(rejected.records).toBe(full);
    const accepted = insertRecord(full, entry(995));
    expect(accepted.rank).toBe(1);
    expect(accepted.records).toHaveLength(MAX_RECORDS);
    expect(accepted.records.at(-1)?.score).toBe(920);
  });

  it('las posiciones vacías valen 0: una partida de 0 puntos nunca entra', () => {
    expect(getRecordRank([], 0)).toBeNull();
    expect(insertRecord([], entry(0))).toEqual({ records: [], rank: null });
    expect(getRecordRank([], 1)).toBe(0);
    expect(getRecordRank([entry(500)], 10)).toBe(1);
  });
});

describe('normalizeRecordName', () => {
  it('pasa a mayúsculas, también con tildes y en cirílico', () => {
    expect(normalizeRecordName('ana maría')).toBe('ANA MARÍA');
    expect(normalizeRecordName('пётр')).toBe('ПЁТР');
  });

  it('quita los caracteres no admitidos y los espacios sobrantes', () => {
    expect(normalizeRecordName('  la   <b>ana</b>! ')).toBe('LA BANAB');
    expect(normalizeRecordName('jose-luis.2')).toBe('JOSE-LUIS.');
  });

  it('corta a 10 caracteres y usa --- si queda vacío', () => {
    expect(normalizeRecordName('abcdefghijklmn')).toBe('ABCDEFGHIJ');
    expect(normalizeRecordName('')).toBe('---');
    expect(normalizeRecordName('¡¿?!')).toBe('---');
  });
});

describe('loadRecords / saveRecords', () => {
  it('guarda y vuelve a leer los récords', () => {
    const storage = createMemoryStorage();
    const records = [entry(500), entry(300)];
    saveRecords(storage, records);
    expect(loadRecords(storage)).toEqual(records);
  });

  it('descarta entradas inválidas, ordena y limita a 10', () => {
    const raw = [
      entry(10),
      { score: -1, lines: 0, level: 0, date: '2026-01-01' },
      { score: 5, lines: 0, level: 0, date: 'ayer' },
      'basura',
      null,
      ...Array.from({ length: 12 }, (_, i) => entry(100 + i)),
    ];
    const storage = createMemoryStorage({ [RECORDS_STORAGE_KEY]: JSON.stringify(raw) });
    const records = loadRecords(storage);
    expect(records).toHaveLength(MAX_RECORDS);
    expect(records[0]?.score).toBe(111);
    expect(records.every((r, i) => i === 0 || (records[i - 1]?.score ?? 0) >= r.score)).toBe(true);
  });

  it('los récords guardados antes de pedir el nombre quedan como ---', () => {
    const legacy = { score: 300, lines: 3, level: 1, date: '2026-09-01' };
    expect(parseRecords([legacy])).toEqual([{ ...legacy, name: '---' }]);
  });

  it('descarta los nombres no válidos', () => {
    const base = { score: 300, lines: 3, level: 1, date: '2026-09-01' };
    const raw = [
      { ...base, name: 'ana' },
      { ...base, name: 'ABCDEFGHIJK' },
      { ...base, name: 7 },
      { ...base, name: 'ПЁТР' },
    ];
    expect(parseRecords(raw)).toEqual([{ ...base, name: 'ПЁТР' }]);
  });

  it('sin datos o con datos corruptos devuelve una lista vacía', () => {
    expect(loadRecords(createMemoryStorage())).toEqual([]);
    expect(loadRecords(createMemoryStorage({ [RECORDS_STORAGE_KEY]: '{}' }))).toEqual([]);
  });
});

describe('toIsoDate', () => {
  it('formatea la fecha local como AAAA-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toIsoDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});
