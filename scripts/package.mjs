// Genera release/bloques-v<versión>.zip con el juego (index.html autocontenido), los
// lanzadores de macOS, Linux y Windows y el LEEME. Requiere haber ejecutado `npm run build`.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createZip } from './zip.mjs';

/** Permisos Unix de un archivo normal, de uno ejecutable y de un directorio. */
const MODE_FILE = 0o100644;
const MODE_EXECUTABLE = 0o100755;
const MODE_DIRECTORY = 0o40755;

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const folder = `bloques-v${version}/`;
const game = new URL('dist/index.html', root);

if (!existsSync(game)) {
  process.stderr.write('No existe dist/index.html. Ejecuta antes: npm run build\n');
  process.exit(1);
}

/** Archivos del paquete: origen, nombre dentro del ZIP y permisos. */
const files = [
  { from: game, name: 'index.html', mode: MODE_FILE },
  {
    from: new URL('launchers/Bloques.command', root),
    name: 'Bloques.command',
    mode: MODE_EXECUTABLE,
  },
  { from: new URL('launchers/bloques.sh', root), name: 'bloques.sh', mode: MODE_EXECUTABLE },
  { from: new URL('launchers/Bloques.bat', root), name: 'Bloques.bat', mode: MODE_FILE },
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
const output = new URL(`bloques-v${version}.zip`, outputDir);
writeFileSync(output, zip);
process.stdout.write(`Paquete creado: release/bloques-v${version}.zip (${zip.length} bytes)\n`);
