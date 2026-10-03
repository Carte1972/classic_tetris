import { describe, expect, it } from 'vitest';
import {
  evaluatePlacement,
  findBestPlacement,
  generatePlacements,
  getColumnTransitions,
  getCumulativeWells,
  getErodedPieceCells,
  getHoles,
  getLandingHeight,
  getRowTransitions,
  type Placement,
} from '../../../src/ai/dellacherie';
import { boardFromRows } from '../../../src/app/test_mode';
import { DELLACHERIE_WEIGHTS } from '../../../src/config/autopilot_config';
import { findFullRows, lockPiece, removeRows } from '../../../src/engine/board';
import { collides } from '../../../src/engine/collision';
import { createInitialState } from '../../../src/engine/game_state';
import { createSpawnPiece } from '../../../src/engine/tetrominoes';
import type { ActivePiece, Board } from '../../../src/engine/types';
import { REAL_BOARDS, SEED_2026_PIECE_25, SEED_42_PIECE_9 } from './fixtures';

/** Cuatro filas completas salvo la columna derecha: pozo listo para una I vertical. */
const TETRIS_STACK = ['LLLJJJOOI.', 'LSSZZJOOI.', 'SSOOZZJJI.', 'ZZOOLLLJI.'];

/**
 * Tablero real de fin de partida (el de `forceGameOver` en los e2e): las 20 filas visibles
 * llenas salvo la última columna, de modo que la pieza que aparece ya choca.
 */
const GAME_OVER_ROWS = Array.from({ length: 20 }, () => 'OOOOOOOOO.');

/**
 * Busca una colocación concreta entre las alcanzables.
 * @param board Tablero.
 * @param piece Pieza activa.
 * @param rotation Orientación final.
 * @param x Columna final del pivote.
 * @returns La colocación.
 */
function placementAt(board: Board, piece: ActivePiece, rotation: number, x: number): Placement {
  const found = generatePlacements(board, piece).find((p) => p.rotation === rotation && p.x === x);
  if (found === undefined) {
    throw new Error(`No se llega a la orientación ${rotation} en la columna ${x}`);
  }
  return found;
}

/**
 * Tablero tras fijar una pieza y borrar las líneas completas.
 * @param board Tablero antes de fijar.
 * @param landed Pieza ya caída.
 * @returns Tablero resultante.
 */
function boardAfter(board: Board, landed: ActivePiece): Board {
  const locked = lockPiece(board, landed);
  return removeRows(locked, findFullRows(locked));
}

describe('métricas sobre tableros reales', () => {
  it('una pila escalonada sin huecos (semilla 2026, pieza 25) tiene 0 huecos', () => {
    // Bajo el bloque más alto de cada columna todas las celdas están ocupadas.
    expect(getHoles(boardFromRows(SEED_2026_PIECE_25.rows))).toBe(0);
  });

  it('la S mal colocada (semilla 42, pieza 9) deja 2 huecos y 14 transiciones de columnas', () => {
    const board = boardFromRows(SEED_42_PIECE_9.rows);
    // Columnas 2 y 3: la S tapa la celda del fondo de cada una.
    expect(getHoles(board)).toBe(2);
    // Cada columna cuenta 1 transición (vacío → bloque o suelo), salvo la 2 y la 3, que
    // cuentan 3: vacío → S, S → hueco y hueco → suelo. 8 × 1 + 2 × 3 = 14.
    expect(getColumnTransitions(board)).toBe(14);
  });

  it('cuenta las transiciones de filas con las paredes como ocupadas', () => {
    const board = boardFromRows(SEED_42_PIECE_9.rows);
    // 19 filas vacías × 2 (pared → vacío → pared) = 38; "..S......." = 4,
    // "OOSS......" = 2 y "OO..SSJSS." = 4. Total: 48.
    expect(getRowTransitions(board)).toBe(48);
  });

  it('el pozo de la columna derecha, de 4 de profundidad, suma 1 + 2 + 3 + 4 = 10', () => {
    expect(getCumulativeWells(boardFromRows(TETRIS_STACK))).toBe(10);
    // En la S mal colocada solo es pozo la celda del fondo de la columna 9 (S a la
    // izquierda, pared a la derecha): 1.
    expect(getCumulativeWells(boardFromRows(SEED_42_PIECE_9.rows))).toBe(1);
  });

  it('altura de aterrizaje de una I horizontal y una I vertical sobre la misma pila', () => {
    const board = boardFromRows(SEED_2026_PIECE_25.rows);
    const spawn = createSpawnPiece('I');
    // Horizontal en las columnas 0–3: se apoya en la S de la columna 3 (fila 20) y queda en
    // la fila 19, altura 22 − 19 = 3.
    expect(getLandingHeight(placementAt(board, spawn, 0, 2).landed)).toBe(3);
    // Vertical en la columna 0, vacía: filas 18–21, alturas 4 a 1; media (1 + 4) / 2.
    expect(getLandingHeight(placementAt(board, spawn, 1, 0).landed)).toBe(2.5);
  });

  it('celdas erosionadas al completar 1, 2 y 4 líneas', () => {
    // I horizontal en las 4 columnas libres de la fila del fondo: 1 línea × 4 celdas.
    const one = boardFromRows(['OOOOOO....', 'OOOOOO....']);
    expect(getErodedPieceCells(one, placementAt(one, createSpawnPiece('I'), 0, 8).landed)).toBe(4);
    // O en el hueco de 2 × 2 de la derecha: 2 líneas × 4 celdas.
    const two = boardFromRows(['OOOOOOOO..', 'OOOOOOOO..']);
    expect(getErodedPieceCells(two, placementAt(two, createSpawnPiece('O'), 0, 9).landed)).toBe(8);
    // I vertical en el pozo: 4 líneas × 4 celdas.
    const four = boardFromRows(TETRIS_STACK);
    expect(getErodedPieceCells(four, placementAt(four, createSpawnPiece('I'), 1, 9).landed)).toBe(
      16,
    );
    // Sin líneas, 0.
    expect(getErodedPieceCells(four, placementAt(four, createSpawnPiece('I'), 1, 0).landed)).toBe(
      0,
    );
  });

  it('evaluatePlacement aplica los pesos de Dellacherie', () => {
    const board = boardFromRows(TETRIS_STACK);
    const landed = placementAt(board, createSpawnPiece('I'), 1, 9).landed;
    // Altura 2,5; erosión 16; tablero vacío después: 22 × 2 transiciones de filas, 10 de
    // columnas (una por columna, contra el suelo), sin huecos ni pozos.
    expect(evaluatePlacement(board, landed)).toBe(-2.5 + 16 - 44 - 10);
  });

  it('evaluatePlacement coincide con la suma ponderada de las métricas en tableros reales', () => {
    for (const fixture of REAL_BOARDS) {
      const board = boardFromRows(fixture.rows);
      for (const { landed } of generatePlacements(board, createSpawnPiece(fixture.pieceType))) {
        const after = boardAfter(board, landed);
        const expected =
          DELLACHERIE_WEIGHTS.landingHeight * getLandingHeight(landed) +
          DELLACHERIE_WEIGHTS.erodedPieceCells * getErodedPieceCells(board, landed) +
          DELLACHERIE_WEIGHTS.rowTransitions * getRowTransitions(after) +
          DELLACHERIE_WEIGHTS.columnTransitions * getColumnTransitions(after) +
          DELLACHERIE_WEIGHTS.holes * getHoles(after) +
          DELLACHERIE_WEIGHTS.cumulativeWells * getCumulativeWells(after);
        expect(evaluatePlacement(board, landed)).toBe(expected);
      }
    }
  });
});

describe('generatePlacements', () => {
  it('en el tablero vacío, la T recién aparecida tiene 8 + 9 + 8 + 9 = 34 colocaciones', () => {
    const placements = generatePlacements(boardFromRows([]), createSpawnPiece('T'));
    expect(placements).toHaveLength(34);
    expect(placements.filter((p) => p.rotation === 1)).toHaveLength(9);
  });

  it('cuenta los giros por el camino más corto: la T llega a la orientación 3 con un giro antihorario', () => {
    const placements = generatePlacements(boardFromRows([]), createSpawnPiece('T'));
    expect(placements.find((p) => p.rotation === 3)).toMatchObject({
      rotationSteps: 1,
      rotationDirection: -1,
    });
    expect(placements.find((p) => p.rotation === 2)?.rotationSteps).toBe(2);
  });

  it('junto a la pared, la orientación que pide un wall kick no aparece', () => {
    const board = boardFromRows(SEED_2026_PIECE_25.rows);
    // I vertical pegada a la pared derecha: tumbarla ocuparía las columnas 7–10 y se sale.
    const atWall: ActivePiece = { type: 'I', rotation: 1, x: 9, y: 10 };
    const placements = generatePlacements(board, atWall);
    expect(placements.every((p) => p.rotation === 1)).toBe(true);
    expect(placements).toHaveLength(10);
    // Una columna más a la izquierda sí puede tumbarse.
    const inside: ActivePiece = { ...atWall, x: 8 };
    expect(generatePlacements(board, inside).some((p) => p.rotation === 0)).toBe(true);
  });

  it('ninguna colocación choca y todas están apoyadas', () => {
    for (const fixture of REAL_BOARDS) {
      const board = boardFromRows(fixture.rows);
      for (const { landed } of generatePlacements(board, createSpawnPiece(fixture.pieceType))) {
        expect(collides(board, landed)).toBe(false);
        expect(collides(board, { ...landed, y: landed.y + 1 })).toBe(true);
      }
    }
  });

  it('si la pieza ya choca no hay colocaciones', () => {
    expect(generatePlacements(boardFromRows(GAME_OVER_ROWS), createSpawnPiece('O'))).toEqual([]);
  });
});

describe('findBestPlacement', () => {
  it('con 4 filas completas salvo la columna derecha, mete la I vertical y hace 4 líneas', () => {
    const board = boardFromRows(TETRIS_STACK);
    const choice = findBestPlacement(board, createSpawnPiece('I'));
    expect(choice).toMatchObject({ rotation: 1, x: 9, landed: { type: 'I', rotation: 1, x: 9 } });
    expect(choice && findFullRows(lockPiece(board, choice.landed))).toHaveLength(4);
  });

  it('prefiere completar la línea a dejar un hueco', () => {
    // La S solo cabe sin dejar hueco de pie en el escalón de la columna 3, donde además
    // completa la fila del fondo; tumbada o en otro sitio siempre tapa alguna celda.
    const board = boardFromRows(['LLL.OOJJJJ']);
    const spawn = createSpawnPiece('S');
    const choice = findBestPlacement(board, spawn);
    expect(choice).toMatchObject({ rotation: 1, x: 2 });
    expect(choice && getHoles(boardAfter(board, choice.landed))).toBe(0);
    expect(choice && getErodedPieceCells(board, choice.landed)).toBe(1);
    const withHole = generatePlacements(board, spawn).filter(
      (p) => getHoles(boardAfter(board, p.landed)) > 0,
    );
    expect(withHole.length).toBeGreaterThan(0);
  });

  it('en una partida recién empezada con semilla fija elige una colocación válida', () => {
    const state = createInitialState({ seed: 42, startLevel: 0 });
    const piece = state.activePiece;
    expect(piece).not.toBeNull();
    const choice = piece && findBestPlacement(state.board, piece);
    expect(choice).not.toBeNull();
    expect(choice && collides(state.board, choice.landed)).toBe(false);
    // Tablero vacío: la pieza acaba tocando el suelo.
    expect(choice && collides(state.board, { ...choice.landed, y: choice.landed.y + 1 })).toBe(
      true,
    );
  });

  it('devuelve null en el tablero de fin de partida, donde la pieza que aparece ya no cabe', () => {
    expect(findBestPlacement(boardFromRows(GAME_OVER_ROWS), createSpawnPiece('T'))).toBeNull();
  });

  it('es determinista: la misma entrada da la misma salida', () => {
    for (const fixture of REAL_BOARDS) {
      const board = boardFromRows(fixture.rows);
      const piece = createSpawnPiece(fixture.pieceType);
      expect(findBestPlacement(board, piece)).toEqual(findBestPlacement(board, piece));
    }
  });

  it('a igual puntuación elige la que menos se desplaza desde la columna actual', () => {
    const board = boardFromRows([]);
    const spawn = createSpawnPiece('O');
    const choice = findBestPlacement(board, spawn);
    const best = generatePlacements(board, spawn)
      .map((p) => ({ ...p, score: evaluatePlacement(board, p.landed) }))
      .filter((p) => p.score === choice?.score);
    const distances = best.map((p) => Math.abs(p.x - spawn.x));
    expect(choice && Math.abs(choice.x - spawn.x)).toBe(Math.min(...distances));
  });

  it('no modifica el tablero recibido', () => {
    const board = boardFromRows(SEED_42_PIECE_9.rows);
    const copy = structuredClone(board);
    findBestPlacement(board, createSpawnPiece('I'));
    expect(board).toEqual(copy);
  });
});
