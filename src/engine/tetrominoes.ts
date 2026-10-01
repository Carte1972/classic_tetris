import { PIECE_ROTATIONS, SPAWN_COLUMN, SPAWN_ROW } from '../config/tetromino_config';
import type { ActivePiece, CellOffset, CellPosition, PieceType } from './types';

/** Sentido de rotación: 1 = horario, -1 = antihorario. */
export type RotationDirection = 1 | -1;

/**
 * Número de orientaciones distintas de una pieza (1, 2 o 4).
 * @param type Tipo de pieza.
 * @returns Número de orientaciones.
 */
export function getRotationCount(type: PieceType): number {
  return PIECE_ROTATIONS[type].length;
}

/**
 * Desplazamientos de las celdas de una pieza en una orientación.
 * @param type Tipo de pieza.
 * @param rotation Índice de orientación (se normaliza al rango válido).
 * @returns Las 4 celdas relativas al pivote.
 */
export function getPieceOffsets(type: PieceType, rotation: number): readonly CellOffset[] {
  const rotations = PIECE_ROTATIONS[type];
  const offsets = rotations[normalizeRotation(rotation, rotations.length)];
  if (offsets === undefined) {
    throw new RangeError(`Orientación inexistente para ${type}: ${rotation}`);
  }
  return offsets;
}

/**
 * Posiciones absolutas que ocupa una pieza en el tablero.
 * @param piece Pieza activa.
 * @returns Las 4 celdas ocupadas.
 */
export function getPieceCells(piece: ActivePiece): readonly CellPosition[] {
  return getPieceOffsets(piece.type, piece.rotation).map((offset) => ({
    x: piece.x + offset.x,
    y: piece.y + offset.y,
  }));
}

/**
 * Crea una pieza en su posición y orientación de aparición.
 * @param type Tipo de pieza.
 * @returns La pieza recién aparecida.
 */
export function createSpawnPiece(type: PieceType): ActivePiece {
  return { type, rotation: 0, x: SPAWN_COLUMN, y: SPAWN_ROW };
}

/**
 * Devuelve la pieza rotada un paso, sin comprobar colisiones.
 * @param piece Pieza a rotar.
 * @param direction Sentido de la rotación.
 * @returns La pieza en su nueva orientación.
 */
export function rotatePiece(piece: ActivePiece, direction: RotationDirection): ActivePiece {
  const count = getRotationCount(piece.type);
  return { ...piece, rotation: normalizeRotation(piece.rotation + direction, count) };
}

/**
 * Lleva un índice de orientación al rango [0, count).
 * @param rotation Índice posiblemente negativo o mayor que el rango.
 * @param count Número de orientaciones.
 * @returns Índice normalizado.
 */
function normalizeRotation(rotation: number, count: number): number {
  return ((rotation % count) + count) % count;
}
