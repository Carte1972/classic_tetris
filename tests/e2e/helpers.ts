import { expect, type Page } from '@playwright/test';
import type {} from '../../src/app/test_api';
import type { AppSnapshot, ScreenName } from '../../src/app/app_controller';
import type { TestGamePatch } from '../../src/app/test_mode';

/** Pausa entre pulsaciones: más de un frame, como haría una persona. */
const KEY_GAP_MS = 60;

/** Tablero visible lleno salvo la última columna: la siguiente pieza ya no cabe. */
const FULL_BOARD = Array.from({ length: 20 }, () => 'OOOOOOOOO.');

/** Pulsa una tecla y espera un poco antes de la siguiente. */
export async function tap(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
  await page.waitForTimeout(KEY_GAP_MS);
}

/** Registra los errores de consola y de página para comprobar que no hay ninguno. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

/** Abre el juego en modo test con semilla fija y almacenamiento limpio. */
export async function openGame(page: Page, query = '?seed=123&test=1'): Promise<void> {
  await page.goto(`/${query}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText('PULSA CUALQUIER TECLA')).toBeVisible();
}

/** Estado de la interfaz expuesto por el modo test. */
export async function snapshot(page: Page): Promise<AppSnapshot> {
  return page.evaluate(() => {
    const api = window.__bloques;
    if (api === undefined) {
      throw new Error('El modo test no está activo');
    }
    return api.getSnapshot();
  });
}

/** Espera a que la aplicación esté en una pantalla. */
export async function expectScreen(page: Page, screen: ScreenName): Promise<void> {
  await expect.poll(async () => (await snapshot(page)).screen).toBe(screen);
}

/** Modifica la partida en curso con el modo test. */
export async function patchGame(page: Page, patch: TestGamePatch): Promise<void> {
  await page.evaluate((changes) => window.__bloques?.patchGame(changes), patch);
}

/** Desde la pantalla inicial, entra al menú y empieza una partida. */
export async function startGame(page: Page): Promise<void> {
  await tap(page, 'Space');
  await expectScreen(page, 'menu');
  await tap(page, 'Enter');
  await expectScreen(page, 'playing');
}

/** Lleva la partida a game over llenando el tablero. */
export async function forceGameOver(page: Page, score: number): Promise<void> {
  await patchGame(page, {
    boardRows: FULL_BOARD,
    activePiece: { type: 'O', rotation: 0, x: 1, y: 0 },
    score,
    lines: 7,
  });
  await expectScreen(page, 'gameOver');
}

/** Completa la última línea del objetivo para pasar al nivel `level`. */
export async function forceLevelUp(page: Page, level: number): Promise<void> {
  await patchGame(page, {
    boardRows: ['OOOOOOOOO.'],
    levelGoal: 10,
    levelLines: 9,
    level: level - 1,
    activePiece: { type: 'I', rotation: 1, x: 9, y: 19 },
  });
}
