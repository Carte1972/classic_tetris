import { describe, expect, it } from 'vitest';
import { PREFERENCES_STORAGE_KEY } from '../../../src/config/storage_config';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
} from '../../../src/storage/preferences_store';
import { createMemoryStorage } from './memory_storage';

describe('preferencias', () => {
  it('sin datos guardados usa los valores por defecto', () => {
    expect(loadPreferences(createMemoryStorage())).toEqual(DEFAULT_PREFERENCES);
    expect(loadPreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it('guarda y vuelve a leer las preferencias', () => {
    const storage = createMemoryStorage();
    const preferences = {
      startLevel: 7,
      musicEnabled: false,
      celebrationsEnabled: false,
      muted: true,
    };
    savePreferences(storage, preferences);
    expect(loadPreferences(storage)).toEqual(preferences);
  });

  it('corrige los campos inválidos y conserva los válidos', () => {
    const storage = createMemoryStorage({
      [PREFERENCES_STORAGE_KEY]: JSON.stringify({
        startLevel: 15,
        musicEnabled: 'sí',
        celebrationsEnabled: false,
      }),
    });
    expect(loadPreferences(storage)).toEqual({
      ...DEFAULT_PREFERENCES,
      celebrationsEnabled: false,
    });
  });

  it.each(['{roto', '42', 'null', '[]'])('ignora datos corruptos: %s', (raw) => {
    const storage = createMemoryStorage({ [PREFERENCES_STORAGE_KEY]: raw });
    expect(loadPreferences(storage)).toMatchObject(DEFAULT_PREFERENCES);
  });

  it('no falla si el almacenamiento lanza errores', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('sin cuota');
      },
    };
    expect(loadPreferences(broken)).toEqual(DEFAULT_PREFERENCES);
    expect(() => savePreferences(broken, DEFAULT_PREFERENCES)).not.toThrow();
  });
});
