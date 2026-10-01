import { expect, test } from '@playwright/test';
import { collectErrors, tap } from './helpers';

/** El build autocontenido, abierto con doble clic (sin servidor). */
const FILE_URL = new URL('../../dist/index.html', import.meta.url).href;

test('el index.html autocontenido funciona abierto desde file://', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(FILE_URL);
  await expect(page.getByText('PULSA CUALQUIER TECLA')).toBeVisible();
  await tap(page, 'Space');
  await tap(page, 'ArrowDown');
  await tap(page, 'ArrowRight');
  await expect(page.getByRole('menuitem').nth(1)).toHaveText(/NIVEL INICIAL\s*1/);
  await tap(page, 'ArrowUp');
  await tap(page, 'Enter');
  await expect(page.getByTestId('hud-level')).toHaveText('1');

  await page.reload();
  await tap(page, 'Space');
  await expect(page.getByRole('menuitem').nth(1)).toHaveText(/NIVEL INICIAL\s*1/);
  expect(errors).toEqual([]);
});
