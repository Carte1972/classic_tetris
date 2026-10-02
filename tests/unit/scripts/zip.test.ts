import { describe, expect, it } from 'vitest';
import { crc32, createZip } from '../../../scripts/zip.mjs';

/** Entrada leída del directorio central. */
interface CentralEntry {
  readonly name: string;
  readonly method: number;
  readonly crc: number;
  readonly compressedSize: number;
  readonly size: number;
  readonly mode: number;
  readonly madeByUnix: boolean;
  readonly localOffset: number;
}

/** Lee el directorio central de un ZIP. */
function readCentralDirectory(zip: Uint8Array): CentralEntry[] {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const end = zip.byteLength - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const entries: CentralEntry[] = [];
  for (let i = 0; i < count; i++) {
    expect(view.getUint32(offset, true)).toBe(0x02014b50);
    const nameLength = view.getUint16(offset + 28, true);
    entries.push({
      name: new TextDecoder().decode(zip.subarray(offset + 46, offset + 46 + nameLength)),
      method: view.getUint16(offset + 10, true),
      crc: view.getUint32(offset + 16, true),
      compressedSize: view.getUint32(offset + 20, true),
      size: view.getUint32(offset + 24, true),
      mode: view.getUint32(offset + 38, true) >>> 16,
      madeByUnix: view.getUint8(offset + 5) === 3,
      localOffset: view.getUint32(offset + 42, true),
    });
    offset += 46 + nameLength;
  }
  return entries;
}

/** Descomprime los datos de una entrada a partir de su cabecera local. */
async function extract(zip: Uint8Array, entry: CentralEntry): Promise<Uint8Array> {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  expect(view.getUint32(entry.localOffset, true)).toBe(0x04034b50);
  const start = entry.localOffset + 30 + view.getUint16(entry.localOffset + 26, true);
  const data = zip.slice(start, start + entry.compressedSize);
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

describe('crc32', () => {
  it('coincide con valores de referencia', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array(0))).toBe(0);
  });
});

describe('createZip', () => {
  const html = new TextEncoder().encode('<!doctype html>'.repeat(50));
  const script = new TextEncoder().encode('#!/bin/sh\necho hola\n');
  const zip = createZip(
    [
      { name: 'tetris/', data: new Uint8Array(0), mode: 0o40755 },
      { name: 'tetris/index.html', data: html, mode: 0o100644 },
      { name: 'tetris/Tetris.command', data: script, mode: 0o100755 },
    ],
    new Date(2026, 9, 1, 12, 30),
  );
  const entries = readCentralDirectory(zip);

  it('incluye todas las entradas con su nombre y tamaño', () => {
    expect(entries.map((e) => [e.name, e.size])).toEqual([
      ['tetris/', 0],
      ['tetris/index.html', html.length],
      ['tetris/Tetris.command', script.length],
    ]);
  });

  it('guarda los permisos Unix para que los lanzadores sigan siendo ejecutables', () => {
    expect(entries.every((e) => e.madeByUnix)).toBe(true);
    expect(entries.map((e) => e.mode)).toEqual([0o40755, 0o100644, 0o100755]);
  });

  it('comprime con deflate y el contenido se recupera intacto con su CRC', async () => {
    const file = entries[1];
    if (file === undefined) {
      throw new Error('Falta la entrada index.html');
    }
    expect(file.method).toBe(8);
    expect(file.compressedSize).toBeLessThan(html.length);
    expect(await extract(zip, file)).toEqual(html);
    expect(file.crc).toBe(crc32(html));
  });
});
