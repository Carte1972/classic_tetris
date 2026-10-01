import type { AudioEngine } from '../audio/audio_engine';
import { KOROBEINIKI } from '../audio/songs/korobeiniki';
import type { GameAction } from '../config/input_config';
import type { GameState, PieceType } from '../engine/types';
import type { KeyboardState } from '../input/keyboard_state';
import type { KeyValueStorage } from '../storage/key_value_storage';
import { loadPreferences, savePreferences, type Preferences } from '../storage/preferences_store';
import {
  insertRecord,
  loadRecords,
  saveRecords,
  toIsoDate,
  type RecordEntry,
} from '../storage/records_store';
import {
  cycleStartLevel,
  navigateMenu,
  type MenuCommand,
  type MenuInput,
} from '../ui/menu_navigation';
import { applyGameAudio } from './game_audio_director';
import { createGameSession, type GameSession } from './game_session';
import { applyTestPatch, type TestGamePatch } from './test_mode';

/** Pantallas de la aplicación. */
export type ScreenName =
  'pressAnyKey' | 'menu' | 'controls' | 'records' | 'playing' | 'paused' | 'gameOver';

/** Datos del marcador durante la partida. */
export interface HudData {
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  readonly nextPiece: PieceType;
  /** Mejor puntuación conocida, incluida la partida en curso. */
  readonly best: number;
}

/** Resultado de la última partida terminada. */
export interface GameResult {
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  /** Posición en el top 10 (0 = nuevo récord), o `null` si no entra. */
  readonly rank: number | null;
}

/** Lo que la interfaz necesita para pintarse. Cambia de identidad solo si cambia algo. */
export interface AppSnapshot {
  readonly screen: ScreenName;
  readonly menuIndex: number;
  readonly preferences: Preferences;
  readonly records: readonly RecordEntry[];
  readonly hud: HudData | null;
  readonly lastResult: GameResult | null;
}

/** Parte del motor de audio que usa la aplicación. */
export type AppAudio = Pick<
  AudioEngine,
  'playMusic' | 'stopMusic' | 'playSfx' | 'setTempoMultiplier' | 'setMusicEnabled' | 'setMuted'
>;

/** Dependencias de la aplicación (inyectables para tests). */
export interface AppDependencies {
  readonly keyboard: KeyboardState;
  readonly audio: AppAudio;
  readonly storage: KeyValueStorage | null;
  /** Semilla de cada partida nueva. */
  readonly createSeed: () => number;
  /** Reloj para fechar los récords. */
  readonly now: () => Date;
}

/** Controlador de la aplicación: pantallas, partidas, audio y almacenamiento. */
export interface AppController {
  /** Avanza la aplicación un fotograma: lee el teclado y actualiza la pantalla actual. */
  readonly update: (dtMs: number) => void;
  /** Estado para la interfaz. */
  readonly getSnapshot: () => AppSnapshot;
  /** Suscribe una función a los cambios del estado de la interfaz. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Estado del motor de la partida en curso, o `null` si no hay partida. */
  readonly getGameState: () => GameState | null;
  /** Modifica la partida en curso (solo para el modo test). */
  readonly patchGame: (patch: TestGamePatch) => void;
}

/** Entradas del menú en el orden en que se procesan, con la acción de teclado de cada una. */
const MENU_KEYS: readonly (readonly [MenuInput, GameAction])[] = [
  ['up', 'menuUp'],
  ['down', 'menuDown'],
  ['left', 'moveLeft'],
  ['right', 'moveRight'],
  ['confirm', 'confirm'],
];

/**
 * Crea el controlador de la aplicación.
 * @param deps Dependencias.
 * @returns El controlador, en la pantalla "PULSA CUALQUIER TECLA".
 */
export function createAppController(deps: AppDependencies): AppController {
  const { keyboard, audio, storage } = deps;
  let screen: ScreenName = 'pressAnyKey';
  let menuIndex = 0;
  let preferences = loadPreferences(storage);
  let records = loadRecords(storage);
  let session: GameSession | null = null;
  let lastResult: GameResult | null = null;
  let snapshot = buildSnapshot();
  const listeners = new Set<() => void>();

  audio.setMusicEnabled(preferences.musicEnabled);
  audio.setMuted(preferences.muted);

  function buildSnapshot(): AppSnapshot {
    const state = session?.getState() ?? null;
    return {
      screen,
      menuIndex,
      preferences,
      records,
      lastResult,
      hud:
        state === null
          ? null
          : {
              score: state.score,
              lines: state.lines,
              level: state.level,
              nextPiece: state.nextPiece,
              best: Math.max(records[0]?.score ?? 0, state.score),
            },
    };
  }

  function publish(): void {
    const next = buildSnapshot();
    if (!snapshotsEqual(snapshot, next)) {
      snapshot = next;
      listeners.forEach((listener) => listener());
    }
  }

  function goTo(next: ScreenName): void {
    screen = next;
    keyboard.clearPressed();
  }

  function updatePreferences(changes: Partial<Preferences>): void {
    preferences = { ...preferences, ...changes };
    savePreferences(storage, preferences);
  }

  function startGame(): void {
    session = createGameSession(
      { seed: deps.createSeed(), startLevel: preferences.startLevel },
      keyboard,
    );
    lastResult = null;
    audio.setTempoMultiplier(1);
    audio.playMusic(KOROBEINIKI);
    goTo('playing');
  }

  function returnToMenu(): void {
    session = null;
    audio.setTempoMultiplier(1);
    audio.playMusic(KOROBEINIKI);
    goTo('menu');
  }

  function finishGame(state: GameState): void {
    const insertion = insertRecord(records, {
      score: state.score,
      lines: state.lines,
      level: state.level,
      date: toIsoDate(deps.now()),
    });
    if (insertion.rank !== null) {
      records = insertion.records;
      saveRecords(storage, records);
    }
    lastResult = {
      score: state.score,
      lines: state.lines,
      level: state.level,
      rank: insertion.rank,
    };
    goTo('gameOver');
  }

  function runMenuCommand(command: MenuCommand): void {
    switch (command.type) {
      case 'none':
        return;
      case 'startGame':
        startGame();
        return;
      case 'changeStartLevel':
        updatePreferences({ startLevel: cycleStartLevel(preferences.startLevel, command.delta) });
        return;
      case 'toggleMusic':
        updatePreferences({ musicEnabled: !preferences.musicEnabled });
        audio.setMusicEnabled(preferences.musicEnabled);
        return;
      case 'toggleCelebrations':
        updatePreferences({ celebrationsEnabled: !preferences.celebrationsEnabled });
        return;
      case 'openControls':
        goTo('controls');
        return;
      case 'openRecords':
        goTo('records');
        return;
    }
  }

  function updateMenu(): void {
    for (const [input, action] of MENU_KEYS) {
      if (screen === 'menu' && keyboard.consumePressed(action)) {
        const navigation = navigateMenu(menuIndex, input);
        menuIndex = navigation.selected;
        runMenuCommand(navigation.command);
      }
    }
  }

  function updatePlaying(dtMs: number, current: GameSession): void {
    if (keyboard.consumePressed('back')) {
      returnToMenu();
      return;
    }
    if (keyboard.consumePressed('pause')) {
      audio.stopMusic();
      goTo('paused');
      return;
    }
    const events = current.advance(dtMs);
    applyGameAudio(audio, events, current.getState());
    if (events.some((event) => event.type === 'gameOver')) {
      finishGame(current.getState());
    }
  }

  function updateScreen(dtMs: number): void {
    switch (screen) {
      case 'pressAnyKey':
        if (keyboard.consumeAnyPressed()) {
          audio.playMusic(KOROBEINIKI);
          goTo('menu');
        }
        return;
      case 'menu':
        updateMenu();
        return;
      case 'controls':
      case 'records':
        if (keyboard.consumePressed('back') || keyboard.consumePressed('confirm')) {
          goTo('menu');
        }
        return;
      case 'playing':
        if (session !== null) {
          updatePlaying(dtMs, session);
        }
        return;
      case 'paused':
        if (keyboard.consumePressed('back')) {
          returnToMenu();
        } else if (keyboard.consumePressed('pause')) {
          audio.playMusic(KOROBEINIKI);
          goTo('playing');
        }
        return;
      case 'gameOver':
        if (keyboard.consumePressed('confirm')) {
          startGame();
        } else if (keyboard.consumePressed('back')) {
          returnToMenu();
        }
        return;
    }
  }

  return {
    update: (dtMs) => {
      if (screen !== 'pressAnyKey' && keyboard.consumePressed('mute')) {
        updatePreferences({ muted: !preferences.muted });
        audio.setMuted(preferences.muted);
      }
      updateScreen(dtMs);
      publish();
    },
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getGameState: () => session?.getState() ?? null,
    patchGame: (patch) => {
      if (session !== null) {
        session.replaceState(applyTestPatch(session.getState(), patch));
        publish();
      }
    },
  };
}

/**
 * Compara dos estados de la interfaz campo a campo.
 * @param a Estado anterior.
 * @param b Estado nuevo.
 * @returns `true` si la interfaz no necesita repintarse.
 */
function snapshotsEqual(a: AppSnapshot, b: AppSnapshot): boolean {
  return (
    a.screen === b.screen &&
    a.menuIndex === b.menuIndex &&
    a.preferences === b.preferences &&
    a.records === b.records &&
    a.lastResult === b.lastResult &&
    hudEqual(a.hud, b.hud)
  );
}

/**
 * Compara dos marcadores.
 * @param a Marcador anterior.
 * @param b Marcador nuevo.
 * @returns `true` si son iguales.
 */
function hudEqual(a: HudData | null, b: HudData | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return (
    a.score === b.score &&
    a.lines === b.lines &&
    a.level === b.level &&
    a.nextPiece === b.nextPiece &&
    a.best === b.best
  );
}
