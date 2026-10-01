import { expect, test } from '@playwright/test';
import { expectScreen, forceLevelUp, openGame, snapshot, startGame, tap } from './helpers';

test.describe('celebración al subir de nivel', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
  });

  test('aparece al subir de nivel, congela la partida y termina sola', async ({ page }) => {
    await startGame(page);
    await forceLevelUp(page, 1);
    const overlay = page.getByRole('dialog', { name: '¡NIVEL 1!' });
    await expect(overlay).toBeVisible();
    await expect(overlay.getByRole('img', { name: 'Baile de celebración' })).toBeVisible();
    const frozen = await page.evaluate(() => window.__bloques?.getGameState());
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.__bloques?.getGameState())).toEqual(frozen);
    await expect(overlay).toHaveCount(0, { timeout: 6000 });
    await expectScreen(page, 'playing');
    await expect(page.getByTestId('hud-level')).toHaveText('1');
  });

  for (const key of ['Enter', 'Space']) {
    test(`se puede saltar con ${key}`, async ({ page }) => {
      await startGame(page);
      await forceLevelUp(page, 2);
      await expectScreen(page, 'celebrating');
      await tap(page, key);
      await expectScreen(page, 'playing');
      expect((await snapshot(page)).celebrationLevel).toBeNull();
    });
  }

  test('desactivada desde el menú, no aparece', async ({ page }) => {
    await tap(page, 'Space');
    await tap(page, 'ArrowDown');
    await tap(page, 'ArrowDown');
    await tap(page, 'ArrowDown');
    await tap(page, 'Enter');
    await expect(page.getByRole('menuitem').nth(3)).toHaveText(/DESACTIVADAS/);
    for (let i = 0; i < 3; i++) {
      await tap(page, 'ArrowUp');
    }
    await tap(page, 'Enter');
    await expectScreen(page, 'playing');
    await forceLevelUp(page, 1);
    await expect(page.getByTestId('hud-level')).toHaveText('1');
    await page.waitForTimeout(300);
    expect((await snapshot(page)).screen).toBe('playing');
  });
});
