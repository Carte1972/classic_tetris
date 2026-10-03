import { describe, expect, it, vi } from 'vitest';
import { createAppController, type AppDependencies } from '../../../src/app/app_controller';
import { findBestPlacement } from '../../../src/ai/dellacherie';
import { KALINKA } from '../../../src/audio/songs/kalinka';
import { KOROBEINIKI } from '../../../src/audio/songs/korobeiniki';
import {
  CELEBRATION_DURATION_MS,
  LEVEL_BANNER_DURATION_MS,
} from '../../../src/config/celebration_config';
import { MENU_ITEMS } from '../../../src/config/menu_config';
import { PREFERENCES_STORAGE_KEY, RECORDS_STORAGE_KEY } from '../../../src/config/storage_config';
import { lockPiece } from '../../../src/engine/board';
import type { Board } from '../../../src/engine/types';
import { createKeyboardState, type KeyboardState } from '../../../src/input/keyboard_state';
import type { RecordsFile } from '../../../src/storage/records_file';
import type { RecordEntry } from '../../../src/storage/records_store';
import { createMemoryStorage } from '../storage/memory_storage';

/** Tiempo suficiente para que una pieza se fije y aparezca la siguiente en el nivel 0. */
const LONG_ENOUGH_MS = 3000;

/** Tablero visible lleno salvo la última columna: la siguiente pieza ya no cabe. */
const FULL_BOARD = Array.from({ length: 20 }, () => 'OOOOOOOOO.');

/** Crea el controlador con dependencias falsas. */
function setup(
  initialStorage: Record<string, string> = {},
  recordsFile: RecordsFile | null = null,
) {
  const keyboard = createKeyboardState();
  const audio = {
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
    pauseMusic: vi.fn(),
    resumeMusic: vi.fn(),
    playSfx: vi.fn(),
    setTempoMultiplier: vi.fn(),
    setMusicEnabled: vi.fn(),
    setMuted: vi.fn(),
  };
  const storage = createMemoryStorage(initialStorage);
  const deps: AppDependencies = {
    keyboard,
    audio,
    storage,
    recordsFile,
    createSeed: () => 42,
    now: () => new Date(2026, 9, 1),
  };
  const controller = createAppController(deps);
  /** Pulsa y suelta una tecla y procesa un fotograma. */
  const press = (code: string, dtMs = 0) => {
    tap(keyboard, code);
    controller.update(dtMs);
  };
  return { keyboard, audio, storage, controller, press };
}

/** Pulsa y suelta una tecla. */
function tap(keyboard: KeyboardState, code: string): void {
  keyboard.keyDown(code, false);
  keyboard.keyUp(code);
}

/** Lleva el controlador desde el inicio hasta una partida en curso. */
function startPlaying(ctx: ReturnType<typeof setup>): void {
  ctx.press('Space');
  ctx.press('Enter');
}

/** Provoca el fin de la partida en curso con la puntuación indicada. */
function forceGameOver(ctx: ReturnType<typeof setup>, score = 1234): void {
  ctx.controller.patchGame({
    boardRows: FULL_BOARD,
    activePiece: { type: 'O', rotation: 0, x: 1, y: 0 },
    score,
    lines: 7,
  });
  ctx.controller.update(LONG_ENOUGH_MS);
}

describe('pantalla PULSA CUALQUIER TECLA', () => {
  it('es la primera pantalla y cualquier tecla lleva al menú con música', () => {
    const { controller, audio, press } = setup();
    expect(controller.getSnapshot().screen).toBe('pressAnyKey');
    controller.update(16);
    expect(controller.getSnapshot().screen).toBe('pressAnyKey');
    press('KeyQ');
    expect(controller.getSnapshot().screen).toBe('menu');
    expect(audio.playMusic).toHaveBeenCalledWith(KOROBEINIKI);
  });

  it('la tecla M usada para empezar no silencia el sonido', () => {
    const { controller, audio, press } = setup();
    press('KeyM');
    expect(controller.getSnapshot().preferences.muted).toBe(false);
    expect(audio.setMuted).not.toHaveBeenCalledWith(true);
  });
});

describe('menú', () => {
  it('cambia el nivel inicial y lo guarda', () => {
    const { controller, storage, press } = setup();
    press('Space');
    press('ArrowDown');
    press('ArrowRight');
    press('ArrowRight');
    press('ArrowLeft');
    expect(controller.getSnapshot().menuIndex).toBe(MENU_ITEMS.indexOf('startLevel'));
    expect(controller.getSnapshot().preferences.startLevel).toBe(1);
    expect(storage.data.get(PREFERENCES_STORAGE_KEY)).toContain('"startLevel":1');
  });

  it('activa y desactiva la música y las celebraciones', () => {
    const { controller, audio, press } = setup();
    press('Space');
    press('ArrowDown');
    press('ArrowDown');
    press('Enter');
    expect(controller.getSnapshot().preferences.musicEnabled).toBe(false);
    expect(audio.setMusicEnabled).toHaveBeenLastCalledWith(false);
    press('ArrowDown');
    press('ArrowRight');
    expect(controller.getSnapshot().preferences.celebrationsEnabled).toBe(false);
  });

  it('abre CONTROLES y RÉCORDS y vuelve con Esc o Enter', () => {
    const { controller, press } = setup();
    press('Space');
    press('ArrowUp');
    press('ArrowUp');
    press('Enter');
    expect(controller.getSnapshot().screen).toBe('controls');
    press('Escape');
    expect(controller.getSnapshot().screen).toBe('menu');
    press('ArrowDown');
    press('Enter');
    expect(controller.getSnapshot().screen).toBe('records');
    press('Enter');
    expect(controller.getSnapshot().screen).toBe('menu');
  });

  it('aplica al audio las preferencias guardadas', () => {
    const { audio } = setup({
      [PREFERENCES_STORAGE_KEY]: JSON.stringify({ musicEnabled: false, muted: true }),
    });
    expect(audio.setMusicEnabled).toHaveBeenCalledWith(false);
    expect(audio.setMuted).toHaveBeenCalledWith(true);
  });
});

describe('partida', () => {
  it('INICIAR JUEGO empieza en el nivel elegido con marcador', () => {
    const ctx = setup({ [PREFERENCES_STORAGE_KEY]: JSON.stringify({ startLevel: 4 }) });
    startPlaying(ctx);
    const snapshot = ctx.controller.getSnapshot();
    expect(snapshot.screen).toBe('playing');
    expect(snapshot.hud).toMatchObject({ score: 0, lines: 0, level: 4 });
    expect(ctx.controller.getGameState()?.startLevel).toBe(4);
  });

  it('el teclado mueve la pieza y suena el efecto', () => {
    const ctx = setup();
    startPlaying(ctx);
    const startX = ctx.controller.getGameState()?.activePiece?.x ?? 0;
    ctx.press('ArrowLeft', 17);
    expect(ctx.controller.getGameState()?.activePiece?.x).toBe(startX - 1);
    expect(ctx.audio.playSfx).toHaveBeenCalledWith('move');
  });

  it('P pausa y reanuda; la partida no avanza en pausa', () => {
    const ctx = setup();
    startPlaying(ctx);
    ctx.press('KeyP');
    expect(ctx.controller.getSnapshot().screen).toBe('paused');
    expect(ctx.audio.pauseMusic).toHaveBeenCalled();
    const frozen = ctx.controller.getGameState();
    ctx.controller.update(LONG_ENOUGH_MS);
    expect(ctx.controller.getGameState()).toBe(frozen);
    ctx.press('KeyP');
    expect(ctx.controller.getSnapshot().screen).toBe('playing');
    expect(ctx.audio.resumeMusic).toHaveBeenCalled();
  });

  it('Esc vuelve al menú desde la partida y desde la pausa sin guardar récord', () => {
    const ctx = setup();
    startPlaying(ctx);
    ctx.controller.patchGame({ score: 900 });
    ctx.press('Escape');
    expect(ctx.controller.getSnapshot().screen).toBe('menu');
    expect(ctx.controller.getGameState()).toBeNull();
    ctx.press('Enter');
    ctx.press('KeyP');
    ctx.press('Escape');
    expect(ctx.controller.getSnapshot().screen).toBe('menu');
    expect(ctx.storage.data.has(RECORDS_STORAGE_KEY)).toBe(false);
  });

  it('M silencia en cualquier pantalla y se guarda', () => {
    const ctx = setup();
    startPlaying(ctx);
    ctx.press('KeyM');
    expect(ctx.audio.setMuted).toHaveBeenLastCalledWith(true);
    expect(ctx.controller.getSnapshot().preferences.muted).toBe(true);
    expect(ctx.storage.data.get(PREFERENCES_STORAGE_KEY)).toContain('"muted":true');
    ctx.press('KeyM');
    expect(ctx.audio.setMuted).toHaveBeenLastCalledWith(false);
  });

  it('el marcador muestra como récord el mejor entre el guardado y la partida', () => {
    const ctx = setup({
      [RECORDS_STORAGE_KEY]: JSON.stringify([
        { score: 500, lines: 5, level: 0, date: '2026-01-01' },
      ]),
    });
    startPlaying(ctx);
    expect(ctx.controller.getSnapshot().hud?.best).toBe(500);
    ctx.controller.patchGame({ score: 800 });
    expect(ctx.controller.getSnapshot().hud?.best).toBe(800);
  });
});

describe('fin de la partida', () => {
  it('al entrar en el ranking pide el nombre y después guarda el récord con la fecha', () => {
    const ctx = setup();
    startPlaying(ctx);
    forceGameOver(ctx);
    const asking = ctx.controller.getSnapshot();
    expect(asking.screen).toBe('nameEntry');
    expect(asking.lastResult).toEqual({
      score: 1234,
      lines: 7,
      level: 0,
      rank: 0,
      autopilotUsed: false,
    });
    expect(asking.records).toEqual([]);
    expect(ctx.audio.playSfx).toHaveBeenCalledWith('gameOver');
    ctx.controller.submitRecordName('  ana maría ');
    const saved = ctx.controller.getSnapshot();
    expect(saved.screen).toBe('gameOver');
    expect(saved.lastResult?.rank).toBe(0);
    expect(saved.records).toEqual([
      { name: 'ANA MARÍA', score: 1234, lines: 7, level: 0, date: '2026-10-01' },
    ]);
    expect(ctx.storage.data.get(RECORDS_STORAGE_KEY)).toContain('ANA MARÍA');
  });

  it('mientras pide el nombre, el teclado del juego no hace nada', () => {
    const ctx = setup();
    startPlaying(ctx);
    forceGameOver(ctx);
    ctx.press('Enter');
    ctx.press('Escape');
    expect(ctx.controller.getSnapshot().screen).toBe('nameEntry');
    ctx.controller.submitRecordName('ANA');
    expect(ctx.controller.getSnapshot().screen).toBe('gameOver');
  });

  it('una partida de 0 puntos no pide nombre aunque el ranking esté vacío', () => {
    const ctx = setup();
    startPlaying(ctx);
    forceGameOver(ctx, 0);
    expect(ctx.controller.getSnapshot().screen).toBe('gameOver');
    expect(ctx.controller.getSnapshot().lastResult?.rank).toBeNull();
  });

  it('submitRecordName no hace nada si no se está pidiendo el nombre', () => {
    const ctx = setup();
    startPlaying(ctx);
    ctx.controller.submitRecordName('ANA');
    expect(ctx.controller.getSnapshot().records).toEqual([]);
    expect(ctx.controller.getSnapshot().screen).toBe('playing');
  });

  it('una partida que no entra en el top 10 no cambia los récords', () => {
    const full = Array.from({ length: 10 }, () => ({
      score: 5000,
      lines: 50,
      level: 5,
      date: '2026-01-01',
    }));
    const ctx = setup({ [RECORDS_STORAGE_KEY]: JSON.stringify(full) });
    startPlaying(ctx);
    forceGameOver(ctx);
    expect(ctx.controller.getSnapshot().lastResult?.rank).toBeNull();
    expect(ctx.controller.getSnapshot().records).toHaveLength(10);
  });

  it('Enter empieza otra partida y Esc vuelve al menú', () => {
    const ctx = setup();
    startPlaying(ctx);
    forceGameOver(ctx);
    ctx.controller.submitRecordName('ANA');
    ctx.press('Enter');
    expect(ctx.controller.getSnapshot().screen).toBe('playing');
    expect(ctx.controller.getSnapshot().hud?.score).toBe(0);
    expect(ctx.controller.getSnapshot().lastResult).toBeNull();
    forceGameOver(ctx);
    ctx.controller.submitRecordName('ANA');
    ctx.press('Escape');
    expect(ctx.controller.getSnapshot().screen).toBe('menu');
  });

  it('un Enter pulsado durante la partida no reinicia al perder', () => {
    const ctx = setup();
    startPlaying(ctx);
    tap(ctx.keyboard, 'Enter');
    forceGameOver(ctx, 0);
    ctx.controller.update(16);
    expect(ctx.controller.getSnapshot().screen).toBe('gameOver');
  });
});

describe('suscripción', () => {
  it('el estado de la interfaz solo cambia de identidad si cambia algo', () => {
    const ctx = setup();
    const listener = vi.fn();
    const unsubscribe = ctx.controller.subscribe(listener);
    const before = ctx.controller.getSnapshot();
    ctx.controller.update(16);
    expect(ctx.controller.getSnapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
    ctx.press('Space');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    ctx.press('ArrowDown');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('patchGame no hace nada sin partida', () => {
    const ctx = setup();
    ctx.controller.patchGame({ score: 10 });
    expect(ctx.controller.getGameState()).toBeNull();
  });
});

/** Completa la última línea del objetivo con una I vertical para pasar al nivel `level`. */
function forceLevelUp(ctx: ReturnType<typeof setup>, level: number): void {
  ctx.controller.patchGame({
    boardRows: ['OOOOOOOOO.'],
    levelGoal: 10,
    levelLines: 9,
    level: level - 1,
    activePiece: { type: 'I', rotation: 1, x: 9, y: 19 },
  });
  for (let i = 0; i < 200 && ctx.controller.getSnapshot().screen === 'playing'; i++) {
    ctx.controller.update(17);
  }
}

describe('celebraciones', () => {
  it('al subir de nivel congela la partida, toca Kalinka y muestra el nivel', () => {
    const ctx = setup();
    startPlaying(ctx);
    forceLevelUp(ctx, 3);
    const snapshot = ctx.controller.getSnapshot();
    expect(snapshot.screen).toBe('celebrating');
    expect(snapshot.celebrationLevel).toBe(3);
    expect(ctx.controller.getCelebration()?.dancerIndex).toBe(2);
    expect(ctx.audio.pauseMusic).toHaveBeenCalled();
    expect(ctx.audio.playMusic).toHaveBeenLastCalledWith(KALINKA);
    const frozen = ctx.controller.getGameState();
    ctx.controller.update(500);
    expect(ctx.controller.getGameState()).toBe(frozen);
  });

  it('al terminar empieza el nivel siguiente con el tablero vacío y reanuda la música', () => {
    const ctx = setup();
    startPlaying(ctx);
    forceLevelUp(ctx, 1);
    expect(ctx.controller.getSnapshot().celebrationKind).toBe('dance');
    ctx.controller.update(CELEBRATION_DURATION_MS - 100);
    expect(ctx.controller.getSnapshot().screen).toBe('celebrating');
    ctx.controller.update(100);
    const snapshot = ctx.controller.getSnapshot();
    expect(snapshot.screen).toBe('playing');
    expect(snapshot.celebrationLevel).toBeNull();
    expect(snapshot.hud).toMatchObject({ level: 1, levelLines: 0, levelGoal: 12 });
    const game = ctx.controller.getGameState();
    expect(game?.phase).toBe('falling');
    expect(game?.board.every((row) => row.every((cell) => cell === null))).toBe(true);
    expect(ctx.audio.resumeMusic).toHaveBeenCalled();
  });

  it.each(['Enter', 'Space'])('%s salta la celebración', (key) => {
    const ctx = setup();
    startPlaying(ctx);
    forceLevelUp(ctx, 1);
    ctx.press(key);
    expect(ctx.controller.getSnapshot().screen).toBe('playing');
  });

  it('desactivadas desde el menú, solo se muestra el rótulo del nivel durante 2 segundos', () => {
    const ctx = setup({
      [PREFERENCES_STORAGE_KEY]: JSON.stringify({ celebrationsEnabled: false }),
    });
    startPlaying(ctx);
    forceLevelUp(ctx, 1);
    expect(ctx.controller.getSnapshot().celebrationKind).toBe('banner');
    expect(ctx.audio.playMusic).not.toHaveBeenLastCalledWith(KALINKA);
    expect(ctx.audio.playSfx).toHaveBeenCalledWith('levelUp');
    ctx.controller.update(LEVEL_BANNER_DURATION_MS);
    expect(ctx.controller.getSnapshot().screen).toBe('playing');
    expect(ctx.controller.getGameState()?.level).toBe(1);
    expect(ctx.audio.resumeMusic).not.toHaveBeenCalled();
  });

  it('en niveles altos el marcador indica que la siguiente pieza está oculta', () => {
    const ctx = setup();
    startPlaying(ctx);
    expect(ctx.controller.getSnapshot().hud?.nextVisible).toBe(true);
    ctx.controller.patchGame({ level: 15 });
    expect(ctx.controller.getSnapshot().hud?.nextVisible).toBe(false);
  });

  it('Esc durante la celebración vuelve al menú', () => {
    const ctx = setup();
    startPlaying(ctx);
    forceLevelUp(ctx, 1);
    ctx.press('Escape');
    expect(ctx.controller.getSnapshot().screen).toBe('menu');
    expect(ctx.controller.getCelebration()).toBeNull();
  });

  it('el modo test puede congelarla en un instante y soltarla', () => {
    const ctx = setup();
    startPlaying(ctx);
    forceLevelUp(ctx, 1);
    ctx.controller.freezeCelebration(1500);
    ctx.controller.update(CELEBRATION_DURATION_MS);
    expect(ctx.controller.getCelebration()?.elapsedMs).toBe(1500);
    ctx.controller.freezeCelebration(null);
    ctx.controller.update(CELEBRATION_DURATION_MS);
    expect(ctx.controller.getSnapshot().screen).toBe('playing');
    ctx.controller.freezeCelebration(100);
    expect(ctx.controller.getCelebration()).toBeNull();
  });
});

/**
 * Juega la pieza activa de la partida en curso a fotogramas de 17 ms hasta que se fija y
 * comprueba que ha caído donde la coloca el algoritmo de Dellacherie.
 */
function expectPieceByAutopilot(ctx: ReturnType<typeof setup>): void {
  const state = ctx.controller.getGameState();
  const piece = state?.activePiece ?? null;
  const choice = state && piece && findBestPlacement(state.board, piece);
  expect(choice).not.toBeNull();
  let board: Board | undefined;
  for (let i = 0; i < 2000 && board === undefined; i++) {
    ctx.controller.update(17);
    const current = ctx.controller.getGameState();
    if (current !== null && current.board !== state?.board) {
      board = current.board;
    }
  }
  expect(state && choice && board).toEqual(
    state && choice && lockPiece(state.board, choice.landed),
  );
}

describe('piloto automático', () => {
  it('toggleAutopilot no hace nada fuera de las pantallas de partida', () => {
    const ctx = setup();
    const toggleAndCheck = () => {
      ctx.controller.toggleAutopilot();
      expect(ctx.controller.getSnapshot().autopilotEnabled).toBe(false);
    };
    toggleAndCheck();
    ctx.press('Space');
    expect(ctx.controller.getSnapshot().screen).toBe('menu');
    toggleAndCheck();
    ctx.press('ArrowUp');
    ctx.press('Enter');
    expect(ctx.controller.getSnapshot().screen).toBe('records');
    toggleAndCheck();
    ctx.press('Escape');
    ctx.press('ArrowUp');
    ctx.press('Enter');
    expect(ctx.controller.getSnapshot().screen).toBe('controls');
    toggleAndCheck();
  });

  it('se activa y desactiva en partida, pausa, celebración y game over', () => {
    const ctx = setup();
    startPlaying(ctx);
    const toggleTo = (enabled: boolean) => {
      ctx.controller.toggleAutopilot();
      expect(ctx.controller.getSnapshot().autopilotEnabled).toBe(enabled);
    };
    toggleTo(true);
    toggleTo(false);
    ctx.press('KeyP');
    expect(ctx.controller.getSnapshot().screen).toBe('paused');
    toggleTo(true);
    toggleTo(false);
    ctx.press('KeyP');
    forceLevelUp(ctx, 1);
    expect(ctx.controller.getSnapshot().screen).toBe('celebrating');
    toggleTo(true);
    toggleTo(false);
    ctx.press('Enter');
    forceGameOver(ctx);
    expect(ctx.controller.getSnapshot().screen).toBe('gameOver');
    toggleTo(true);
    toggleTo(false);
  });

  it('juega la pieza que está cayendo; las flechas, ↓ y Z se ignoran', () => {
    const ctx = setup();
    startPlaying(ctx);
    ctx.controller.toggleAutopilot();
    ctx.keyboard.keyDown('ArrowLeft', false);
    ctx.keyboard.keyDown('ArrowDown', false);
    tap(ctx.keyboard, 'KeyZ');
    expectPieceByAutopilot(ctx);
    expect(ctx.audio.playSfx).not.toHaveBeenCalledWith('rotate');
  });

  it('con el piloto activo siguen funcionando P, M y Esc', () => {
    const ctx = setup();
    startPlaying(ctx);
    ctx.controller.toggleAutopilot();
    ctx.press('KeyP');
    expect(ctx.controller.getSnapshot().screen).toBe('paused');
    ctx.press('KeyP');
    expect(ctx.controller.getSnapshot().screen).toBe('playing');
    ctx.press('KeyM');
    expect(ctx.controller.getSnapshot().preferences.muted).toBe(true);
    ctx.press('Escape');
    expect(ctx.controller.getSnapshot().screen).toBe('menu');
  });

  it('tras la celebración sigue activo y juega la primera pieza del nivel nuevo', () => {
    const ctx = setup();
    startPlaying(ctx);
    ctx.controller.toggleAutopilot();
    // El piloto ve la I vertical junto al hueco y completa la línea que falta.
    forceLevelUp(ctx, 1);
    expect(ctx.controller.getSnapshot().screen).toBe('celebrating');
    expect(ctx.controller.getSnapshot().autopilotEnabled).toBe(true);
    ctx.controller.update(CELEBRATION_DURATION_MS);
    expect(ctx.controller.getSnapshot().screen).toBe('playing');
    expect(ctx.controller.getGameState()?.level).toBe(1);
    expect(ctx.controller.getSnapshot().autopilotEnabled).toBe(true);
    expectPieceByAutopilot(ctx);
  });

  it('una partida que ha usado el piloto no entra en récords ni cuenta para el récord del marcador', () => {
    const stored = [{ name: 'ПЁТР', score: 800, lines: 5, level: 0, date: '2026-01-01' }];
    const ctx = setup({ [RECORDS_STORAGE_KEY]: JSON.stringify(stored) });
    startPlaying(ctx);
    ctx.controller.patchGame({ score: 5000 });
    expect(ctx.controller.getSnapshot().hud?.best).toBe(5000);
    ctx.controller.toggleAutopilot();
    expect(ctx.controller.getSnapshot().hud?.best).toBe(800);
    // Aunque se desactive, la partida ya lo ha usado.
    ctx.controller.toggleAutopilot();
    expect(ctx.controller.getSnapshot().hud?.best).toBe(800);
    forceGameOver(ctx);
    const snapshot = ctx.controller.getSnapshot();
    expect(snapshot.lastResult).toEqual({
      score: 1234,
      lines: 7,
      level: 0,
      rank: null,
      autopilotUsed: true,
    });
    expect(snapshot.records).toEqual(stored);
    expect(ctx.storage.data.get(RECORDS_STORAGE_KEY)).toBe(JSON.stringify(stored));
  });

  it('ENTER tras un game over con el piloto activo empieza otra partida con el piloto', () => {
    const ctx = setup();
    startPlaying(ctx);
    ctx.controller.toggleAutopilot();
    forceGameOver(ctx);
    ctx.press('Enter');
    expect(ctx.controller.getSnapshot().screen).toBe('playing');
    expect(ctx.controller.getSnapshot().autopilotEnabled).toBe(true);
    expectPieceByAutopilot(ctx);
    forceGameOver(ctx);
    expect(ctx.controller.getSnapshot().lastResult?.autopilotUsed).toBe(true);
  });

  it('activarlo en game over no cambia la partida terminada, pero la siguiente ya lo usa', () => {
    const ctx = setup();
    startPlaying(ctx);
    forceGameOver(ctx);
    expect(ctx.controller.getSnapshot().lastResult?.rank).toBe(0);
    // El botón también funciona mientras se pide el nombre, sin perder el récord.
    ctx.controller.toggleAutopilot();
    expect(ctx.controller.getSnapshot().autopilotEnabled).toBe(true);
    ctx.controller.submitRecordName('ANA');
    expect(ctx.controller.getSnapshot().lastResult?.autopilotUsed).toBe(false);
    expect(ctx.controller.getSnapshot().records).toHaveLength(1);
    ctx.press('Enter');
    expectPieceByAutopilot(ctx);
  });
});

describe('ranking en el disco (records.json)', () => {
  const ON_DISK: readonly RecordEntry[] = [
    { name: 'ПЁТР', score: 900, lines: 9, level: 1, date: '2026-10-02' },
  ];

  /** Archivo de récords falso que responde con lo indicado. */
  function fakeFile(stored: readonly RecordEntry[] | null, saveOk = true) {
    return {
      load: vi.fn(() => Promise.resolve(stored)),
      save: vi.fn<RecordsFile['save']>(() => Promise.resolve(saveOk)),
    };
  }

  it('con el servidor de los lanzadores, lee el ranking del archivo y guarda en él', async () => {
    const file = fakeFile(ON_DISK);
    const ctx = setup({}, file);
    await vi.waitFor(() => expect(ctx.controller.getSnapshot().records).toEqual(ON_DISK));
    startPlaying(ctx);
    forceGameOver(ctx);
    expect(ctx.controller.getSnapshot().lastResult?.rank).toBe(0);
    ctx.controller.submitRecordName('ana');
    const expected = [
      { name: 'ANA', score: 1234, lines: 7, level: 0, date: '2026-10-01' },
      ...ON_DISK,
    ];
    expect(ctx.controller.getSnapshot().records).toEqual(expected);
    expect(file.save).toHaveBeenCalledWith(expected);
    expect(ctx.storage.data.has(RECORDS_STORAGE_KEY)).toBe(false);
  });

  it('si el servidor no puede guardar, el ranking queda en el navegador', async () => {
    const file = fakeFile([], false);
    const ctx = setup({}, file);
    await vi.waitFor(() => expect(file.load).toHaveBeenCalled());
    startPlaying(ctx);
    forceGameOver(ctx);
    ctx.controller.submitRecordName('ANA');
    await vi.waitFor(() => expect(ctx.storage.data.get(RECORDS_STORAGE_KEY)).toContain('ANA'));
  });

  it('sin servidor de récords usa el navegador', async () => {
    const stored = [{ name: 'LUIS', score: 700, lines: 7, level: 0, date: '2026-09-30' }];
    const file = fakeFile(null);
    const ctx = setup({ [RECORDS_STORAGE_KEY]: JSON.stringify(stored) }, file);
    await vi.waitFor(() => expect(file.load).toHaveBeenCalled());
    expect(ctx.controller.getSnapshot().records).toEqual(stored);
    startPlaying(ctx);
    forceGameOver(ctx);
    ctx.controller.submitRecordName('ANA');
    expect(file.save).not.toHaveBeenCalled();
    expect(ctx.storage.data.get(RECORDS_STORAGE_KEY)).toContain('ANA');
  });
});
