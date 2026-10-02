import { test, type Page } from '@playwright/test';
import { writeBytes } from '../../tests/screenshots/write_file.mjs';
import { extractFrame, resetDir } from './codificar.mjs';
import { FPS } from './grabacion';

// Captura los rótulos (video/rotulos/) sobre fondo transparente: los fijos como PNG y los
// animados como secuencias de fotogramas; y genera la miniatura del vídeo.

/** Carpeta de los rótulos capturados. */
const OUT_DIR = new URL('../tmp/rotulos/', import.meta.url);

/** Rótulos fijos: nombre del archivo y parámetros de la página. */
const STATIC_ROTULOS: readonly { file: string; query: string }[] = [
  { file: 'rotulo_fecha_1984', query: 'nombre=fecha_1984' },
  { file: 'rotulo_fecha_1989', query: 'nombre=fecha_1989' },
  { file: 'rotulo_piezas', query: 'nombre=piezas' },
  { file: 'rotulo_objetivo', query: 'nombre=objetivo' },
  {
    file: 'rotulo_evento_desfile',
    query: `nombre=evento&texto=${encodeURIComponent('DESFILE DE LA VICTORIA')}`,
  },
  {
    file: 'rotulo_evento_pascua',
    query: `nombre=evento&texto=${encodeURIComponent('PASCUA ORTODOXA')}`,
  },
  {
    file: 'rotulo_evento_navidad',
    query: `nombre=evento&texto=${encodeURIComponent('NAVIDAD Y AÑO NUEVO')}`,
  },
  {
    file: 'rotulo_evento_fuegos',
    query: `nombre=evento&texto=${encodeURIComponent('FUEGOS ARTIFICIALES')}`,
  },
  {
    file: 'rotulo_evento_maslenitsa',
    query: `nombre=evento&texto=${encodeURIComponent('MASLENITSA')}`,
  },
  {
    file: 'rotulo_evento_olimpiadas',
    query: `nombre=evento&texto=${encodeURIComponent('CAMPEONES OLÍMPICOS')}`,
  },
  { file: 'rotulo_cierre', query: 'nombre=cierre' },
];

/** Rótulos animados: nombre, parámetros y duración (s). */
const ANIMATED_ROTULOS: readonly { file: string; query: string; seconds: number }[] = [
  { file: 'rotulo_titulo', query: 'nombre=titulo', seconds: 6 },
  { file: 'rotulo_controles', query: 'nombre=controles', seconds: 18 },
];

/**
 * Abre un rótulo y espera a que esté dibujado (con las fuentes cargadas).
 * @param page Página.
 * @param query Parámetros.
 */
async function openRotulo(page: Page, query: string): Promise<void> {
  await page.goto(`/video/rotulos/rotulo.html?${query}`);
  await page.waitForFunction(() => window.__rotulo !== undefined);
  await page.evaluate(() => document.fonts.ready);
}

test.describe.configure({ mode: 'serial' });

test('rótulos fijos', async ({ page }) => {
  for (const rotulo of STATIC_ROTULOS) {
    await openRotulo(page, rotulo.query);
    const png = await page.screenshot({ omitBackground: true });
    writeBytes(new URL(`${rotulo.file}.png`, OUT_DIR).pathname, png);
  }
});

for (const rotulo of ANIMATED_ROTULOS) {
  test(`rótulo animado ${rotulo.file}`, async ({ page }) => {
    await openRotulo(page, rotulo.query);
    const dir = new URL(`${rotulo.file}/`, OUT_DIR).pathname;
    resetDir(dir);
    const frames = Math.round(rotulo.seconds * FPS);
    for (let i = 0; i < frames; i++) {
      await page.evaluate((t) => window.__rotulo?.render(t), i / FPS);
      const png = await page.screenshot({ omitBackground: true });
      writeBytes(`${dir}frame_${String(i).padStart(5, '0')}.png`, png);
    }
    const eventos = await page.evaluate(() => window.__rotulo?.eventos ?? []);
    writeBytes(
      new URL(`${rotulo.file}.json`, OUT_DIR).pathname,
      new TextEncoder().encode(JSON.stringify({ eventos }, null, 2) + '\n'),
    );
  });
}

test('miniatura del vídeo (1280 × 720)', async ({ page }) => {
  const background = new URL('../tmp/miniatura_fondo.png', import.meta.url).pathname;
  extractFrame(
    new URL('../extractos/extracto_plaza_titulo.mp4', import.meta.url).pathname,
    3,
    background,
    1280,
    720,
  );
  await openRotulo(
    page,
    `nombre=miniatura&fondo=${encodeURIComponent('/video/tmp/miniatura_fondo.png')}`,
  );
  await page.waitForFunction(() =>
    [...document.images].every((img) => img.complete && img.naturalWidth > 0),
  );
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 1280, height: 720 } });
  writeBytes(new URL('../salida/miniatura.png', import.meta.url).pathname, png);
});
