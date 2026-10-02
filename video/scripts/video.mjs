// `npm run video`: regenera el vídeo explicativo desde cero.
// 1. Narración con la voz del sistema (video/audio/narracion_0N.aiff).
// 2. Con Playwright: música y efectos del juego, grabaciones del juego y rótulos.
// 3. Montaje y mezcla con ffmpeg (video/salida/tetris_video_explicativo.mp4).
import { execFileSync } from 'node:child_process';

const root = new URL('../../', import.meta.url).pathname;

/**
 * Ejecuta un paso mostrando su salida.
 * @param {string} title Nombre del paso.
 * @param {string} program Programa.
 * @param {string[]} args Argumentos.
 */
function step(title, program, args) {
  process.stdout.write(`\n== ${title}\n`);
  execFileSync(program, args, { cwd: root, stdio: 'inherit' });
}

step('Narración', 'node', ['video/scripts/narrar.mjs']);
step('Audio del juego, grabaciones y rótulos', 'npx', [
  'playwright',
  'test',
  '-c',
  'playwright.video.config.ts',
]);
step('Montaje y mezcla', 'node', ['video/scripts/montaje.mjs']);
