import { MAX_START_LEVEL, MIN_START_LEVEL } from '../config/scoring_config';
import { PREFERENCES_STORAGE_KEY } from '../config/storage_config';
import { readJson, writeJson, type KeyValueStorage } from './key_value_storage';

/** Preferencias del jugador que se guardan entre sesiones. */
export interface Preferences {
  readonly startLevel: number;
  readonly musicEnabled: boolean;
  readonly celebrationsEnabled: boolean;
  /** Sonido silenciado con la tecla M. */
  readonly muted: boolean;
}

/** Preferencias por defecto. */
export const DEFAULT_PREFERENCES: Preferences = {
  startLevel: MIN_START_LEVEL,
  musicEnabled: true,
  celebrationsEnabled: true,
  muted: false,
};

/**
 * Lee las preferencias guardadas; cada campo ausente o inválido toma su valor por defecto.
 * @param storage Almacenamiento.
 * @returns Preferencias válidas.
 */
export function loadPreferences(storage: KeyValueStorage | null): Preferences {
  const raw = readJson(storage, PREFERENCES_STORAGE_KEY);
  if (typeof raw !== 'object' || raw === null) {
    return DEFAULT_PREFERENCES;
  }
  const data = raw as Record<string, unknown>;
  const level = data['startLevel'];
  return {
    startLevel:
      typeof level === 'number' &&
      Number.isInteger(level) &&
      level >= MIN_START_LEVEL &&
      level <= MAX_START_LEVEL
        ? level
        : DEFAULT_PREFERENCES.startLevel,
    musicEnabled: readBoolean(data['musicEnabled'], DEFAULT_PREFERENCES.musicEnabled),
    celebrationsEnabled: readBoolean(
      data['celebrationsEnabled'],
      DEFAULT_PREFERENCES.celebrationsEnabled,
    ),
    muted: readBoolean(data['muted'], DEFAULT_PREFERENCES.muted),
  };
}

/**
 * Guarda las preferencias.
 * @param storage Almacenamiento.
 * @param preferences Preferencias a guardar.
 */
export function savePreferences(storage: KeyValueStorage | null, preferences: Preferences): void {
  writeJson(storage, PREFERENCES_STORAGE_KEY, preferences);
}

/**
 * Devuelve el valor si es booleano o el valor por defecto en otro caso.
 * @param value Valor leído.
 * @param fallback Valor por defecto.
 * @returns Un booleano.
 */
function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
