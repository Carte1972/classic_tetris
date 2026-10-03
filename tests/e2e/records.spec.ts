import { expect, test, type Page } from '@playwright/test';
import {
  collectErrors,
  enterRecordName,
  expectScreen,
  forceGameOver,
  openGame,
  snapshot,
  startGame,
  tap,
} from './helpers';

/** Abre la pantalla de RÉCORDS desde el game over. */
async function openRecords(page: Page): Promise<void> {
  await tap(page, 'Escape');
  await expectScreen(page, 'menu');
  await tap(page, 'ArrowUp');
  await tap(page, 'Enter');
  await expectScreen(page, 'records');
}

test.describe('ranking (guardado en el navegador)', () => {
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors = collectErrors(page);
    await openGame(page);
    await startGame(page);
  });

  test.afterEach(() => {
    expect(errors).toEqual([]);
  });

  test('al entrar en el ranking pide el nombre; las teclas del juego escriben en el campo', async ({
    page,
  }) => {
    await forceGameOver(page, 4321);
    const dialog = page.getByRole('dialog', { name: '¡ENTRAS EN EL RANKING!' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('PUESTO 1');
    await expect(dialog).toContainText('4321 PUNTOS');
    // M (silenciar), P (pausa) y Z (rotar) son letras del nombre, no órdenes del juego.
    await expect(page.getByLabel('TU NOMBRE')).toBeFocused();
    await page.keyboard.type('mzp ana');
    expect((await snapshot(page)).preferences.muted).toBe(false);
    await expectScreen(page, 'nameEntry');
    await tap(page, 'Enter');
    await expectScreen(page, 'gameOver');
    await expect(page.getByText('¡NUEVO RÉCORD!')).toBeVisible();
    const stored = await page.evaluate(() => localStorage.getItem('tetris.records'));
    expect(JSON.parse(stored ?? '[]')).toMatchObject([
      { name: 'MZP ANA', score: 4321, lines: 7, level: 0 },
    ]);

    await openRecords(page);
    const rows = page.getByRole('table').getByRole('row');
    await expect(rows.nth(1).getByRole('cell')).toHaveText([
      '1',
      'MZP ANA',
      '4321',
      '7',
      '0',
      /\d{2}\/\d{2}\/\d{4}/,
    ]);
    await expect(rows.nth(2).getByRole('cell').nth(2)).toHaveText('0');
  });

  test('una partida de 0 puntos no entra ni pide nombre', async ({ page }) => {
    await forceGameOver(page, 0);
    await expectScreen(page, 'gameOver');
    await expect(page.getByRole('dialog', { name: 'FIN DE LA PARTIDA' })).toBeVisible();
    await expect(page.getByLabel('TU NOMBRE')).toHaveCount(0);
  });

  test('el ranking se ordena y se conserva al recargar', async ({ page }) => {
    await forceGameOver(page, 500);
    await enterRecordName(page, 'Luis');
    await tap(page, 'Enter');
    await expectScreen(page, 'playing');
    await forceGameOver(page, 900);
    await expect(page.getByRole('dialog', { name: '¡ENTRAS EN EL RANKING!' })).toContainText(
      'PUESTO 1',
    );
    await enterRecordName(page, 'Пётр');
    await page.reload();
    await tap(page, 'Space');
    await tap(page, 'ArrowUp');
    await tap(page, 'Enter');
    const names = page.getByRole('table').getByRole('row').locator('td:nth-child(2)');
    await expect(names.nth(0)).toHaveText('ПЁТР');
    await expect(names.nth(1)).toHaveText('LUIS');
    await expect(names.nth(2)).toHaveText('---');
  });
});
