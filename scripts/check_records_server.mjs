// Comprueba el servidor de récords de los lanzadores en el sistema en que se ejecuta:
// Perl en macOS y Linux (records_server.pl) y PowerShell en Windows (records_server.ps1).
// Lo arranca con un juego y un ranking de prueba en una carpeta temporal, prueba sus rutas
// y lo reinicia para ver que el ranking sigue en el disco.
// Uso: node scripts/check_records_server.mjs [carpeta con los scripts del servidor]
// (por defecto, launchers/; en el CI también se prueba la copia del zip de la release).
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

/** Puerto de la prueba (fuera de los que usan los lanzadores, a partir del 47321). */
const PORT = 47391;
/** Tiempo máximo para que el servidor empiece a responder (ms). */
const START_TIMEOUT_MS = 15000;
/** Pausa entre intentos mientras arranca (ms). */
const RETRY_MS = 200;
/** Mayor que el límite del servidor (64 KB). */
const OVERSIZED_BYTES = 70000;

const windows = process.platform === 'win32';
const scriptsDir = resolve(process.argv[2] ?? 'launchers');
// HttpListener (Windows) atiende en localhost; el servidor de Perl, en 127.0.0.1.
const host = windows ? 'localhost' : '127.0.0.1';
const base = `http://${host}:${PORT}`;
const work = mkdtempSync(join(tmpdir(), 'tetris-records-'));
const recordsFile = join(work, 'records.json');
const page = '<!doctype html><title>ТЕТРИС</title>\n';
writeFileSync(join(work, 'index.html'), page);

/** Ranking de prueba, con cirílico y tildes para comprobar el UTF-8. */
const RECORDS = `${JSON.stringify(
  [
    { name: 'ПЁТР', score: 900, lines: 9, level: 1, date: '2026-10-02' },
    { name: 'JOSÉ', score: 500, lines: 5, level: 0, date: '2026-10-01' },
  ],
  null,
  2,
)}\n`;

/**
 * Arranca el servidor.
 * @returns {import('node:child_process').ChildProcess} El proceso.
 */
function startServer() {
  const child = windows
    ? spawn('powershell', [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        join(scriptsDir, 'records_server.ps1'),
        '-GameDir',
        work,
        '-RecordsFile',
        recordsFile,
        '-Port',
        String(PORT),
      ])
    : spawn('perl', [
        join(scriptsDir, 'records_server.pl'),
        work,
        recordsFile,
        '--port',
        String(PORT),
      ]);
  child.stdout?.on('data', (data) => process.stdout.write(`  [servidor] ${data}`));
  child.stderr?.on('data', (data) => process.stderr.write(`  [servidor] ${data}`));
  return child;
}

/**
 * Detiene el servidor y espera a que termine.
 * @param {import('node:child_process').ChildProcess} child Proceso del servidor.
 * @returns {Promise<void>}
 */
function stopServer(child) {
  return new Promise((done) => {
    if (child.exitCode !== null) {
      done();
      return;
    }
    child.once('exit', () => done());
    child.kill();
  });
}

/**
 * Hace una petición HTTP (con `node:http`, que permite cambiar la cabecera Host).
 * @param {string} method Método.
 * @param {string} path Ruta.
 * @param {{ body?: string | Buffer, headers?: Record<string, string> }} [options] Cuerpo y cabeceras.
 * @returns {Promise<{ status: number, type: string, body: string }>} La respuesta.
 */
function call(method, path, options = {}) {
  const body = options.body ?? '';
  return new Promise((done, fail) => {
    const req = request(
      `${base}${path}`,
      {
        method,
        headers: { 'Content-Length': Buffer.byteLength(body), ...options.headers },
      },
      (res) => {
        /** @type {Buffer[]} */
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () =>
          done({
            status: res.statusCode ?? 0,
            type: String(res.headers['content-type'] ?? ''),
            body: Buffer.concat(chunks).toString('utf8'),
          }),
        );
      },
    );
    req.on('error', fail);
    req.end(body);
  });
}

/**
 * Espera a que el servidor responda.
 * @returns {Promise<void>}
 */
async function waitUntilReady() {
  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      await call('GET', '/api/records');
      return;
    } catch {
      await new Promise((wait) => setTimeout(wait, RETRY_MS));
    }
  }
  throw new Error('El servidor no ha arrancado a tiempo');
}

let failures = 0;

/**
 * Anota el resultado de una comprobación.
 * @param {string} name Qué se comprueba.
 * @param {boolean} ok Si se cumple.
 * @param {unknown} [detail] Lo obtenido, para el mensaje de error.
 */
function check(name, ok, detail) {
  process.stdout.write(`${ok ? 'OK   ' : 'FALLO'} ${name}\n`);
  if (!ok) {
    failures++;
    process.stdout.write(`      obtenido: ${JSON.stringify(detail)}\n`);
  }
}

const json = { 'Content-Type': 'application/json' };
let server = startServer();
try {
  await waitUntilReady();

  const index = await call('GET', '/');
  check('GET / sirve index.html', index.status === 200 && index.body === page, index);
  check('index.html va como HTML en UTF-8', index.type.startsWith('text/html'), index.type);

  const empty = await call('GET', '/api/records');
  check(
    'sin archivo, el ranking es una lista vacía',
    empty.status === 200 &&
      empty.type.startsWith('application/json') &&
      JSON.parse(empty.body).length === 0,
    empty,
  );

  const saved = await call('PUT', '/api/records', { body: RECORDS, headers: json });
  check('PUT guarda el ranking', saved.status === 204, saved);
  check(
    'records.json queda en el disco tal cual, en UTF-8',
    existsSync(recordsFile) && readFileSync(recordsFile, 'utf8') === RECORDS,
    existsSync(recordsFile) ? readFileSync(recordsFile, 'utf8') : null,
  );
  const read = await call('GET', '/api/records');
  check('GET devuelve el ranking guardado', read.status === 200 && read.body === RECORDS, read);

  const plain = await call('PUT', '/api/records', {
    body: '[]',
    headers: { 'Content-Type': 'text/plain' },
  });
  check('rechaza un ranking que no se envía como JSON', plain.status === 415, plain.status);
  const object = await call('PUT', '/api/records', { body: '{"a":1}', headers: json });
  check('rechaza lo que no es una lista', object.status === 400, object.status);
  const big = await call('PUT', '/api/records', {
    body: `[${'0,'.repeat(OVERSIZED_BYTES / 2)}0]`,
    headers: json,
  });
  check('rechaza un ranking demasiado grande', big.status === 413, big.status);
  check('los rechazos no tocan el archivo', readFileSync(recordsFile, 'utf8') === RECORDS);

  const foreign = await call('GET', '/api/records', { headers: { Host: 'evil.example' } });
  check(
    'rechaza peticiones que no van dirigidas a este equipo',
    foreign.status >= 400 && foreign.status < 500,
    foreign.status,
  );
  const missing = await call('GET', '/otra');
  check('una ruta desconocida da 404', missing.status === 404, missing.status);

  await stopServer(server);
  server = startServer();
  await waitUntilReady();
  const again = await call('GET', '/api/records');
  check('tras reiniciar el servidor, el ranking sigue ahí', again.body === RECORDS, again);
} catch (error) {
  failures++;
  process.stdout.write(`FALLO ${error instanceof Error ? error.message : String(error)}\n`);
} finally {
  await stopServer(server);
  rmSync(work, { recursive: true, force: true });
}

if (failures > 0) {
  process.stdout.write(`\n${failures} comprobaciones fallidas\n`);
  process.exit(1);
}
process.stdout.write('\nEl servidor de récords funciona\n');
