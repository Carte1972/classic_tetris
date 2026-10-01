import { deflateRawSync } from 'node:zlib';

/** Firma de la cabecera local de cada archivo. */
const LOCAL_HEADER_SIGNATURE = 0x04034b50;
/** Firma de cada entrada del directorio central. */
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
/** Firma del final del directorio central. */
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
/** Tamaños fijos de las tres estructuras (sin el nombre). */
const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
const END_OF_CENTRAL_DIRECTORY_SIZE = 22;
/** Versión de ZIP necesaria para extraer (2.0: deflate y directorios). */
const VERSION_NEEDED = 20;
/** "Creado en Unix" (byte alto), para que se respeten los permisos al extraer. */
const VERSION_MADE_BY_UNIX = (3 << 8) | VERSION_NEEDED;
/** Bit 11: los nombres están en UTF-8. */
const FLAG_UTF8 = 0x0800;
/** Métodos de compresión. */
const METHOD_STORE = 0;
const METHOD_DEFLATE = 8;
/** Polinomio del CRC-32 (IEEE). */
const CRC32_POLYNOMIAL = 0xedb88320;
/** Año base de las fechas de MS-DOS. */
const DOS_EPOCH_YEAR = 1980;

/** Tabla del CRC-32. */
const CRC32_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? CRC32_POLYNOMIAL ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

/**
 * Calcula el CRC-32 de unos bytes.
 * @param {Uint8Array} bytes Datos.
 * @returns {number} CRC-32 sin signo.
 */
export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = (CRC32_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Convierte una fecha al formato de MS-DOS que usa ZIP.
 * @param {Date} date Fecha.
 * @returns {{ time: number, day: number }} Hora y día codificados.
 */
function toDosDateTime(date) {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    day:
      ((date.getFullYear() - DOS_EPOCH_YEAR) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

/**
 * Crea un archivo ZIP en memoria. Los nombres que acaban en `/` son directorios.
 * @param {readonly { name: string, data: Uint8Array, mode: number }[]} entries Archivos
 *   con su ruta dentro del ZIP, su contenido y sus permisos Unix (p. ej. `0o100755`).
 * @param {Date} date Fecha de modificación de todas las entradas.
 * @returns {Uint8Array} Contenido del ZIP.
 */
export function createZip(entries, date) {
  const { time, day } = toDosDateTime(date);
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const isDirectory = entry.name.endsWith('/');
    const method = isDirectory ? METHOD_STORE : METHOD_DEFLATE;
    const compressed = isDirectory ? new Uint8Array(0) : deflateRawSync(entry.data);
    const crc = isDirectory ? 0 : crc32(entry.data);

    const local = Buffer.alloc(LOCAL_HEADER_SIZE);
    local.writeUInt32LE(LOCAL_HEADER_SIGNATURE, 0);
    local.writeUInt16LE(VERSION_NEEDED, 4);
    local.writeUInt16LE(FLAG_UTF8, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, compressed);

    const central = Buffer.alloc(CENTRAL_HEADER_SIZE);
    central.writeUInt32LE(CENTRAL_HEADER_SIGNATURE, 0);
    central.writeUInt16LE(VERSION_MADE_BY_UNIX, 4);
    central.writeUInt16LE(VERSION_NEEDED, 6);
    central.writeUInt16LE(FLAG_UTF8, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(day, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE((entry.mode << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(END_OF_CENTRAL_DIRECTORY_SIZE);
  end.writeUInt32LE(END_OF_CENTRAL_DIRECTORY_SIGNATURE, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}
