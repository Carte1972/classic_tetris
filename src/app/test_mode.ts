import { BOARD_COLUMNS, TOTAL_ROWS } from '../config/board_config';
import { PIECE_TYPES } from '../config/tetromino_config';
import { createEmptyRow } from '../engine/board';
import type { ActivePiece, Board, BoardRow, GameState, PieceType } from '../engine/types';

/** Opciones del modo test leídas de la URL. */
export interface TestOptions {
  /** Semilla fija del generador (`?seed=N`), o `null` para partidas aleatorias. */
  readonly seed: number | null;
  /** Si se expone `window.__bloques` para preparar estados (`?test=1`). */
  readonly testApi: boolean;
}

/** Cambios que el modo test puede aplicar a una partida en curso. */
export interface TestGamePatch {
  /** Filas inferiores del tablero como texto: `.` hueco y letra de pieza para un bloque. */
  readonly boardRows?: readonly string[];
  readonly activePiece?: ActivePiece | null;
  readonly nextPiece?: PieceType;
  readonly score?: number;
  readonly lines?: number;
  readonly level?: number;
}

/** Formato de una semilla válida en la URL. */
const SEED_PATTERN = /^\d+$/;

/**
 * Lee las opciones del modo test de la cadena de búsqueda de la URL.
 * @param search Parte `?…` de la URL.
 * @returns Opciones del modo test.
 */
export function parseTestOptions(search: string): TestOptions {
  const params = new URLSearchParams(search);
  const seed = params.get('seed');
  return {
    seed: seed !== null && SEED_PATTERN.test(seed) ? Number(seed) : null,
    testApi: params.get('test') === '1',
  };
}

/**
 * Construye un tablero a partir de sus filas inferiores escritas como texto.
 * @param rows Filas de arriba abajo; la última es la del fondo.
 * @returns Tablero completo de 22 filas.
 */
export function boardFromRows(rows: readonly string[]): Board {
  if (rows.length > TOTAL_ROWS) {
    throw new RangeError(`Demasiadas filas: ${rows.length}`);
  }
  const parsed = rows.map(parseRow);
  return [...Array.from({ length: TOTAL_ROWS - rows.length }, createEmptyRow), ...parsed];
}

/**
 * Aplica un parche del modo test a un estado del motor. Si se fija una pieza activa, la
 * partida pasa a la fase de caída (aunque estuviera en el retardo de entrada o limpiando
 * líneas) para que esa pieza no se sustituya.
 * @param state Estado actual.
 * @param patch Cambios a aplicar.
 * @returns Nuevo estado.
 */
export function applyTestPatch(state: GameState, patch: TestGamePatch): GameState {
  const falling: Partial<GameState> =
    patch.activePiece === undefined || patch.activePiece === null
      ? {}
      : {
          phase: 'falling',
          clearingRows: [],
          phaseFramesRemaining: 0,
          phaseFramesTotal: 0,
          gravityFrames: 0,
          softDropFrames: 0,
        };
  return {
    ...state,
    ...falling,
    ...(patch.boardRows === undefined ? {} : { board: boardFromRows(patch.boardRows) }),
    ...(patch.activePiece === undefined ? {} : { activePiece: patch.activePiece }),
    ...(patch.nextPiece === undefined ? {} : { nextPiece: patch.nextPiece }),
    ...(patch.score === undefined ? {} : { score: patch.score }),
    ...(patch.lines === undefined ? {} : { lines: patch.lines }),
    ...(patch.level === undefined ? {} : { level: patch.level }),
  };
}

/**
 * Convierte una fila de texto en una fila del tablero.
 * @param text Fila de 10 caracteres.
 * @returns La fila.
 */
function parseRow(text: string): BoardRow {
  if (text.length !== BOARD_COLUMNS) {
    throw new RangeError(`La fila debe tener ${BOARD_COLUMNS} caracteres: "${text}"`);
  }
  return [...text].map((char) => {
    if (char === '.') {
      return null;
    }
    const piece = PIECE_TYPES.find((type) => type === char);
    if (piece === undefined) {
      throw new RangeError(`Carácter de fila no válido: "${char}"`);
    }
    return piece;
  });
}
