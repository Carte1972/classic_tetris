/** Tipos de los 7 tetrominós. */
export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** Desplazamiento de una celda respecto al pivote de la pieza (y crece hacia abajo). */
export interface CellOffset {
  readonly x: number;
  readonly y: number;
}

/** Posición absoluta de una celda en el tablero (fila 0 = primera fila oculta). */
export interface CellPosition {
  readonly x: number;
  readonly y: number;
}

/** Contenido de una celda: vacía o el tipo de pieza que la ocupa. */
export type Cell = PieceType | null;

/** Fila del tablero, de izquierda a derecha. */
export type BoardRow = readonly Cell[];

/** Tablero completo, de arriba (filas ocultas) a abajo. */
export type Board = readonly BoardRow[];

/** Pieza que está cayendo. */
export interface ActivePiece {
  readonly type: PieceType;
  /** Índice en la tabla de orientaciones de la pieza (sentido horario). */
  readonly rotation: number;
  /** Columna del pivote. */
  readonly x: number;
  /** Fila del pivote. */
  readonly y: number;
}

/**
 * Fase del motor:
 * - `falling`: hay una pieza activa cayendo.
 * - `lineClear`: se está animando la limpieza de líneas.
 * - `entryDelay`: retardo de entrada (ARE) antes de la siguiente pieza.
 * - `gameOver`: la partida ha terminado.
 */
export type GamePhase = 'falling' | 'lineClear' | 'entryDelay' | 'gameOver';

/** Estado inmutable completo de una partida. */
export interface GameState {
  readonly board: Board;
  /** Pieza activa; `null` fuera de la fase `falling`. */
  readonly activePiece: ActivePiece | null;
  readonly nextPiece: PieceType;
  /** Estado interno del generador pseudoaleatorio. */
  readonly rngState: number;
  readonly phase: GamePhase;
  readonly startLevel: number;
  readonly level: number;
  readonly lines: number;
  readonly score: number;
  /** Frames acumulados desde la última caída por gravedad. */
  readonly gravityFrames: number;
  /** Frames acumulados desde la última caída por soft drop. */
  readonly softDropFrames: number;
  /**
   * Si el soft drop está bloqueado hasta que se suelte la tecla: como en NES, mantener
   * pulsado abajo no afecta a la pieza siguiente; hay que volver a pulsarlo.
   */
  readonly softDropReleaseRequired: boolean;
  /** Frames que quedan de la fase `lineClear` o `entryDelay`. */
  readonly phaseFramesRemaining: number;
  /** Frames totales de la fase en curso (para calcular el progreso de animaciones). */
  readonly phaseFramesTotal: number;
  /** Filas que se están limpiando durante la fase `lineClear`. */
  readonly clearingRows: readonly number[];
  /** Retardo de entrada (ARE) calculado al fijar la última pieza. */
  readonly entryDelayFrames: number;
  /** Milisegundos acumulados que aún no completan un frame. */
  readonly pendingMs: number;
}

/** Entrada ya procesada (DAS incluido) que el motor aplica en un frame. */
export interface FrameInput {
  /** Intentar desplazar la pieza una columna a la izquierda. */
  readonly moveLeft: boolean;
  /** Intentar desplazar la pieza una columna a la derecha. */
  readonly moveRight: boolean;
  /** Intentar rotar en sentido horario. */
  readonly rotateClockwise: boolean;
  /** Intentar rotar en sentido antihorario. */
  readonly rotateCounterClockwise: boolean;
  /** Soft drop mantenido. */
  readonly softDrop: boolean;
}

/** Eventos que emite el motor para que otros módulos (audio, celebraciones, UI) reaccionen. */
export type GameEvent =
  | { readonly type: 'pieceMoved' }
  | { readonly type: 'pieceRotated' }
  | { readonly type: 'pieceLocked' }
  | { readonly type: 'linesCleared'; readonly count: number }
  | { readonly type: 'levelUp'; readonly level: number }
  | { readonly type: 'gameOver' };

/** Resultado de avanzar el motor. */
export interface StepResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}
