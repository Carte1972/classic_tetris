import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Escribe bytes en un archivo creando su carpeta si hace falta.
 * @param {string} path Ruta del archivo.
 * @param {Uint8Array} bytes Contenido.
 * @returns {number} Tamaño final del archivo en bytes.
 */
export function writeBytes(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
  return statSync(path).size;
}
