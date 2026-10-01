import { FIRST_ROLL_SIDES, PIECE_TYPES } from '../config/tetromino_config';
import { nextRandomInt } from './random';
import type { PieceType } from './types';

/** Resultado de elegir la siguiente pieza. */
export interface PieceRoll {
  /** Pieza elegida. */
  readonly piece: PieceType;
  /** Nuevo estado del generador. */
  readonly rngState: number;
}

/**
 * Elige la siguiente pieza con el generador clásico de NES (sin 7-bag): una primera
 * tirada sobre las 7 piezas más un valor inválido; si sale el valor inválido o se
 * repite la pieza anterior, se hace una segunda tirada sobre las 7 piezas, cuyo
 * resultado se acepta siempre.
 * @param rngState Estado actual del generador.
 * @param previous Pieza anterior, o `null` si es la primera de la partida.
 * @returns La pieza elegida y el nuevo estado del generador.
 */
export function rollNextPiece(rngState: number, previous: PieceType | null): PieceRoll {
  const firstRoll = nextRandomInt(rngState, FIRST_ROLL_SIDES);
  const firstPiece = PIECE_TYPES[firstRoll.value];
  if (firstPiece !== undefined && firstPiece !== previous) {
    return { piece: firstPiece, rngState: firstRoll.state };
  }
  const secondRoll = nextRandomInt(firstRoll.state, PIECE_TYPES.length);
  return { piece: pieceAt(secondRoll.value), rngState: secondRoll.state };
}

/**
 * Devuelve la pieza en una posición válida de la lista canónica.
 * @param index Índice en [0, 7).
 * @returns La pieza correspondiente.
 */
function pieceAt(index: number): PieceType {
  const piece = PIECE_TYPES[index];
  if (piece === undefined) {
    throw new RangeError(`Índice de pieza fuera de rango: ${index}`);
  }
  return piece;
}
