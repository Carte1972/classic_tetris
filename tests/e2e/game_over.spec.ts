import { expect, test } from '@playwright/test';
import { enterRecordName, expectScreen, forceGameOver, openGame, startGame, tap } from './helpers';

test('una partida forzada hasta game over muestra la pantalla final y guarda el récord', async ({
  page,
}) => {
  await openGame(page);
  await startGame(page);
  await forceGameOver(page, 4321);
  await enterRecordName(page, 'Ana');
  const dialog = page.getByRole('dialog', { name: 'FIN DE LA PARTIDA' });
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('result-score')).toHaveText('4321');
  await expect(dialog.getByText('¡NUEVO RÉCORD!')).toBeAttached();
  const stored = await page.evaluate(() => localStorage.getItem('tetris.records'));
  expect(JSON.parse(stored ?? '[]')).toMatchObject([{ name: 'ANA', score: 4321, lines: 7 }]);

  await tap(page, 'Escape');
  await tap(page, 'ArrowUp');
  await tap(page, 'Enter');
  await expect(page.getByRole('table')).toContainText('4321');

  await tap(page, 'Escape');
  await tap(page, 'ArrowDown');
  await tap(page, 'Enter');
  await expectScreen(page, 'playing');
  await expect(page.getByTestId('hud-best')).toHaveText('4321');
  // 0 puntos no entran en el ranking: no pide nombre y ENTER reinicia en el acto.
  await forceGameOver(page, 0);
  await tap(page, 'Enter');
  await expectScreen(page, 'playing');
  await expect(page.getByTestId('hud-score')).toHaveText('0');
});
