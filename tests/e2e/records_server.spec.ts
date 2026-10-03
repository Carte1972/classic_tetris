import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import type { RecordEntry } from '../../src/storage/records_store';
import {
  collectErrors,
  enterRecordName,
  expectScreen,
  forceGameOver,
  startGame,
  tap,
} from './helpers';
import { RECORDS_SERVER_URL } from './servers';

// Todos comparten el records.json del servidor: en serie y solo en un navegador.
test.describe.configure({ mode: 'serial' });
test.skip(({ browserName }) => browserName !== 'chromium', 'El archivo de récords es compartido');

/** Ranking guardado en el disco, leído a través del servidor. */
async function recordsOnDisk(request: APIRequestContext): Promise<RecordEntry[]> {
  const response = await request.get(`${RECORDS_SERVER_URL}/api/records`);
  expect(response.ok()).toBe(true);
  return (await response.json()) as RecordEntry[];
}

/** Abre el juego servido por el servidor de récords, sin nada guardado en el navegador. */
async function openServedGame(page: Page): Promise<void> {
  await page.goto(`${RECORDS_SERVER_URL}/?seed=123&test=1`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText('PULSA CUALQUIER TECLA')).toBeVisible();
}

/** Desde la pantalla inicial, abre RÉCORDS. */
async function openRecordsFromStart(page: Page): Promise<void> {
  await tap(page, 'Space');
  await expectScreen(page, 'menu');
  await tap(page, 'ArrowUp');
  await tap(page, 'Enter');
  await expectScreen(page, 'records');
}

test.describe('ranking en el disco (servidor de los lanzadores)', () => {
  let errors: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    errors = collectErrors(page);
    // Empieza cada test con el ranking vacío, como la primera vez en un ordenador.
    const reset = await request.put(`${RECORDS_SERVER_URL}/api/records`, {
      headers: { 'Content-Type': 'application/json' },
      data: '[]',
    });
    expect(reset.status()).toBe(204);
  });

  test.afterEach(() => {
    expect(errors).toEqual([]);
  });

  test('la primera vez, los 10 puestos están a 0', async ({ page }) => {
    await openServedGame(page);
    await openRecordsFromStart(page);
    const scores = page.getByRole('table').getByRole('row').locator('td:nth-child(3)');
    await expect(scores).toHaveText(Array.from({ length: 10 }, () => '0'));
  });

  test('el récord se guarda en records.json y sigue ahí al volver a abrir el juego en otro navegador', async ({
    page,
    request,
    browser,
  }) => {
    await openServedGame(page);
    await startGame(page);
    await forceGameOver(page, 4321);
    await enterRecordName(page, 'Пётр');
    await expect
      .poll(() => recordsOnDisk(request))
      .toMatchObject([{ name: 'ПЁТР', score: 4321, lines: 7, level: 0 }]);
    // Nada en el navegador: el ranking vive en el disco.
    expect(await page.evaluate(() => localStorage.getItem('tetris.records'))).toBeNull();

    // Otro contexto es como otro navegador: no comparte localStorage.
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await openServedGame(otherPage);
    await openRecordsFromStart(otherPage);
    const firstRow = otherPage.getByRole('table').getByRole('row').nth(1);
    await expect(firstRow.getByRole('cell').nth(1)).toHaveText('ПЁТР');
    await expect(firstRow.getByRole('cell').nth(2)).toHaveText('4321');
    await other.close();
  });

  test('las partidas nuevas actualizan el archivo', async ({ page, request }) => {
    await openServedGame(page);
    await startGame(page);
    await forceGameOver(page, 300);
    await enterRecordName(page, 'Ana');
    await tap(page, 'Enter');
    await expectScreen(page, 'playing');
    await forceGameOver(page, 800);
    await enterRecordName(page, 'Luis');
    await expect
      .poll(async () => (await recordsOnDisk(request)).map((record) => record.name))
      .toEqual(['LUIS', 'ANA']);
  });
});
