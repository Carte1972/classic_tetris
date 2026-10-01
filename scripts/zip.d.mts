/** Archivo que se añade a un ZIP. */
export interface ZipEntry {
  /** Ruta dentro del ZIP; si acaba en `/` es un directorio. */
  readonly name: string;
  readonly data: Uint8Array;
  /** Tipo y permisos Unix, p. ej. `0o100755` (ejecutable) o `0o40755` (directorio). */
  readonly mode: number;
}

/**
 * Calcula el CRC-32 de unos bytes.
 * @param bytes Datos.
 * @returns CRC-32 sin signo.
 */
export function crc32(bytes: Uint8Array): number;

/**
 * Crea un archivo ZIP en memoria.
 * @param entries Archivos y directorios.
 * @param date Fecha de modificación de todas las entradas.
 * @returns Contenido del ZIP.
 */
export function createZip(entries: readonly ZipEntry[], date: Date): Uint8Array;
