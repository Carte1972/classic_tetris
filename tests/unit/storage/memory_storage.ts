import type { KeyValueStorage } from '../../../src/storage/key_value_storage';

/** Almacenamiento en memoria para tests. */
export function createMemoryStorage(initial: Record<string, string> = {}): KeyValueStorage & {
  readonly data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}
