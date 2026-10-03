import { describe, expect, it, vi } from 'vitest';
import { RECORDS_API_PATH } from '../../../src/config/storage_config';
import {
  createRecordsFile,
  type RecordsFetch,
  type RecordsResponse,
} from '../../../src/storage/records_file';
import type { RecordEntry } from '../../../src/storage/records_store';

const RECORDS: readonly RecordEntry[] = [
  { name: 'ПЁТР', score: 900, lines: 9, level: 1, date: '2026-10-02' },
  { name: 'ANA', score: 500, lines: 5, level: 0, date: '2026-10-01' },
];

/** Respuesta falsa con el tipo de contenido y el cuerpo indicados. */
function response(ok: boolean, contentType: string | null, body: unknown = null): RecordsResponse {
  return {
    ok,
    headers: { get: (name) => (name.toLowerCase() === 'content-type' ? contentType : null) },
    json: () => Promise.resolve(body),
  };
}

describe('createRecordsFile', () => {
  it('lee el ranking del servidor y lo valida', async () => {
    const fetchRecords = vi.fn<RecordsFetch>(() =>
      Promise.resolve(
        response(true, 'application/json; charset=utf-8', [...RECORDS, { basura: 1 }]),
      ),
    );
    expect(await createRecordsFile(fetchRecords).load()).toEqual(RECORDS);
    expect(fetchRecords).toHaveBeenCalledWith(RECORDS_API_PATH, { method: 'GET' });
  });

  it('sin servidor de récords (la ruta devuelve la página, un error o falla la red) devuelve null', async () => {
    const page = createRecordsFile(() => Promise.resolve(response(true, 'text/html')));
    expect(await page.load()).toBeNull();
    const missing = createRecordsFile(() => Promise.resolve(response(false, 'application/json')));
    expect(await missing.load()).toBeNull();
    const offline = createRecordsFile(() => Promise.reject(new TypeError('Failed to fetch')));
    expect(await offline.load()).toBeNull();
  });

  it('guarda el ranking como JSON legible con PUT', async () => {
    const fetchRecords = vi.fn<RecordsFetch>(() => Promise.resolve(response(true, null)));
    expect(await createRecordsFile(fetchRecords).save(RECORDS)).toBe(true);
    expect(fetchRecords).toHaveBeenCalledWith(RECORDS_API_PATH, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: `${JSON.stringify(RECORDS, null, 2)}\n`,
    });
  });

  it('si no se puede guardar devuelve false', async () => {
    const refused = createRecordsFile(() => Promise.resolve(response(false, null)));
    expect(await refused.save(RECORDS)).toBe(false);
    const offline = createRecordsFile(() => Promise.reject(new TypeError('Failed to fetch')));
    expect(await offline.save(RECORDS)).toBe(false);
  });
});
