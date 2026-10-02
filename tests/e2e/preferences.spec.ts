import { expect, test } from '@playwright/test';
import { openGame, tap } from './helpers';

test('las preferencias persisten tras recargar la página', async ({ page }) => {
  await openGame(page);
  await tap(page, 'Space');
  await tap(page, 'ArrowDown');
  await tap(page, 'ArrowRight');
  await tap(page, 'ArrowRight');
  await tap(page, 'ArrowRight');
  await tap(page, 'ArrowRight');
  await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  await tap(page, 'KeyM');
  const items = page.getByRole('menuitem');
  await expect(items.nth(1)).toHaveText(/NIVEL INICIAL\s*4/);
  await expect(items.nth(2)).toHaveText(/MÚSICA\s*DESACTIVADA/);
  await expect(items.nth(3)).toHaveText(/CELEBRACIONES\s*DESACTIVADAS/);

  // Recargar solo cuando el guardado haya llegado a localStorage (en WebKit es asíncrono).
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('bloques.preferences')))
    .toMatch(/"startLevel":4.*"muted":true/);
  await page.reload();
  await expect(page.getByText('PULSA CUALQUIER TECLA')).toBeVisible();
  await tap(page, 'Space');
  await expect(items.nth(1)).toHaveText(/NIVEL INICIAL\s*4/);
  await expect(items.nth(2)).toHaveText(/MÚSICA\s*DESACTIVADA/);
  await expect(items.nth(3)).toHaveText(/CELEBRACIONES\s*DESACTIVADAS/);
  expect(await page.evaluate(() => window.__bloques?.getSnapshot().preferences.muted)).toBe(true);
  await tap(page, 'Enter');
  await expect(page.getByTestId('hud-level')).toHaveText('4');
  await expect(page.getByText('SONIDO SILENCIADO (M)')).toBeVisible();
});
