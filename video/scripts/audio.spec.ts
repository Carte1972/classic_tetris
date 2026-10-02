import { expect, test } from '@playwright/test';
import type { SfxName } from '../../src/config/sfx_config';
import { writeBytes } from '../../tests/screenshots/write_file.mjs';
import type { AudioRequest } from '../paginas/audio_render';

/** Carpeta del audio del vídeo. */
const AUDIO_DIR = new URL('../audio/', import.meta.url);

/** Música que necesita el montaje: duración con margen y tempo. */
const SONGS: readonly { file: string; request: AudioRequest }[] = [
  {
    file: 'musica_korobeiniki.wav',
    request: { kind: 'song', song: 'korobeiniki', seconds: 180, tempo: 1 },
  },
  {
    file: 'musica_korobeiniki_rapida.wav',
    request: { kind: 'song', song: 'korobeiniki', seconds: 30, tempo: 1.15 },
  },
  { file: 'musica_kalinka.wav', request: { kind: 'song', song: 'kalinka', seconds: 30, tempo: 1 } },
];

/** Efectos que suenan en el vídeo. */
const EFFECTS: readonly SfxName[] = [
  'move',
  'rotate',
  'lock',
  'lineClear',
  'tetris',
  'levelUp',
  'gameOver',
];

test('renderiza la música y los efectos del juego a WAV', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/video/paginas/audio.html');
  await page.waitForFunction(() => window.__renderAudio !== undefined);
  const effects = EFFECTS.map((name) => {
    const request: AudioRequest = { kind: 'sfx', name };
    return { file: `efecto_${name}.wav`, request };
  });
  const requests = [...SONGS, ...effects];
  for (const { file, request } of requests) {
    const base64 = await page.evaluate(
      (r) => window.__renderAudio?.(r) ?? Promise.resolve(''),
      request,
    );
    const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
    expect(bytes.length).toBeGreaterThan(1000);
    writeBytes(new URL(file, AUDIO_DIR).pathname, bytes);
  }
});
