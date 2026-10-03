import type { AudioEngine } from '../audio/audio_engine';
import { KALINKA } from '../audio/songs/kalinka';
import { KOROBEINIKI } from '../audio/songs/korobeiniki';
import {
  advanceCelebration,
  isCelebrationFinished,
  seekCelebration,
  skipCelebration,
  getPerformer,
  startCelebration,
  type CelebrationKind,
  type CelebrationState,
} from '../celebration/celebration_state';
import { isNextPieceVisible } from '../engine/difficulty';
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
  | 'pressAnyKey'
  | 'menu'
  | 'controls'
  | 'records'
  | 'playing'
  | 'paused'
  | 'celebrating'
  | 'gameOver';

/** Datos del marcador durante la partida. */
export interface HudData {
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  readonly nextPiece: PieceType;
  /** Si se muestra la siguiente pieza (en niveles altos se oculta). */
  readonly nextVisible: boolean;
  /** Líneas completadas en el nivel actual. */
  readonly levelLines: number;
  /** Líneas que pide el nivel actual. */
  readonly levelGoal: number;
  /**
   * Mejor puntuación conocida, incluida la partida en curso salvo si ha usado el piloto
   * automático (entonces solo cuentan los récords guardados).
   */
  readonly best: number;
}

/** Resultado de la última partida terminada. */
export interface GameResult {
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  /** Posición en el top 10 (0 = nuevo récord), o `null` si no entra. */
  readonly rank: number | null;
  /** Si el piloto automático se activó en algún momento (la partida no cuenta para récords). */
  readonly autopilotUsed: boolean;
}

/** Lo que la interfaz necesita para pintarse. Cambia de identidad solo si cambia algo. */
export interface AppSnapshot {
  readonly screen: ScreenName;
  readonly menuIndex: number;
  readonly preferences: Preferences;
  readonly records: readonly RecordEntry[];
  readonly hud: HudData | null;
  readonly lastResult: GameResult | null;
  /** Nivel que se está celebrando, o `null` si no hay celebración. */
  readonly celebrationLevel: number | null;
  /** Si la celebración tiene baile o es solo el rótulo del nivel. */
  readonly celebrationKind: CelebrationKind | null;
  /** Bailarín y lugar de la celebración (p. ej. "EL COSACO EN LA ESTEPA"), o `null`. */
  readonly celebrationCaption: string | null;
  /** Si el piloto automático está activo. */
  readonly autopilotEnabled: boolean;
}

/** Parte del motor de audio que usa la aplicación. */
export type AppAudio = Pick<
  AudioEngine,
  | 'playMusic'
  | 'stopMusic'
  | 'pauseMusic'
  | 'resumeMusic'
  | 'playSfx'
  | 'setTempoMultiplier'
  | 'setMusicEnabled'
  | 'setMuted'
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
  /** Celebración en curso, o `null`. */
  readonly getCelebration: () => CelebrationState | null;
  /** Modifica la partida en curso (solo para el modo test). */
  readonly patchGame: (patch: TestGamePatch) => void;
  /**
   * Congela la celebración en curso en un instante (solo para el modo test y las
   * capturas); con `null` vuelve a avanzar con normalidad.
   */
  readonly freezeCelebration: (elapsedMs: number | null) => void;
  /**
   * Activa o desactiva el piloto automático (lo llama el botón de la pantalla de partida).
   * Solo tiene efecto en las pantallas de partida.
   */
  readonly toggleAutopilot: () => void;
}

/** Pantallas de partida, las únicas donde se puede activar o desactivar el piloto. */
const GAME_SCREENS: ReadonlySet<ScreenName> = new Set([
  'playing',
  'paused',
  'celebrating',
  'gameOver',
]);

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
  let celebration: CelebrationState | null = null;
  let celebrationFrozen = false;
  // El piloto dura lo que la sesión de la aplicación (no se guarda); `autopilotUsed` es de
  // la partida en curso.
  let autopilotEnabled = false;
  let autopilotUsed = false;
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
      celebrationLevel: celebration?.level ?? null,
      celebrationKind: celebration?.kind ?? null,
      celebrationCaption: celebration === null ? null : describeCelebration(celebration),
      autopilotEnabled,
      hud:
        state === null
          ? null
          : {
              score: state.score,
              lines: state.lines,
              level: state.level,
              nextPiece: state.nextPiece,
              nextVisible: isNextPieceVisible(state.level),
              levelLines: state.levelLines,
              levelGoal: state.levelGoal,
              best: autopilotUsed
                ? (records[0]?.score ?? 0)
                : Math.max(records[0]?.score ?? 0, state.score),
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
      autopilotEnabled,
    );
    autopilotUsed = autopilotEnabled;
    lastResult = null;
    audio.setTempoMultiplier(1);
    audio.playMusic(KOROBEINIKI);
    goTo('playing');
  }

  function returnToMenu(): void {
    session = null;
    celebration = null;
    audio.setTempoMultiplier(1);
    audio.playMusic(KOROBEINIKI);
    goTo('menu');
  }

  function finishGame(state: GameState): void {
    if (autopilotUsed) {
      lastResult = {
        score: state.score,
        lines: state.lines,
        level: state.level,
        rank: null,
        autopilotUsed: true,
      };
      goTo('gameOver');
      return;
    }
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
      autopilotUsed: false,
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
      audio.pauseMusic();
      goTo('paused');
      return;
    }
    const events = current.advance(dtMs);
    applyGameAudio(audio, events, current.getState());
    if (events.some((event) => event.type === 'gameOver')) {
      finishGame(current.getState());
      return;
    }
    const levelUp = events.find((event) => event.type === 'levelUp');
    if (levelUp !== undefined) {
      startLevelTransition(levelUp.level, current.getState().startLevel);
    }
  }

  function startLevelTransition(level: number, startLevel: number): void {
    const dance = preferences.celebrationsEnabled;
    celebration = startCelebration({ level, levelsCompleted: level - startLevel, dance });
    celebrationFrozen = false;
    if (dance) {
      audio.pauseMusic();
      audio.setTempoMultiplier(1);
      audio.playMusic(KALINKA);
    }
    goTo('celebrating');
  }

  function endLevelTransition(finished: CelebrationState): void {
    celebration = null;
    session?.startNextLevel();
    if (finished.kind === 'dance') {
      audio.resumeMusic();
    }
    goTo('playing');
  }

  function updateCelebrating(dtMs: number, current: CelebrationState): void {
    if (keyboard.consumePressed('back')) {
      returnToMenu();
      return;
    }
    const next = keyboard.consumePressed('skip')
      ? skipCelebration(current)
      : celebrationFrozen
        ? current
        : advanceCelebration(current, dtMs);
    celebration = next;
    if (isCelebrationFinished(next)) {
      endLevelTransition(next);
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
      case 'celebrating':
        if (celebration !== null) {
          updateCelebrating(dtMs, celebration);
        }
        return;
      case 'paused':
        if (keyboard.consumePressed('back')) {
          returnToMenu();
        } else if (keyboard.consumePressed('pause')) {
          audio.resumeMusic();
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
    getCelebration: () => celebration,
    patchGame: (patch) => {
      if (session !== null) {
        session.replaceState(applyTestPatch(session.getState(), patch));
        publish();
      }
    },
    freezeCelebration: (elapsedMs) => {
      celebrationFrozen = elapsedMs !== null;
      if (celebration !== null && elapsedMs !== null) {
        celebration = seekCelebration(celebration, elapsedMs);
      }
    },
    toggleAutopilot: () => {
      if (!GAME_SCREENS.has(screen)) {
        return;
      }
      autopilotEnabled = !autopilotEnabled;
      session?.setAutopilot(autopilotEnabled);
      // En game over la partida ya ha terminado: activarlo solo afecta a la siguiente.
      if (autopilotEnabled && screen !== 'gameOver') {
        autopilotUsed = true;
      }
      publish();
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
    a.celebrationLevel === b.celebrationLevel &&
    a.celebrationKind === b.celebrationKind &&
    a.celebrationCaption === b.celebrationCaption &&
    a.autopilotEnabled === b.autopilotEnabled &&
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
    a.nextVisible === b.nextVisible &&
    a.levelLines === b.levelLines &&
    a.levelGoal === b.levelGoal &&
    a.best === b.best
  );
}

/**
 * Texto con el bailarín y el lugar de una celebración con baile.
 * @param celebration Celebración.
 * @returns El texto, o `null` si es solo el rótulo del nivel.
 */
function describeCelebration(celebration: CelebrationState): string | null {
  if (celebration.kind !== 'dance') {
    return null;
  }
  const performer = getPerformer(celebration);
  return `${performer.dancer.name} ${performer.stage.place}`;
}
