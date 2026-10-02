import { expect, test } from '@playwright/test';
import { expectScreen, openGame, snapshot, startGame, tap } from './helpers';

test.describe('partida', () => {
  test.beforeEach(async ({ page }) => {
    await openGame(page);
  });

  test('INICIAR JUEGO arranca la partida y el HUD muestra puntuación, líneas, nivel y siguiente pieza', async ({
    page,
  }) => {
    await startGame(page);
    await expect(page.getByTestId('hud-score')).toHaveText('0');
    await expect(page.getByTestId('hud-lines')).toHaveText('0');
    await expect(page.getByTestId('hud-level')).toHaveText('0');
    await expect(page.getByTestId('hud-best')).toHaveText('0');
    await expect(page.getByTestId('hud-goal')).toHaveText('0 / 10');
    await expect(page.getByRole('img', { name: 'SIGUIENTE' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Tablero' })).toBeVisible();
    expect((await snapshot(page)).hud?.nextPiece).toMatch(/^[IOTSZJL]$/);
  });

  test('el teclado mueve, rota y baja la pieza', async ({ page }) => {
    await startGame(page);
    const before = await page.evaluate(() => window.__bloques?.getGameState()?.activePiece);
    await tap(page, 'ArrowLeft');
    await tap(page, 'ArrowUp');
    const after = await page.evaluate(() => window.__bloques?.getGameState()?.activePiece);
    expect(after?.x).toBe((before?.x ?? 0) - 1);
    expect(after?.rotation).not.toBe(before?.rotation);
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowDown');
    await expect.poll(async () => (await snapshot(page)).hud?.score ?? 0).toBeGreaterThan(0);
  });

  test('la semilla fija hace la partida reproducible', async ({ page }) => {
    await startGame(page);
    const first = await page.evaluate(() => window.__bloques?.getGameState()?.activePiece?.type);
    const next = (await snapshot(page)).hud?.nextPiece;
    await openGame(page);
    await startGame(page);
    expect(await page.evaluate(() => window.__bloques?.getGameState()?.activePiece?.type)).toBe(
      first,
    );
    expect((await snapshot(page)).hud?.nextPiece).toBe(next);
  });

  test('P pausa y reanuda; Esc vuelve al menú', async ({ page }) => {
    await startGame(page);
    await tap(page, 'KeyP');
    await expect(page.getByRole('dialog', { name: 'PAUSA' })).toBeVisible();
    const paused = await page.evaluate(() => window.__bloques?.getGameState());
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => window.__bloques?.getGameState())).toEqual(paused);
    await tap(page, 'KeyP');
    await expect(page.getByRole('dialog', { name: 'PAUSA' })).toHaveCount(0);
    await expectScreen(page, 'playing');
    await tap(page, 'Escape');
    await expectScreen(page, 'menu');
    await expect(page.getByRole('menu')).toBeVisible();
  });
});
