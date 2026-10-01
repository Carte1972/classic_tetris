/**
 * Escribe bytes en un archivo creando su carpeta si hace falta.
 * @param path Ruta del archivo.
 * @param bytes Contenido.
 * @returns Tamaño final del archivo en bytes.
 */
export function writeBytes(path: string, bytes: Uint8Array): number;
