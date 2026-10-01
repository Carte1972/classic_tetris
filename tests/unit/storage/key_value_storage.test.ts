import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBrowserStorage, readJson, writeJson } from '../../../src/storage/key_value_storage';
import { createMemoryStorage } from './memory_storage';

describe('key_value_storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lee y escribe JSON', () => {
    const storage = createMemoryStorage();
    writeJson(storage, 'clave', { a: 1 });
    expect(readJson(storage, 'clave')).toEqual({ a: 1 });
    expect(readJson(storage, 'otra')).toBeNull();
    expect(readJson(null, 'clave')).toBeNull();
  });

  it('devuelve localStorage si está disponible', () => {
    const storage = createMemoryStorage();
    vi.stubGlobal('window', { localStorage: storage });
    expect(getBrowserStorage()).toBe(storage);
  });

  it('devuelve null si el navegador bloquea localStorage', () => {
    vi.stubGlobal('window', {
      get localStorage() {
        throw new Error('SecurityError');
      },
    });
    expect(getBrowserStorage()).toBeNull();
  });
});
