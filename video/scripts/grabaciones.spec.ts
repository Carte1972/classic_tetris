import { expect, test, type Page } from '@playwright/test';
import type { ActivePiece } from '../../src/engine/types';
import { PREFERENCES_STORAGE_KEY, RECORDS_STORAGE_KEY } from '../../src/config/storage_config';
import type { PlazaEventKind } from '../../src/config/plaza_events_config';
import type { WeatherKind } from '../../src/config/scene_config';
import {
  AutoPlayer,
  Recorder,
  gameState,
  openRecording,
  patchGame,
  runGameFrames,
  setInterfaceHidden,
  setScene,
  startGame,
  tap,
} from './grabacion';
import {
  AUTOPILOT_BUTTON_BOX,
  AUTOPILOT_CLICK_AT,
  CONTROLS_CLIP_SECONDS,
  CONTROL_STEPS,
} from './linea_controles';

// Extractos del juego del guion (video/guion.md), grabados fotograma a fotograma contra el
// build de producción. Cada extracto dura algo más de lo que se usa en el montaje.

/** Tablero de media partida con filas a punto de completarse. */
const MID_GAME_BOARD = [
  '....T.....',
  'J..TTT.OO.',
  'JJJLLLLOO.',
  'SSZZOOJTT.',
  'ISSZZJJTTL',
  'IOOTTTZZLL',
];

/** Tablero con un hueco de 4 filas en la última columna, para una limpieza de 4 líneas. */
const TETRIS_BOARD = [
  '....T.....',
  '..TTT..O..',
  'LLLLOOJJJ.',
  'SSZZOOJTT.',
  'ISSZZJJTT.',
  'TTTOOZZLL.',
];

/** Dos filas a falta de la última columna: una I vertical completa el objetivo del nivel. */
const GOAL_BOARD = ['.......O..', 'LLLLOOJJJ.', 'SSZZOOJTT.'];

/** Tablero casi lleno: la siguiente pieza ya no cabe. */
const FULL_BOARD = Array.from({ length: 17 }, (_, i) =>
  i % 3 === 0 ? 'OOOO.OOOOO' : 'OOOOOOOOO.',
);

/**
 * Récords de ejemplo para la pantalla RÉCORDS (coherentes con los objetivos de nivel), con
 * nombres en español y en ruso.
 */
const SAMPLE_RECORDS = [
  { name: 'ПЁТР', score: 148_620, lines: 262, level: 12, date: '2026-09-28' },
  { name: 'ANA', score: 121_340, lines: 231, level: 11, date: '2026-09-30' },
  { name: 'НАТАША', score: 96_880, lines: 197, level: 10, date: '2026-09-21' },
  { name: 'LUIS', score: 74_150, lines: 168, level: 9, date: '2026-09-25' },
  { name: 'ИВАН', score: 58_420, lines: 139, level: 8, date: '2026-09-18' },
  { name: 'CARMEN', score: 41_960, lines: 113, level: 7, date: '2026-09-12' },
  { name: 'ОЛЬГА', score: 29_310, lines: 88, level: 6, date: '2026-09-15' },
  { name: 'JAVI', score: 18_740, lines: 71, level: 5, date: '2026-09-09' },
  { name: 'МИША', score: 9_820, lines: 41, level: 3, date: '2026-09-04' },
  { name: 'LUCÍA', score: 4_160, lines: 26, level: 2, date: '2026-09-01' },
];

/** Los récords de ejemplo guardados, como los encuentra el juego al abrirse. */
const STORED_RECORDS = { [RECORDS_STORAGE_KEY]: JSON.stringify(SAMPLE_RECORDS) };

/**
 * Preferencias con las celebraciones desactivadas: en las partidas grabadas no puede
 * salir ningún bailarín (solo el cosaco del adelanto). Si se supera un nivel, sale solo el
 * rótulo «¡NIVEL N!».
 */
const NO_CELEBRATIONS = {
  [PREFERENCES_STORAGE_KEY]: JSON.stringify({
    startLevel: 0,
    musicEnabled: true,
    celebrationsEnabled: false,
    muted: false,
  }),
};

/** Evento de la plaza grabado con su hora y su tiempo. */
interface EventClip {
  readonly file: string;
  readonly event: PlazaEventKind;
  readonly elapsedMs: number;
  readonly timeOfDay: number;
  readonly weather: WeatherKind;
  readonly snowCover: number;
}

/** Los seis eventos, en el orden del montaje. */
const EVENT_CLIPS: readonly EventClip[] = [
  {
    file: 'extracto_evento_desfile',
    event: 'parade',
    elapsedMs: 38_000,
    timeOfDay: 0.42,
    weather: 'clear',
    snowCover: 0,
  },
  {
    file: 'extracto_evento_pascua',
    event: 'easter',
    elapsedMs: 33_000,
    timeOfDay: 0.88,
    weather: 'clear',
    snowCover: 0,
  },
  {
    file: 'extracto_evento_navidad',
    event: 'christmas',
    elapsedMs: 28_000,
    timeOfDay: 0.88,
    weather: 'snow',
    snowCover: 1,
  },
  {
    file: 'extracto_evento_fuegos',
    event: 'fireworks',
    elapsedMs: 28_000,
    timeOfDay: 0.9,
    weather: 'clear',
    snowCover: 0,
  },
  {
    file: 'extracto_evento_maslenitsa',
    event: 'maslenitsa',
    elapsedMs: 377_000,
    timeOfDay: 0.42,
    weather: 'clear',
    snowCover: 0.85,
  },
  {
    file: 'extracto_evento_olimpiadas',
    event: 'olympics',
    elapsedMs: 18_000,
    timeOfDay: 0.42,
    weather: 'clear',
    snowCover: 0,
  },
];

/**
 * Plaza limpia: oculta la interfaz y fija la hora y el tiempo, sin evento.
 * @param page Página.
 * @param timeOfDay Momento del día.
 */
async function cleanPlaza(page: Page, timeOfDay: number): Promise<void> {
  await setInterfaceHidden(page, true);
  await setScene(page, { timeOfDay, weather: 'clear', snowCover: 0, wetness: 0, event: null });
}

/**
 * Interpolación lineal limitada a [0, 1].
 * @param from Valor inicial.
 * @param to Valor final.
 * @param t Fracción.
 * @returns Valor.
 */
function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * Math.min(1, Math.max(0, t));
}

test.describe.configure({ mode: 'serial' });

// Ventana de 1280 × 720 (la de referencia del juego) con densidad 1,5: los fotogramas
// salen a 1920 × 1080 con la misma composición que en una pantalla normal, el pixel-art a
// múltiplos enteros (plaza × 3, pozo × 6) y los textos de los menús nítidos.
test.use({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });

test('extracto_plaza_titulo: plaza limpia de día', async ({ page }) => {
  await openRecording(page);
  await cleanPlaza(page, 0.42);
  const recorder = new Recorder(page, 'extracto_plaza_titulo');
  await recorder.record(8);
  recorder.finish();
});

test('extracto_plaza_dia_noche: amanecer, día y atardecer; después día, lluvia y nieve', async ({
  page,
}) => {
  await openRecording(page);
  await cleanPlaza(page, 0.19);
  const recorder = new Recorder(page, 'extracto_plaza_dia_noche');
  await recorder.record(40, async () => {
    const s = recorder.seconds;
    if (s < 24) {
      // Tramo lento (escena 2): amanecer, día y atardecer.
      const timeOfDay =
        s < 9
          ? lerp(0.19, 0.27, s / 9)
          : s < 11
            ? lerp(0.27, 0.45, (s - 9) / 2)
            : s < 16
              ? lerp(0.45, 0.5, (s - 11) / 5)
              : s < 18
                ? lerp(0.5, 0.7, (s - 16) / 2)
                : lerp(0.7, 0.76, (s - 18) / 6);
      await setScene(page, { timeOfDay });
      return;
    }
    // Tramo rápido (escena 5): del día a la noche, con lluvia y después nieve.
    const timeOfDay = lerp(0.45, 0.95, (s - 24) / 6);
    if (s < 25.5) {
      await setScene(page, { timeOfDay, weather: 'clear', snowCover: 0, wetness: 0 });
    } else if (s < 27.5) {
      await setScene(page, {
        timeOfDay,
        weather: 'rain',
        snowCover: 0,
        wetness: lerp(0, 0.9, (s - 25.5) / 2),
      });
    } else {
      await setScene(page, {
        timeOfDay,
        weather: 'snow',
        snowCover: lerp(0, 1, (s - 27.5) / 2.5),
        wetness: 0,
      });
    }
  });
  recorder.finish();
});

test('extracto_partida_en_curso: partida de nivel 1 con el jugador automático', async ({
  page,
}) => {
  await openRecording(page, NO_CELEBRATIONS);
  await startGame(page, 1);
  await patchGame(page, { boardRows: MID_GAME_BOARD, score: 1_840, lines: 4, levelLines: 4 });
  const recorder = new Recorder(page, 'extracto_partida_en_curso');
  const player = new AutoPlayer(page, recorder);
  await recorder.record(25, () => player.step());
  recorder.finish();
});

test('extracto_limpieza_4_lineas: una I limpia 4 líneas a la vez', async ({ page }) => {
  await openRecording(page, NO_CELEBRATIONS);
  await startGame(page, 5);
  await patchGame(page, {
    boardRows: TETRIS_BOARD,
    activePiece: { type: 'I', rotation: 1, x: 9, y: 4 },
    nextPiece: 'L',
    score: 9_120,
    lines: 51,
    level: 5,
    levelLines: 2,
    levelGoal: 14,
  });
  const recorder = new Recorder(page, 'extracto_limpieza_4_lineas');
  await recorder.record(8, async (frame) => {
    if (frame === 30) {
      await recorder.key('ArrowDown', 'down');
    }
    if (frame === 70) {
      await recorder.key('ArrowDown', 'up');
    }
  });
  recorder.finish();
});

test('extracto_fin_partida: la pila llega arriba y se acaba la partida', async ({ page }) => {
  // Con los récords de ejemplo la partida no entra en el ranking, así que sale directamente
  // FIN DE LA PARTIDA en vez del formulario del nombre.
  await openRecording(page, { ...NO_CELEBRATIONS, ...STORED_RECORDS });
  await startGame(page, 0);
  await patchGame(page, {
    boardRows: FULL_BOARD,
    activePiece: { type: 'O', rotation: 0, x: 4, y: 0 },
    score: 2_840,
    lines: 7,
    level: 0,
    levelLines: 7,
    levelGoal: 10,
  });
  const recorder = new Recorder(page, 'extracto_fin_partida');
  await recorder.record(8);
  recorder.finish();
});

test('extracto_objetivo_nivel: se cumple el objetivo y empieza el nivel 2 vacío', async ({
  page,
}) => {
  // Celebraciones desactivadas: sale solo el rótulo «¡NIVEL 2!», sin bailarines.
  await openRecording(page, {
    [PREFERENCES_STORAGE_KEY]: JSON.stringify({
      startLevel: 1,
      musicEnabled: true,
      celebrationsEnabled: false,
      muted: false,
    }),
  });
  await startGame(page, 0);
  await patchGame(page, {
    boardRows: GOAL_BOARD,
    activePiece: { type: 'I', rotation: 1, x: 9, y: 4 },
    nextPiece: 'T',
    score: 2_960,
    lines: 8,
    levelLines: 8,
    levelGoal: 10,
  });
  const recorder = new Recorder(page, 'extracto_objetivo_nivel');
  const player = new AutoPlayer(page, recorder);
  // La I cae sola por la última columna y, a los 6 s, baja de golpe: completa las dos
  // filas (8 / 10 → 10 / 10). Ya en el nivel 2, juega el jugador automático.
  let dropped = false;
  let released = false;
  await recorder.record(18, async () => {
    if (!dropped && recorder.seconds >= 6) {
      dropped = true;
      await recorder.key('ArrowDown', 'down');
      return;
    }
    const state = await gameState(page);
    if (dropped && !released && state?.phase !== 'falling') {
      released = true;
      await recorder.key('ArrowDown', 'up');
      return;
    }
    if (released && (state?.level ?? 0) >= 2) {
      await player.step();
    }
  });
  recorder.finish();
});

test('extracto_nivel_15: partida rápida sin vista previa', async ({ page }) => {
  await openRecording(page, NO_CELEBRATIONS);
  await startGame(page, 9);
  await patchGame(page, {
    boardRows: MID_GAME_BOARD.slice(2),
    activePiece: { type: 'T', rotation: 0, x: 5, y: 2 },
    score: 312_480,
    lines: 438,
    level: 15,
    levelLines: 11,
    levelGoal: 22,
  });
  const recorder = new Recorder(page, 'extracto_nivel_15');
  const player = new AutoPlayer(page, recorder);
  await recorder.record(10, () => player.step());
  recorder.finish();
});

test('extracto_controles: cada tecla en acción', async ({ page }) => {
  await openRecording(page, NO_CELEBRATIONS);
  await startGame(page, 0);
  await patchGame(page, {
    boardRows: MID_GAME_BOARD.slice(3),
    activePiece: { type: 'T', rotation: 0, x: 5, y: 3 },
    nextPiece: 'L',
  });
  const button = page.getByRole('button', { name: /PILOTO AUTOMÁTICO/ });
  // El rótulo señala el botón con un recuadro fijo: tiene que estar donde se espera.
  const box = await button.boundingBox();
  const device = 1.5;
  expect(Math.round((box?.x ?? 0) * device)).toBe(AUTOPILOT_BUTTON_BOX.x);
  expect(Math.round((box?.y ?? 0) * device)).toBe(AUTOPILOT_BUTTON_BOX.y);
  expect(Math.round((box?.width ?? 0) * device)).toBe(AUTOPILOT_BUTTON_BOX.width);
  expect(Math.round((box?.height ?? 0) * device)).toBe(AUTOPILOT_BUTTON_BOX.height);
  const recorder = new Recorder(page, 'extracto_controles');
  const pending = [...CONTROL_STEPS];
  const releases: { at: number; key: string }[] = [];
  let piloting = false;
  let lastPiece: ActivePiece | null = null;
  await recorder.record(CONTROLS_CLIP_SECONDS, async () => {
    const now = recorder.seconds;
    if (!piloting && now >= AUTOPILOT_CLICK_AT) {
      piloting = true;
      recorder.mark('piloto');
      await button.click();
    }
    if (piloting) {
      // El piloto no pulsa teclas: los movimientos y giros se anotan al verlos, para que
      // el montaje ponga sus efectos de sonido.
      const piece = (await gameState(page))?.activePiece ?? null;
      // Misma pieza: mismo tipo y no ha vuelto arriba (una nueva aparece en la fila 2).
      const samePiece =
        piece !== null &&
        lastPiece !== null &&
        piece.type === lastPiece.type &&
        piece.y >= lastPiece.y;
      if (samePiece && piece.x !== lastPiece?.x) {
        recorder.mark('move');
      }
      if (samePiece && piece.rotation !== lastPiece?.rotation) {
        recorder.mark('rotate');
      }
      lastPiece = piece;
    }
    while (pending[0] !== undefined && pending[0].at <= now) {
      const step = pending.shift();
      if (step === undefined) {
        break;
      }
      if (step.hold !== undefined) {
        await recorder.key(step.key, 'down');
        releases.push({ at: step.at + step.hold, key: step.key });
      } else {
        await recorder.key(step.key);
      }
    }
    for (const release of releases.filter((r) => r.at <= now)) {
      await recorder.key(release.key, 'up');
      releases.splice(releases.indexOf(release), 1);
    }
  });
  recorder.finish();
});

for (const clip of EVENT_CLIPS) {
  test(`${clip.file}: ${clip.event} en la plaza limpia`, async ({ page }) => {
    await openRecording(page);
    await setInterfaceHidden(page, true);
    await setScene(page, {
      event: clip.event,
      eventElapsedMs: clip.elapsedMs,
      timeOfDay: clip.timeOfDay,
      weather: clip.weather,
      snowCover: clip.snowCover,
      wetness: 0,
    });
    await runGameFrames(page, 2);
    const recorder = new Recorder(page, clip.file);
    await recorder.record(5);
    recorder.finish();
  });
}

test('extracto_baile_cosaco: se supera el nivel 1 y baila el cosaco', async ({ page }) => {
  await openRecording(page);
  await startGame(page, 0);
  await patchGame(page, {
    boardRows: ['OOOOOOOOO.'],
    levelLines: 9,
    levelGoal: 10,
    score: 3_480,
    lines: 9,
    activePiece: { type: 'I', rotation: 1, x: 9, y: 8 },
  });
  const recorder = new Recorder(page, 'extracto_baile_cosaco');
  await recorder.record(9, async (frame) => {
    if (frame === 20) {
      await recorder.key('ArrowDown', 'down');
    }
    if (frame === 60) {
      await recorder.key('ArrowDown', 'up');
    }
  });
  recorder.finish();
});

test('extracto_records: pantalla RÉCORDS con un top 10 de ejemplo', async ({ page }) => {
  await openRecording(page, STORED_RECORDS);
  await tap(page, 'Space');
  await tap(page, 'ArrowUp');
  await tap(page, 'Enter');
  const recorder = new Recorder(page, 'extracto_records');
  await recorder.record(12);
  recorder.finish();
});

test('extracto_cierre_plaza: anochece y se encienden las farolas', async ({ page }) => {
  await openRecording(page);
  await cleanPlaza(page, 0.72);
  const recorder = new Recorder(page, 'extracto_cierre_plaza');
  await recorder.record(10, () =>
    setScene(page, { timeOfDay: lerp(0.72, 0.8, recorder.seconds / 10) }),
  );
  recorder.finish();
});
