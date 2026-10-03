import { expect, test } from '@playwright/test';
import { expectScreen, openGame, tap } from './helpers';

test.describe('menú', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
    await tap(page, 'Space');
  });

  test('se navega con el teclado y se cambia el nivel inicial', async ({ page }) => {
    const items = page.getByRole('menuitem');
    await expect(items.nth(0)).toHaveAttribute('aria-current', 'true');
    await tap(page, 'ArrowDown');
    await expect(items.nth(1)).toHaveAttribute('aria-current', 'true');
    await tap(page, 'ArrowRight');
    await tap(page, 'ArrowRight');
    await tap(page, 'ArrowRight');
    await expect(items.nth(1)).toHaveText(/NIVEL INICIAL\s*3/);
    await tap(page, 'ArrowLeft');
    await expect(items.nth(1)).toHaveText(/NIVEL INICIAL\s*2/);
    await tap(page, 'ArrowUp');
    await tap(page, 'ArrowUp');
    await expect(items.nth(5)).toHaveAttribute('aria-current', 'true');
  });

  test('CONTROLES muestra la tabla de teclas y Esc vuelve', async ({ page }) => {
    for (let i = 0; i < 4; i++) {
      await tap(page, 'ArrowDown');
    }
    await tap(page, 'Enter');
    await expect(page.getByRole('heading', { name: 'CONTROLES' })).toBeVisible();
    await expect(page.getByRole('row')).toHaveCount(9);
    await expect(page.getByText('ROTAR EN SENTIDO ANTIHORARIO')).toBeVisible();
    await expect(page.getByRole('row', { name: 'BOTÓN PILOTO EL JUEGO JUEGA SOLO' })).toBeVisible();
    await tap(page, 'Escape');
    await expectScreen(page, 'menu');
  });

  test('RÉCORDS muestra los 10 puestos del ranking a 0 la primera vez', async ({ page }) => {
    await tap(page, 'ArrowUp');
    await tap(page, 'Enter');
    const rows = page.getByRole('table').getByRole('row');
    await expect(rows).toHaveCount(11);
    const empty = ['---', '0', '0', '0', '--/--/----'];
    await expect(rows.nth(1).getByRole('cell')).toHaveText(['1', ...empty]);
    await expect(rows.nth(10).getByRole('cell')).toHaveText(['10', ...empty]);
    await tap(page, 'Escape');
    await expectScreen(page, 'menu');
  });
});
