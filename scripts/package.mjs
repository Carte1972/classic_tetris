// Genera release/tetris-v<versión>.zip con el juego (index.html autocontenido), los
// lanzadores de macOS, Linux y Windows, el servidor local de récords de cada sistema y el
// LEEME. Requiere haber ejecutado `npm run build`.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createZip } from './zip.mjs';

/** Permisos Unix de un archivo normal, de uno ejecutable y de un directorio. */
const MODE_FILE = 0o100644;
const MODE_EXECUTABLE = 0o100755;
const MODE_DIRECTORY = 0o40755;

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const folder = `tetris-v${version}/`;
const game = new URL('dist/index.html', root);

if (!existsSync(game)) {
  process.stderr.write('No existe dist/index.html. Ejecuta antes: npm run build\n');
  process.exit(1);
}

/** Archivos del paquete: origen, nombre dentro del ZIP y permisos. */
const files = [
  { from: game, name: 'index.html', mode: MODE_FILE },
  {
    from: new URL('launchers/Tetris.command', root),
    name: 'Tetris.command',
    mode: MODE_EXECUTABLE,
  },
  { from: new URL('launchers/tetris.sh', root), name: 'tetris.sh', mode: MODE_EXECUTABLE },
  { from: new URL('launchers/Tetris.bat', root), name: 'Tetris.bat', mode: MODE_FILE },
  {
    from: new URL('launchers/records_server.pl', root),
    name: 'records_server.pl',
    mode: MODE_FILE,
  },
  {
    from: new URL('launchers/records_server.ps1', root),
    name: 'records_server.ps1',
    mode: MODE_FILE,
  },
  { from: new URL('launchers/LEEME.txt', root), name: 'LEEME.txt', mode: MODE_FILE },
];

const zip = createZip(
  [
    { name: folder, data: new Uint8Array(0), mode: MODE_DIRECTORY },
    ...files.map((file) => ({
      name: folder + file.name,
      data: readFileSync(file.from),
      mode: file.mode,
    })),
  ],
  new Date(),
);

const outputDir = new URL('release/', root);
mkdirSync(outputDir, { recursive: true });
const output = new URL(`tetris-v${version}.zip`, outputDir);
writeFileSync(output, zip);
process.stdout.write(`Paquete creado: release/tetris-v${version}.zip (${zip.length} bytes)\n`);
