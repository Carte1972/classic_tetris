import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Une una secuencia de fotogramas PNG (frame_00000.png…) en un vídeo H.264 sin pérdida
 * visible, a la frecuencia indicada.
 * @param {string} framesDir Carpeta de los fotogramas.
 * @param {string} output Vídeo de salida (.mp4).
 * @param {number} fps Fotogramas por segundo.
 */
export function encodeFrames(framesDir, output, fps) {
  mkdirSync(dirname(output), { recursive: true });
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-v',
      'error',
      '-framerate',
      String(fps),
      '-i',
      `${framesDir}/frame_%05d.png`,
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '14',
      '-pix_fmt',
      'yuv420p',
      output,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
}

/**
 * Vacía (o crea) una carpeta.
 * @param {string} dir Carpeta.
 */
export function resetDir(dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}
