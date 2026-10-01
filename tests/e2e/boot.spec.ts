import { expect, test } from '@playwright/test';
import { collectErrors, openGame, tap } from './helpers';

test.describe('arranque', () => {
  test('la app carga sin errores en consola', async ({ page }) => {
    const errors = collectErrors(page);
    await openGame(page, '');
    await tap(page, 'Space');
    await expect(page.getByRole('menu')).toBeVisible();
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test('aparece PULSA CUALQUIER TECLA y, tras pulsar, el menú con todas sus opciones', async ({
    page,
  }) => {
    await openGame(page);
    await expect(page.getByRole('img', { name: 'BLOQUES' })).toBeVisible();
    await expect(page.getByRole('menu')).toHaveCount(0);
    await tap(page, 'KeyQ');
    await expect(page.getByText('PULSA CUALQUIER TECLA')).toHaveCount(0);
    const items = page.getByRole('menuitem');
    await expect(items).toHaveText([
      /INICIAR JUEGO/,
      /NIVEL INICIAL\s*0/,
      /MÚSICA\s*ACTIVADA/,
      /CELEBRACIONES\s*ACTIVADAS/,
      /CONTROLES/,
      /RÉCORDS/,
    ]);
    await expect(page.getByText('SALIR')).toHaveCount(0);
  });
});
