import { tryMove, tryRotate } from '../engine/movement';
import { EMPTY_INPUT } from '../engine/step';
import type { ActivePiece, Board, FrameInput, GameState } from '../engine/types';
import { findBestPlacement, type PlacementChoice } from './dellacherie';

/** Estado del piloto entre frames. */
export interface AutopilotState {
  /** Colocación que persigue la pieza actual, o `null` si todavía no hay plan. */
  readonly target: PlacementChoice | null;
  /**
   * Si ya se ha enviado el frame sin soft drop de la pieza actual: el motor bloquea el
   * soft drop tras fijar una pieza hasta que se suelta.
   */
  readonly softDropReleased: boolean;
}

/** Resultado de calcular la entrada de un frame. */
export interface AutopilotStep {
  /** Entrada para el motor en este frame. */
  readonly input: FrameInput;
  /** Estado del piloto para el frame siguiente. */
  readonly autopilot: AutopilotState;
}

/** Estado inicial, sin objetivo. */
export const INITIAL_AUTOPILOT_STATE: AutopilotState = { target: null, softDropReleased: false };

/** Movimientos que el piloto pide en un frame para acercarse al objetivo. */
interface PlannedMoves {
  /** Columnas que se desplaza (−1, 0 o 1). */
  readonly shift: number;
  /** Si gira en el sentido del objetivo. */
  readonly rotate: boolean;
}

/**
 * Elige los movimientos del frame hacia el objetivo, comprobando que el motor los aceptará
 * en su orden (primero el desplazamiento y después el giro): pide los dos si caben y, si
 * no, solo el giro, que es el primer paso del camino planificado.
 * @param board Tablero.
 * @param piece Pieza activa.
 * @param target Colocación objetivo.
 * @returns Los movimientos, `{ shift: 0, rotate: false }` si ya está alineada, o `null` si
 *   el siguiente paso del plan ya no es posible.
 */
function planMoves(board: Board, piece: ActivePiece, target: PlacementChoice): PlannedMoves | null {
  const shift = Math.sign(target.x - piece.x);
  const rotate = piece.rotation !== target.rotation;
  const shifted = shift === 0 ? piece : tryMove(board, piece, shift, 0);
  if (!rotate) {
    return shifted === null ? null : { shift, rotate };
  }
  if (shifted !== null && tryRotate(board, shifted, target.rotationDirection) !== null) {
    return { shift, rotate };
  }
  return tryRotate(board, piece, target.rotationDirection) === null
    ? null
    : { shift: 0, rotate: true };
}

/**
 * Convierte los movimientos planificados en la entrada del motor.
 * @param moves Movimientos del frame.
 * @param target Colocación objetivo (para el sentido del giro).
 * @param softDrop Si se mantiene el soft drop.
 * @returns La entrada del frame.
 */
function toFrameInput(moves: PlannedMoves, target: PlacementChoice, softDrop: boolean): FrameInput {
  return {
    moveLeft: moves.shift < 0,
    moveRight: moves.shift > 0,
    rotateClockwise: moves.rotate && target.rotationDirection === 1,
    rotateCounterClockwise: moves.rotate && target.rotationDirection === -1,
    softDrop,
  };
}

/**
 * Calcula la entrada del piloto para el siguiente frame.
 * @param autopilot Estado del piloto del frame anterior.
 * @param game Estado del motor antes del frame.
 * @returns Entrada del frame y nuevo estado del piloto.
 */
export function nextAutopilotInput(autopilot: AutopilotState, game: GameState): AutopilotStep {
  const piece = game.activePiece;
  if (game.phase !== 'falling' || piece === null) {
    return { input: EMPTY_INPUT, autopilot: INITIAL_AUTOPILOT_STATE };
  }
  const current = autopilot.target;
  let target =
    current === null || current.landed.type !== piece.type
      ? findBestPlacement(game.board, piece)
      : current;
  let moves = target === null ? null : planMoves(game.board, piece, target);
  if (target !== null && moves === null && target === current) {
    // La gravedad ha movido la pieza y el plan ya no sirve: se rehace desde aquí.
    target = findBestPlacement(game.board, piece);
    moves = target === null ? null : planMoves(game.board, piece, target);
  }
  const next: AutopilotState = { target, softDropReleased: true };
  if (target === null || moves === null) {
    return { input: EMPTY_INPUT, autopilot: next };
  }
  const aligned = moves.shift === 0 && !moves.rotate;
  return {
    input: toFrameInput(moves, target, aligned && autopilot.softDropReleased),
    autopilot: next,
  };
}
