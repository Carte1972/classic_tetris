import type { PieceType } from '../../../src/engine/types';

/** Tablero sacado de una partida real, con la pieza que estaba a punto de caer. */
export interface RealBoardFixture {
  /** Semilla de la partida (nivel inicial 0). */
  readonly seed: number;
  /** Número de la pieza (empezando en 1) que aparece sobre este tablero. */
  readonly pieceNumber: number;
  /** Tipo de esa pieza. */
  readonly pieceType: PieceType;
  /** Filas inferiores del tablero, en el formato de `boardFromRows`. */
  readonly rows: readonly string[];
}

/**
 * Semilla 42, nivel inicial 0, al aparecer la pieza 9 (una I): la S de la pieza 6 quedó
 * apoyada en las O y dejó dos huecos tapados en las columnas 2 y 3.
 */
export const SEED_42_PIECE_9: RealBoardFixture = {
  seed: 42,
  pieceNumber: 9,
  pieceType: 'I',
  rows: ['..S.......', 'OOSS......', 'OO..SSJSS.'],
};

/**
 * Semilla 2026, nivel inicial 0, al aparecer la pieza 25 (una Z), con 8 líneas hechas:
 * pila escalonada sin ningún hueco.
 */
export const SEED_2026_PIECE_25: RealBoardFixture = {
  seed: 2026,
  pieceNumber: 25,
  pieceType: 'Z',
  rows: ['.........J', '...SSZLLLJ', '..SSZZLLJJ'],
};

/**
 * Semilla 123, nivel inicial 0, al aparecer la pieza 27 (una I), con 9 líneas hechas:
 * pila apoyada en las paredes con el centro bajo.
 */
export const SEED_123_PIECE_27: RealBoardFixture = {
  seed: 123,
  pieceNumber: 27,
  pieceType: 'I',
  rows: ['........OO', '........OO', 'J.......OO', 'JJJJ...TOO'],
};

/** Todos los tableros reales, para los tests que los recorren. */
export const REAL_BOARDS: readonly RealBoardFixture[] = [
  SEED_42_PIECE_9,
  SEED_2026_PIECE_25,
  SEED_123_PIECE_27,
];
