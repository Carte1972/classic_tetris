import { DELLACHERIE_WEIGHTS } from '../config/autopilot_config';
import { BOARD_COLUMNS, TOTAL_ROWS } from '../config/board_config';
import { findFullRows, lockPiece, removeRows } from '../engine/board';
import { collides } from '../engine/collision';
import { tryMove, tryRotate } from '../engine/movement';
import { getPieceCells, getRotationCount, type RotationDirection } from '../engine/tetrominoes';
import type { ActivePiece, Board } from '../engine/types';

/** Colocación alcanzable desde la posición actual de la pieza. */
export interface Placement {
  /** Orientación final (índice en PIECE_ROTATIONS). */
  readonly rotation: number;
  /** Columna final del pivote. */
  readonly x: number;
  /** Pieza ya caída en su posición final. */
  readonly landed: ActivePiece;
  /** Rotaciones necesarias para llegar a la orientación final. */
  readonly rotationSteps: number;
  /** Sentido de esas rotaciones (1 = horario, -1 = antihorario). */
  readonly rotationDirection: RotationDirection;
}

/** Colocación elegida por el algoritmo. */
export interface PlacementChoice extends Placement {
  /** Puntuación de Dellacherie de la colocación. */
  readonly score: number;
}

/** Sentidos en que se prueban las rotaciones; el horario va primero y gana los empates. */
const ROTATION_DIRECTIONS: readonly RotationDirection[] = [1, -1];

/**
 * Indica si una celda está ocupada; fuera del tablero (paredes y suelo) cuenta como ocupada.
 * @param board Tablero.
 * @param x Columna.
 * @param y Fila.
 * @returns `true` si está ocupada o es pared.
 */
function isFilled(board: Board, x: number, y: number): boolean {
  if (x < 0 || x >= BOARD_COLUMNS || y >= TOTAL_ROWS) {
    return true;
  }
  return (board[y]?.[x] ?? null) !== null;
}

/**
 * Altura de aterrizaje: media entre la altura de la celda más baja y la de la más alta de
 * la pieza ya caída (una celda en la fila `y` tiene altura `TOTAL_ROWS - y`).
 * @param landed Pieza en su posición final, antes de borrar líneas.
 * @returns Altura de aterrizaje.
 */
export function getLandingHeight(landed: ActivePiece): number {
  const heights = getPieceCells(landed).map((cell) => TOTAL_ROWS - cell.y);
  return (Math.min(...heights) + Math.max(...heights)) / 2;
}

/**
 * Celdas erosionadas: líneas eliminadas por las celdas de la pieza que caen en esas líneas.
 * @param board Tablero antes de fijar la pieza.
 * @param landed Pieza en su posición final.
 * @returns El producto, o 0 si no elimina ninguna línea.
 */
export function getErodedPieceCells(board: Board, landed: ActivePiece): number {
  const fullRows = findFullRows(lockPiece(board, landed));
  const pieceCells = getPieceCells(landed).filter((cell) => fullRows.includes(cell.y)).length;
  return fullRows.length * pieceCells;
}

/**
 * Transiciones de filas: cambios ocupado↔vacío recorriendo cada fila de izquierda a
 * derecha; las paredes cuentan como ocupadas.
 * @param board Tablero.
 * @returns Número de transiciones.
 */
export function getRowTransitions(board: Board): number {
  let transitions = 0;
  for (let y = 0; y < TOTAL_ROWS; y++) {
    for (let x = 0; x <= BOARD_COLUMNS; x++) {
      if (isFilled(board, x - 1, y) !== isFilled(board, x, y)) {
        transitions++;
      }
    }
  }
  return transitions;
}

/**
 * Transiciones de columnas: cambios ocupado↔vacío recorriendo cada columna de arriba
 * abajo; el suelo cuenta como ocupado y el borde superior, como vacío.
 * @param board Tablero.
 * @returns Número de transiciones.
 */
export function getColumnTransitions(board: Board): number {
  let transitions = 0;
  for (let x = 0; x < BOARD_COLUMNS; x++) {
    let above = false;
    for (let y = 0; y <= TOTAL_ROWS; y++) {
      const filled = isFilled(board, x, y);
      if (filled !== above) {
        transitions++;
      }
      above = filled;
    }
  }
  return transitions;
}

/**
 * Huecos: celdas vacías con alguna celda ocupada encima en su columna.
 * @param board Tablero.
 * @returns Número de huecos.
 */
export function getHoles(board: Board): number {
  let holes = 0;
  for (let x = 0; x < BOARD_COLUMNS; x++) {
    let covered = false;
    for (let y = 0; y < TOTAL_ROWS; y++) {
      if (isFilled(board, x, y)) {
        covered = true;
      } else if (covered) {
        holes++;
      }
    }
  }
  return holes;
}

/**
 * Pozos acumulados: una celda de pozo está vacía y tiene ocupados los vecinos izquierdo y
 * derecho (paredes incluidas). Cada secuencia vertical de profundidad `d` suma
 * `d × (d + 1) / 2`.
 * @param board Tablero.
 * @returns Suma de los pozos.
 */
export function getCumulativeWells(board: Board): number {
  let total = 0;
  for (let x = 0; x < BOARD_COLUMNS; x++) {
    let depth = 0;
    for (let y = 0; y < TOTAL_ROWS; y++) {
      const isWell =
        !isFilled(board, x, y) && isFilled(board, x - 1, y) && isFilled(board, x + 1, y);
      depth = isWell ? depth + 1 : 0;
      // Sumar la profundidad en cada celda de la secuencia da 1 + 2 + … + d.
      total += depth;
    }
  }
  return total;
}

/**
 * Deja caer una pieza hasta que choca.
 * @param board Tablero.
 * @param piece Pieza en una posición válida.
 * @returns La pieza en la fila más baja a la que llega.
 */
function dropPiece(board: Board, piece: ActivePiece): ActivePiece {
  let current = piece;
  let next = tryMove(board, current, 0, 1);
  while (next !== null) {
    current = next;
    next = tryMove(board, current, 0, 1);
  }
  return current;
}

/** Orientación alcanzable girando sin desplazarse, con el camino más corto. */
interface ReachableRotation {
  readonly piece: ActivePiece;
  readonly steps: number;
  readonly direction: RotationDirection;
}

/**
 * Orientaciones a las que se llega girando en el sitio con la rotación de NES (sin wall
 * kicks: un giro que choca corta ese sentido).
 * @param board Tablero.
 * @param piece Pieza activa.
 * @returns Una entrada por orientación alcanzable, con el menor número de giros.
 */
function getReachableRotations(board: Board, piece: ActivePiece): readonly ReachableRotation[] {
  const found = new Map<number, ReachableRotation>([
    [piece.rotation, { piece, steps: 0, direction: 1 }],
  ]);
  const count = getRotationCount(piece.type);
  for (const direction of ROTATION_DIRECTIONS) {
    let current: ActivePiece | null = piece;
    for (let steps = 1; steps < count && current !== null; steps++) {
      current = tryRotate(board, current, direction);
      const known = current === null ? undefined : found.get(current.rotation);
      if (current !== null && (known === undefined || known.steps > steps)) {
        found.set(current.rotation, { piece: current, steps, direction });
      }
    }
  }
  return [...found.values()].sort((a, b) => a.piece.rotation - b.piece.rotation);
}

/**
 * Posiciones horizontales alcanzables desde una pieza desplazándola columna a columna
 * hasta chocar a cada lado.
 * @param board Tablero.
 * @param piece Pieza en su orientación final.
 * @returns Las posiciones, de izquierda a derecha.
 */
function getReachableShifts(board: Board, piece: ActivePiece): readonly ActivePiece[] {
  const left: ActivePiece[] = [];
  for (let p = tryMove(board, piece, -1, 0); p !== null; p = tryMove(board, p, -1, 0)) {
    left.unshift(p);
  }
  const right: ActivePiece[] = [];
  for (let p = tryMove(board, piece, 1, 0); p !== null; p = tryMove(board, p, 1, 0)) {
    right.push(p);
  }
  return [...left, piece, ...right];
}

/**
 * Colocaciones alcanzables desde la posición actual: cada orientación a la que se llega
 * girando en el sitio y, desde ella, cada columna a la que se llega desplazando; después,
 * la caída hasta chocar.
 * @param board Tablero actual.
 * @param piece Pieza activa en su posición actual.
 * @returns Las colocaciones, ordenadas por orientación y columna; vacía si la pieza ya choca.
 */
export function generatePlacements(board: Board, piece: ActivePiece): readonly Placement[] {
  if (collides(board, piece)) {
    return [];
  }
  return getReachableRotations(board, piece).flatMap((reachable) =>
    getReachableShifts(board, reachable.piece).map((shifted) => ({
      rotation: shifted.rotation,
      x: shifted.x,
      landed: dropPiece(board, shifted),
      rotationSteps: reachable.steps,
      rotationDirection: reachable.direction,
    })),
  );
}

/**
 * Puntuación de Dellacherie de una colocación. La altura de aterrizaje y las celdas
 * erosionadas dependen de la jugada; el resto se mide en el tablero tras fijar la pieza y
 * borrar las líneas completas.
 * @param board Tablero antes de fijar la pieza.
 * @param landed Pieza en su posición final.
 * @returns La puntuación (mayor es mejor).
 */
export function evaluatePlacement(board: Board, landed: ActivePiece): number {
  const locked = lockPiece(board, landed);
  const after = removeRows(locked, findFullRows(locked));
  return (
    DELLACHERIE_WEIGHTS.landingHeight * getLandingHeight(landed) +
    DELLACHERIE_WEIGHTS.erodedPieceCells * getErodedPieceCells(board, landed) +
    DELLACHERIE_WEIGHTS.rowTransitions * getRowTransitions(after) +
    DELLACHERIE_WEIGHTS.columnTransitions * getColumnTransitions(after) +
    DELLACHERIE_WEIGHTS.holes * getHoles(after) +
    DELLACHERIE_WEIGHTS.cumulativeWells * getCumulativeWells(after)
  );
}

/**
 * Compara dos colocaciones con la misma puntuación: gana la que pide menos acciones desde
 * la posición actual (menos columnas, luego menos giros) y, si persiste, la de la izquierda.
 * @param a Primera colocación.
 * @param b Segunda colocación.
 * @param currentX Columna actual del pivote.
 * @returns Negativo si `a` va antes que `b`.
 */
function compareTies(a: Placement, b: Placement, currentX: number): number {
  return (
    Math.abs(a.x - currentX) - Math.abs(b.x - currentX) ||
    a.rotationSteps - b.rotationSteps ||
    a.x - b.x ||
    a.rotation - b.rotation
  );
}

/**
 * Elige la mejor colocación alcanzable para la pieza activa.
 * @param board Tablero actual de la partida.
 * @param piece Pieza activa en su posición actual.
 * @returns La mejor colocación, o `null` si no hay ninguna válida.
 */
export function findBestPlacement(board: Board, piece: ActivePiece): PlacementChoice | null {
  let best: PlacementChoice | null = null;
  for (const placement of generatePlacements(board, piece)) {
    const score = evaluatePlacement(board, placement.landed);
    if (
      best === null ||
      score > best.score ||
      (score === best.score && compareTies(placement, best, piece.x) < 0)
    ) {
      best = { ...placement, score };
    }
  }
  return best;
}
