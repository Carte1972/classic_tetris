import type { Page } from '@playwright/test';
import type {} from '../../src/app/test_api';
import type { TestGamePatch } from '../../src/app/test_mode';
import type { SceneConditions } from '../../src/scene/red_square_scene';
import type { GameState } from '../../src/engine/types';
import { choosePlacement } from '../../tests/screenshots/demo_player';
import { writeBytes } from '../../tests/screenshots/write_file.mjs';
import { VIDEO_PREVIEW_PORT } from '../../playwright.video.config';
import { encodeFrames, resetDir } from './codificar.mjs';

/** Fotogramas por segundo del vídeo. */
export const FPS = 30;

/** Fotogramas de la lógica del juego por segundo. */
const GAME_FPS = 60;

/** Instante fijo del reloj simulado. */
const FIXED_TIME = new Date('2026-10-02T12:00:00');

/** Margen tras instalar el reloj simulado antes de pausarlo (ms). */
const CLOCK_PAUSE_OFFSET_MS = 1000;

/** Valor de `performance.now()` en el que empieza cada grabación (ms). */
const ALIGNED_START_MS = 200;

/** Carpeta temporal de los fotogramas y carpeta de los extractos. */
const TMP_DIR = new URL('../tmp/extractos/', import.meta.url);
const CLIPS_DIR = new URL('../extractos/', import.meta.url);

/**
 * Abre el build del juego en modo test con el reloj simulado en pausa, la semilla fija
 * y, si se indican, datos previos en `localStorage` (preferencias o récords).
 * @param page Página.
 * @param storage Claves y valores que se guardan antes de cargar el juego.
 */
export async function openRecording(
  page: Page,
  storage: Record<string, string> = {},
): Promise<void> {
  await page.clock.install({ time: FIXED_TIME });
  await page.clock.pauseAt(new Date(FIXED_TIME.getTime() + CLOCK_PAUSE_OFFSET_MS));
  await page.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) {
      localStorage.setItem(key, value);
    }
  }, storage);
  await page.goto(`http://localhost:${VIDEO_PREVIEW_PORT}/?seed=123&test=1`);
  await page.waitForFunction(() => window.__tetris !== undefined);
  // Mismo truco que en las capturas del README: alinear el reloj del documento hace
  // que la rejilla de fotogramas (y la escena de fondo) sea igual en cada ejecución.
  const offset = await page.evaluate(() => performance.now());
  await page.clock.runFor(ALIGNED_START_MS - offset);
}

/**
 * Avanza el reloj simulado un número de fotogramas de la lógica del juego (60 por s).
 * @param page Página.
 * @param frames Fotogramas.
 */
export async function runGameFrames(page: Page, frames: number): Promise<void> {
  await page.clock.runFor(Math.round((frames * 1000) / GAME_FPS));
}

/**
 * Pulsa una tecla y deja pasar unos fotogramas de juego (como una persona).
 * @param page Página.
 * @param key Tecla.
 */
export async function tap(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
  await runGameFrames(page, 4);
}

/**
 * Modifica la partida en curso.
 * @param page Página.
 * @param patch Cambios.
 */
export async function patchGame(page: Page, patch: TestGamePatch): Promise<void> {
  await page.evaluate((changes) => window.__tetris?.patchGame(changes), patch);
}

/**
 * Fija la hora, el tiempo o el evento de la plaza.
 * @param page Página.
 * @param conditions Condiciones.
 */
export async function setScene(page: Page, conditions: SceneConditions): Promise<void> {
  await page.evaluate((c) => window.__tetris?.setScene(c), conditions);
}

/**
 * Oculta o muestra la interfaz (plaza limpia).
 * @param page Página.
 * @param hidden Si se oculta.
 */
export async function setInterfaceHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((h) => window.__tetris?.setInterfaceHidden(h), hidden);
}

/**
 * Estado del motor de la partida en curso.
 * @param page Página.
 * @returns Estado, o `null`.
 */
export async function gameState(page: Page): Promise<GameState | null> {
  return page.evaluate(() => window.__tetris?.getGameState() ?? null);
}

/**
 * Empieza una partida desde la pantalla inicial en un nivel.
 * @param page Página.
 * @param startLevel Nivel inicial (0–9).
 */
export async function startGame(page: Page, startLevel = 0): Promise<void> {
  await tap(page, 'Space');
  await tap(page, 'ArrowDown');
  for (let level = 0; level < startLevel; level++) {
    await tap(page, 'ArrowRight');
  }
  await tap(page, 'ArrowUp');
  await tap(page, 'Enter');
}

/** Acción de teclado programada para un fotograma. */
type KeyAction = { readonly type: 'down' | 'up'; readonly key: string };

/**
 * Jugador automático por fotogramas: elige dónde colocar cada pieza con la heurística
 * del GIF del README y la lleva hasta allí pulsando teclas, con soft drop al final.
 */
export class AutoPlayer {
  private queue: KeyAction[] = [];
  private dropping = false;

  /**
   * @param page Página.
   * @param recorder Grabador donde se anotan las teclas.
   */
  constructor(
    private readonly page: Page,
    private readonly recorder: Recorder,
  ) {}

  /** Ejecuta las pulsaciones que tocan antes del siguiente fotograma. */
  async step(): Promise<void> {
    const state = await gameState(this.page);
    if (state === null) {
      return;
    }
    if (this.dropping && state.phase !== 'falling') {
      await this.recorder.key('ArrowDown', 'up');
      this.dropping = false;
    }
    const next = this.queue.shift();
    if (next !== undefined) {
      await this.recorder.key(next.key, next.type);
      return;
    }
    if (state.phase !== 'falling' || state.activePiece === null || this.dropping) {
      return;
    }
    const piece = state.activePiece;
    const target = choosePlacement(state.board, piece.type);
    const rotations =
      target.rotation === 3 ? ['KeyZ'] : Array.from({ length: target.rotation }, () => 'ArrowUp');
    const shift = target.x - piece.x;
    const moves = Array.from({ length: Math.abs(shift) }, () =>
      shift < 0 ? 'ArrowLeft' : 'ArrowRight',
    );
    for (const key of [...rotations, ...moves]) {
      this.queue.push({ type: 'down', key }, { type: 'up', key });
    }
    this.queue.push({ type: 'down', key: 'ArrowDown' });
    this.dropping = true;
  }
}

/**
 * Las animaciones CSS (parpadeo de PAUSA, rótulo de nivel) siguen el reloj real del
 * navegador, no el simulado. Esta función las pausa y las coloca en el instante que les
 * toca según el reloj simulado, contando desde que aparecieron.
 * @param page Página.
 */
async function syncCssAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    const now = performance.now();
    const holder = window as unknown as { __animationStarts?: WeakMap<Animation, number> };
    holder.__animationStarts ??= new WeakMap();
    const starts = holder.__animationStarts;
    for (const animation of document.getAnimations()) {
      const start = starts.get(animation) ?? now;
      starts.set(animation, start);
      animation.pause();
      animation.currentTime = now - start;
    }
  });
}

/** Algo que ocurre en un extracto, con su instante (s desde el principio del extracto). */
export interface ClipEvent {
  readonly t: number;
  readonly tipo:
    | 'move'
    | 'rotate'
    | 'lock'
    | 'lineClear'
    | 'tetris'
    | 'levelUp'
    | 'gameOver'
    | 'celebracion'
    | 'pausa'
    | 'tecla';
  /** Detalle (por ejemplo, la tecla pulsada). */
  readonly detalle?: string;
}

/** Datos del juego que se comparan entre fotogramas para detectar lo que ocurre. */
interface Observed {
  readonly phase: string | null;
  readonly level: number;
  readonly clearing: number;
  readonly screen: string;
}

/** Graba un extracto fotograma a fotograma avanzando el reloj simulado. */
export class Recorder {
  private frame = 0;
  private readonly framesDir: string;
  private readonly events: ClipEvent[] = [];
  private previous: Observed | null = null;

  /**
   * @param page Página.
   * @param name Nombre del extracto (sin extensión).
   */
  constructor(
    private readonly page: Page,
    private readonly name: string,
  ) {
    this.framesDir = new URL(`${name}/`, TMP_DIR).pathname;
    resetDir(this.framesDir);
  }

  /** Fotogramas grabados. */
  get frames(): number {
    return this.frame;
  }

  /** Segundo actual del extracto. */
  get seconds(): number {
    return this.frame / FPS;
  }

  /**
   * Anota un suceso en el instante actual.
   * @param tipo Tipo de suceso.
   * @param detalle Detalle opcional.
   */
  mark(tipo: ClipEvent['tipo'], detalle?: string): void {
    this.events.push({
      t: Number(this.seconds.toFixed(3)),
      tipo,
      ...(detalle === undefined ? {} : { detalle }),
    });
  }

  /**
   * Pulsa (o suelta) una tecla y la anota como suceso del extracto.
   * @param key Tecla.
   * @param type Pulsar y soltar, solo pulsar o solo soltar.
   */
  async key(key: string, type: 'down' | 'up' | 'press' = 'press'): Promise<void> {
    if (type !== 'up') {
      this.mark('tecla', key);
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        this.mark('move');
      } else if (key === 'ArrowUp' || key === 'KeyZ') {
        this.mark('rotate');
      }
    }
    if (type === 'press') {
      await this.page.keyboard.press(key);
    } else if (type === 'down') {
      await this.page.keyboard.down(key);
    } else {
      await this.page.keyboard.up(key);
    }
  }

  /** Compara el estado del juego con el del fotograma anterior y anota lo que ha pasado. */
  private async observe(): Promise<void> {
    const current = await this.page.evaluate(() => {
      const state = window.__tetris?.getGameState() ?? null;
      return {
        phase: state?.phase ?? null,
        level: state?.level ?? 0,
        clearing: state?.clearingRows.length ?? 0,
        screen: window.__tetris?.getSnapshot().screen ?? '',
      };
    });
    const before = this.previous;
    if (before !== null) {
      if (before.phase === 'falling' && current.phase !== 'falling' && current.phase !== null) {
        this.mark('lock');
      }
      if (before.phase !== 'lineClear' && current.phase === 'lineClear') {
        this.mark(current.clearing === 4 ? 'tetris' : 'lineClear');
      }
      if (current.level > before.level) {
        this.mark('levelUp');
      }
      if (before.phase !== 'gameOver' && current.phase === 'gameOver') {
        this.mark('gameOver');
      }
      if (before.screen !== 'celebrating' && current.screen === 'celebrating') {
        this.mark('celebracion');
      }
      if (before.screen !== 'paused' && current.screen === 'paused') {
        this.mark('pausa');
      }
    }
    this.previous = current;
  }

  /**
   * Captura el fotograma actual (a la resolución del dispositivo) y avanza el reloj
   * 1/30 s, alternando 33 y 34 ms para que la suma sea exacta.
   */
  async capture(): Promise<void> {
    await this.observe();
    await syncCssAnimations(this.page);
    const png = await this.page.screenshot({ type: 'png', scale: 'device' });
    writeBytes(`${this.framesDir}frame_${String(this.frame).padStart(5, '0')}.png`, png);
    const from = Math.round((this.frame * 1000) / FPS);
    this.frame++;
    const to = Math.round((this.frame * 1000) / FPS);
    await this.page.clock.runFor(to - from);
  }

  /**
   * Graba unos segundos, ejecutando antes de cada fotograma una acción opcional.
   * @param seconds Duración.
   * @param beforeFrame Acción con el número de fotograma del tramo.
   */
  async record(seconds: number, beforeFrame?: (frame: number) => Promise<void>): Promise<void> {
    const frames = Math.round(seconds * FPS);
    for (let i = 0; i < frames; i++) {
      await beforeFrame?.(i);
      await this.capture();
    }
  }

  /** Une los fotogramas en video/extractos/<nombre>.mp4 y guarda sus sucesos en un JSON. */
  finish(): void {
    encodeFrames(
      this.framesDir.replace(/\/$/, ''),
      new URL(`${this.name}.mp4`, CLIPS_DIR).pathname,
      FPS,
    );
    const json = JSON.stringify({ duracion: this.seconds, eventos: this.events }, null, 2) + '\n';
    writeBytes(new URL(`${this.name}.json`, CLIPS_DIR).pathname, new TextEncoder().encode(json));
  }
}
