/** Almacenamiento clave-valor (en el navegador, `localStorage`). */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Lee y convierte un valor JSON guardado; ante cualquier error devuelve `null`.
 * @param storage Almacenamiento, o `null` si no está disponible.
 * @param key Clave.
 * @returns El valor leído, sin validar.
 */
export function readJson(storage: KeyValueStorage | null, key: string): unknown {
  try {
    const raw = storage?.getItem(key) ?? null;
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/**
 * Guarda un valor como JSON; si el almacenamiento falla (cuota, modo privado), lo ignora.
 * @param storage Almacenamiento, o `null` si no está disponible.
 * @param key Clave.
 * @param value Valor serializable.
 */
export function writeJson(storage: KeyValueStorage | null, key: string, value: unknown): void {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento disponible el juego sigue funcionando, solo que sin persistencia.
  }
}

/**
 * Obtiene `localStorage` si el navegador lo permite.
 * @returns El almacenamiento, o `null` si está bloqueado.
 */
export function getBrowserStorage(): KeyValueStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
