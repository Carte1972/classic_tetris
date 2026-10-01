import { expect, test, type Page } from '@playwright/test';
import type {} from '../../src/app/test_api';
import type { ScreenName } from '../../src/app/app_controller';
import type { TestGamePatch } from '../../src/app/test_mode';
import type { GameState } from '../../src/engine/types';
import { choosePlacement } from './demo_player';
import { captureFrame, encodeGif, type GifFrame } from './gif';
import { writeBytes } from './write_file.mjs';

/** Carpeta de las capturas del README. */
const OUTPUT_DIR = new URL('../../docs/screenshots/', import.meta.url);

/** Un frame de la lógica del juego (60 fps). */
const FRAME_MS = 1000 / 60;

/** Instante fijo del reloj simulado (también fecha los récords). */
const FIXED_TIME = new Date('2026-10-01T12:00:00');

/** Momento de la celebración con el cosaco en plena patada de la prisiadka. */
const PRISIADKA_KICK_MS = 1330;

/** Tablero de media partida: una pila irregular con huecos para que se vea "jugada". */
const MID_GAME_BOARD = [
  '..........',
  '.......L..',
  '......LLL.',
  'J....SSOO.',
  'JJJ.SSTOOI',
  'ZZ.TTTTTII',
  '.ZZLLSSTII',
  'OOLLSSJJJI',
  'OOTTTZZJLL',
];

/** Tablero con 3 filas a falta de la última columna (punto de partida del GIF). */
const CLEAR_BOARD = ['.....T....', 'TTT.TTT...', 'LLLLOOJJJ.', 'SSZZOOJTT.', 'ISSZZJJTT.'];

/** Tablero con 4 filas a falta de la última columna, para limpiar 4 líneas con una I. */
const TETRIS_BOARD = [
  '....T.....',
  '..TTT..O..',
  'LLLLOOJJJ.',
  'SSZZOOJTT.',
  'ISSZZJJTT.',
  'TTTOOZZLL.',
];

/** Frames que quedan de la animación de 4 líneas en el capturado: fondo destellando y las columnas centrales ya borradas. */
const TETRIS_FLASH_FRAMES_REMAINING = 14;

/** Resolución y ritmo del GIF de demostración. */
const GIF = { width: 640, height: 360, frameEvery: 6, seconds: 8, maxBytes: 5 * 1024 * 1024 };

/** Avanza el reloj simulado el número de frames de juego indicado. */
async function runFrames(page: Page, frames: number): Promise<void> {
  await page.clock.runFor(Math.round(frames * FRAME_MS));
}

/** Pulsa una tecla y deja pasar un par de frames. */
async function tap(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
  await runFrames(page, 2);
}

/** Pantalla actual. */
async function screen(page: Page): Promise<ScreenName | undefined> {
  return page.evaluate(() => window.__bloques?.getSnapshot().screen);
}

/** Estado del motor. */
async function gameState(page: Page): Promise<GameState | null | undefined> {
  return page.evaluate(() => window.__bloques?.getGameState());
}

/** Modifica la partida. */
async function patchGame(page: Page, patch: TestGamePatch): Promise<void> {
  await page.evaluate((changes) => window.__bloques?.patchGame(changes), patch);
}

/** Margen tras instalar el reloj simulado antes de pausarlo (ms). */
const CLOCK_PAUSE_OFFSET_MS = 1000;

/**
 * Abre el juego con el reloj simulado en pausa (solo avanza con `runFrames`, así las
 * capturas salen idénticas en cada ejecución), la semilla fija y sin datos guardados.
 */
async function openGame(page: Page): Promise<void> {
  await page.clock.install({ time: FIXED_TIME });
  await page.clock.pauseAt(new Date(FIXED_TIME.getTime() + CLOCK_PAUSE_OFFSET_MS));
  await page.goto('/?seed=123&test=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await runFrames(page, 6);
}

/** Empieza una partida desde la pantalla inicial. */
async function startGame(page: Page, startLevel = 0): Promise<void> {
  await tap(page, 'Space');
  await tap(page, 'ArrowDown');
  for (let level = 0; level < startLevel; level++) {
    await tap(page, 'ArrowRight');
  }
  await tap(page, 'ArrowUp');
  await tap(page, 'Enter');
  expect(await screen(page)).toBe('playing');
}

/** Guarda una captura de toda la pantalla. */
async function save(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: new URL(name, OUTPUT_DIR).pathname, animations: 'disabled' });
}

/** Avanza frame a frame hasta que se cumpla una condición sobre el estado del motor. */
async function runUntil(
  page: Page,
  condition: (state: GameState) => boolean,
  maxFrames = 600,
): Promise<void> {
  for (let frame = 0; frame < maxFrames; frame++) {
    const state = await gameState(page);
    if (state && condition(state)) {
      return;
    }
    await runFrames(page, 1);
  }
  throw new Error('La condición no se cumplió a tiempo');
}

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await openGame(page);
});

test('pantalla_inicio.png: título y menú', async ({ page }) => {
  await tap(page, 'Space');
  expect(await screen(page)).toBe('menu');
  await save(page, 'pantalla_inicio.png');
});

test('controles.png: pantalla de controles', async ({ page }) => {
  await tap(page, 'Space');
  await tap(page, 'ArrowUp');
  await tap(page, 'ArrowUp');
  await tap(page, 'Enter');
  expect(await screen(page)).toBe('controls');
  await save(page, 'controles.png');
});

test('partida_en_curso.png y pausa.png: tablero a media partida', async ({ page }) => {
  await startGame(page, 3);
  await patchGame(page, {
    boardRows: MID_GAME_BOARD,
    activePiece: { type: 'T', rotation: 1, x: 4, y: 9 },
    nextPiece: 'S',
    score: 18_460,
    lines: 37,
  });
  await runFrames(page, 2);
  await save(page, 'partida_en_curso.png');
  await tap(page, 'KeyP');
  expect(await screen(page)).toBe('paused');
  await save(page, 'pausa.png');
});

test('limpieza_lineas.png: momento de limpiar varias líneas', async ({ page }) => {
  await startGame(page, 5);
  await patchGame(page, {
    boardRows: TETRIS_BOARD,
    activePiece: { type: 'I', rotation: 1, x: 9, y: 14 },
    nextPiece: 'L',
    score: 9_120,
    lines: 51,
  });
  await runUntil(
    page,
    (state) =>
      state.phase === 'lineClear' && state.phaseFramesRemaining === TETRIS_FLASH_FRAMES_REMAINING,
  );
  await save(page, 'limpieza_lineas.png');
});

test('game_over.png: pantalla final con la puntuación', async ({ page }) => {
  await startGame(page, 4);
  await patchGame(page, {
    boardRows: Array.from({ length: 20 }, (_, i) => (i % 3 === 0 ? 'OOOO.OOOOO' : 'OOOOOOOOO.')),
    activePiece: { type: 'O', rotation: 0, x: 1, y: 0 },
    score: 27_380,
    lines: 58,
    level: 9,
  });
  await runUntil(page, (state) => state.phase === 'gameOver');
  await runFrames(page, 2);
  expect(await screen(page)).toBe('gameOver');
  await save(page, 'game_over.png');
});

test('celebracion_nivel.png: un personaje en plena prisiadka', async ({ page }) => {
  await startGame(page);
  await patchGame(page, {
    boardRows: ['OOOOOOOOO.'],
    lines: 9,
    activePiece: { type: 'I', rotation: 1, x: 9, y: 19 },
  });
  for (let frame = 0; frame < 600 && (await screen(page)) !== 'celebrating'; frame++) {
    await runFrames(page, 1);
  }
  await page.evaluate((ms) => window.__bloques?.freezeCelebration(ms), PRISIADKA_KICK_MS);
  await runFrames(page, 2);
  await save(page, 'celebracion_nivel.png');
});

test('partida_demo.gif: unos segundos de juego', async ({ page }) => {
  test.setTimeout(180_000);
  await startGame(page, 6);
  await patchGame(page, { boardRows: CLEAR_BOARD.slice(1), score: 4_200, lines: 66 });
  const frames: GifFrame[] = [];
  const totalFrames = GIF.seconds * 60;
  let elapsed = 0;
  /** Avanza un frame de juego y guarda un fotograma del GIF cuando toca. */
  const step = async (): Promise<void> => {
    await runFrames(page, 1);
    elapsed++;
    if (elapsed % GIF.frameEvery === 0) {
      frames.push(await captureFrame(page, GIF.width, GIF.height));
    }
  };

  while (elapsed < totalFrames) {
    const state = await gameState(page);
    if (!state || state.phase !== 'falling' || state.activePiece === null) {
      await step();
      continue;
    }
    const piece = state.activePiece;
    const target = choosePlacement(state.board, piece.type);
    const rotations: string[] =
      target.rotation === 3 ? ['KeyZ'] : Array.from({ length: target.rotation }, () => 'ArrowUp');
    const shift = target.x - piece.x;
    const moves: string[] = Array.from({ length: Math.abs(shift) }, () =>
      shift < 0 ? 'ArrowLeft' : 'ArrowRight',
    );
    for (const key of [...rotations, ...moves]) {
      await page.keyboard.down(key);
      await step();
      await page.keyboard.up(key);
      await step();
    }
    await page.keyboard.down('ArrowDown');
    while (elapsed < totalFrames && (await gameState(page))?.phase === 'falling') {
      await step();
    }
    await page.keyboard.up('ArrowDown');
  }

  expect((await gameState(page))?.lines ?? 0).toBeGreaterThan(66);
  const size = writeBytes(
    new URL('partida_demo.gif', OUTPUT_DIR).pathname,
    encodeGif(frames, GIF.frameEvery * FRAME_MS),
  );
  expect(size).toBeLessThan(GIF.maxBytes);
});
