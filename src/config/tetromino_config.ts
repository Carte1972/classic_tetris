import type { CellOffset, PieceType } from '../engine/types';
import { HIDDEN_ROWS } from './board_config';

/** Orden canónico de las piezas; el generador aleatorio indexa sobre esta lista. */
export const PIECE_TYPES: readonly PieceType[] = ['T', 'J', 'Z', 'O', 'S', 'L', 'I'];

/**
 * Caras de la primera tirada del generador de NES: una por pieza más un valor
 * inválido que obliga a repetir la tirada.
 */
export const FIRST_ROLL_SIDES = PIECE_TYPES.length + 1;

/**
 * Orientaciones de cada pieza según el sistema de rotación de NES, en sentido horario.
 * La primera es la orientación de aparición. Las coordenadas son relativas al pivote
 * y la `y` crece hacia abajo. Sin wall kicks: si una rotación choca, se descarta.
 */
export const PIECE_ROTATIONS: Readonly<Record<PieceType, readonly (readonly CellOffset[])[]>> = {
  T: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    [
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ],
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
  ],
  J: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
    ],
    [
      { x: -1, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
    [
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ],
  ],
  Z: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 1, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
  ],
  O: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
    ],
  ],
  S: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
  ],
  L: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
    ],
    [
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ],
    [
      { x: 1, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  ],
  I: [
    [
      { x: -2, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
    [
      { x: 0, y: -2 },
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ],
  ],
};

/** Columna del pivote al aparecer una pieza. */
export const SPAWN_COLUMN = 5;

/**
 * Fila del pivote al aparecer una pieza: la primera fila visible, como en NES. Las filas
 * ocultas de encima dejan sitio para las orientaciones verticales al rotar recién aparecida.
 */
export const SPAWN_ROW = HIDDEN_ROWS;
