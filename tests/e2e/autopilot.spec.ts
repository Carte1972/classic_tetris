import { expect, test, type Locator, type Page } from '@playwright/test';
import type { Board } from '../../src/engine/types';
import {
  collectErrors,
  expectScreen,
  forceGameOver,
  forceLevelUp,
  openGame,
  patchGame,
  startGame,
  tap,
} from './helpers';

/** Filas casi completas (falta un hueco de 2 × 2) para que el piloto haga líneas enseguida. */
const NEARLY_FULL_ROWS = ['OOOO..OOOO', 'OOOO..OOOO'];

/** Tiempo máximo para que el piloto haga una línea o fije una pieza (ms). */
const PLAY_TIMEOUT_MS = 20_000;

/** Botón del piloto automático. */
function autopilotButton(page: Page): Locator {
  return page.getByRole('button', { name: /PILOTO AUTOMÁTICO/ });
}

/** Líneas que muestra el marcador. */
async function hudLines(page: Page): Promise<number> {
  return Number(await page.getByTestId('hud-lines').textContent());
}

/** Tablero del motor en cuanto la primera pieza se ha fijado. */
async function firstLockedBoard(page: Page): Promise<Board> {
  let board: Board | undefined;
  await expect
    .poll(
      async () => {
        const state = await page.evaluate(() => window.__tetris?.getGameState());
        board = state?.board;
        return board?.some((row) => row.some((cell) => cell !== null)) ?? false;
      },
      { timeout: PLAY_TIMEOUT_MS },
    )
    .toBe(true);
  if (board === undefined) {
    throw new Error('No hay partida');
  }
  return board;
}

test.describe('piloto automático', () => {
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors = collectErrors(page);
    await openGame(page);
  });

  test.afterEach(() => {
    expect(errors).toEqual([]);
  });

  test('el botón se ve en la partida, la pausa, la celebración y el game over, y no en el menú', async ({
    page,
  }) => {
    await tap(page, 'Space');
    await expectScreen(page, 'menu');
    await expect(autopilotButton(page)).toHaveCount(0);
    await tap(page, 'Enter');
    await expectScreen(page, 'playing');
    await expect(autopilotButton(page)).toBeVisible();
    await expect(autopilotButton(page)).toHaveText('PILOTO AUTOMÁTICO: NO');

    await tap(page, 'KeyP');
    await expectScreen(page, 'paused');
    await expect(autopilotButton(page)).toBeVisible();
    await tap(page, 'KeyP');

    await forceLevelUp(page, 1);
    await expectScreen(page, 'celebrating');
    // Visible y pulsable por encima de la celebración: Playwright comprueba que el clic
    // llega al botón y no a la capa que lo cubre.
    await autopilotButton(page).click();
    await expect(autopilotButton(page)).toHaveAttribute('aria-pressed', 'true');
    await autopilotButton(page).click();
    await expect(autopilotButton(page)).toHaveAttribute('aria-pressed', 'false');
    await tap(page, 'Enter');

    await forceGameOver(page, 10);
    await expect(autopilotButton(page)).toBeVisible();
  });

  test('al pulsarlo se activa y las líneas suben sin tocar ninguna tecla', async ({ page }) => {
    await startGame(page);
    await autopilotButton(page).click();
    await expect(autopilotButton(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(autopilotButton(page)).toHaveText('PILOTO AUTOMÁTICO: SÍ');
    await patchGame(page, { boardRows: NEARLY_FULL_ROWS });
    await expect.poll(() => hudLines(page), { timeout: PLAY_TIMEOUT_MS }).toBeGreaterThan(0);
  });

  test('con el piloto activo, las flechas y Z no cambian la jugada', async ({ page }) => {
    await startGame(page);
    await autopilotButton(page).click();
    const untouched = await firstLockedBoard(page);

    await openGame(page);
    await startGame(page);
    await autopilotButton(page).click();
    await page.keyboard.down('ArrowDown');
    for (const key of ['ArrowLeft', 'KeyZ', 'ArrowRight', 'ArrowUp', 'KeyZ', 'ArrowLeft']) {
      await tap(page, key);
    }
    await page.keyboard.up('ArrowDown');
    expect(await firstLockedBoard(page)).toEqual(untouched);
  });

  test('sigue jugando tras el cambio de nivel', async ({ page }) => {
    await startGame(page);
    await autopilotButton(page).click();
    // Falta una línea para el objetivo: el piloto mete la I vertical en el hueco.
    await forceLevelUp(page, 1);
    await expectScreen(page, 'celebrating');
    await expect(page.getByRole('dialog', { name: '¡NIVEL 1!' })).toBeVisible();
    await expect(autopilotButton(page)).toHaveAttribute('aria-pressed', 'true');
    await tap(page, 'Enter');
    await expectScreen(page, 'playing');
    await expect(page.getByTestId('hud-level')).toHaveText('1');
    const linesAtStart = await hudLines(page);
    await patchGame(page, { boardRows: NEARLY_FULL_ROWS });
    await expect
      .poll(() => hudLines(page), { timeout: PLAY_TIMEOUT_MS })
      .toBeGreaterThan(linesAtStart);
    await expect(autopilotButton(page)).toHaveAttribute('aria-pressed', 'true');
  });

  test('al pulsarlo otra vez se desactiva y la pieza vuelve a responder al teclado', async ({
    page,
  }) => {
    await startGame(page);
    await autopilotButton(page).click();
    await autopilotButton(page).click();
    await expect(autopilotButton(page)).toHaveAttribute('aria-pressed', 'false');
    await patchGame(page, { activePiece: { type: 'T', rotation: 0, x: 5, y: 5 } });
    await tap(page, 'ArrowLeft');
    await expect
      .poll(() => page.evaluate(() => window.__tetris?.getGameState()?.activePiece?.x))
      .toBe(4);
  });

  test('el botón no se queda con el foco: ENTER y ESPACIO no lo cambian', async ({ page }) => {
    await startGame(page);
    await autopilotButton(page).click();
    const focusedIsButton = () =>
      page.evaluate(() => document.activeElement?.classList.contains('autopilot-button'));
    expect(await focusedIsButton()).toBe(false);
    await tap(page, 'Enter');
    await tap(page, 'Space');
    await expect(autopilotButton(page)).toHaveAttribute('aria-pressed', 'true');

    await autopilotButton(page).click();
    expect(await focusedIsButton()).toBe(false);
    await tap(page, 'Enter');
    await tap(page, 'Space');
    await expect(autopilotButton(page)).toHaveAttribute('aria-pressed', 'false');
  });

  test('una partida con el piloto avisa en el game over y no entra en récords', async ({
    page,
  }) => {
    await startGame(page);
    await autopilotButton(page).click();
    await forceGameOver(page, 4321);
    const dialog = page.getByRole('dialog', { name: 'FIN DE LA PARTIDA' });
    await expect(
      dialog.getByText('PARTIDA CON PILOTO AUTOMÁTICO: NO CUENTA PARA RÉCORDS'),
    ).toBeVisible();
    await expect(dialog.getByText('¡NUEVO RÉCORD!')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('tetris.records'))).toBeNull();

    // ENTER empieza otra partida que también juega el piloto.
    await tap(page, 'Enter');
    await expectScreen(page, 'playing');
    await expect(autopilotButton(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('hud-best')).toHaveText('0');
  });
});
