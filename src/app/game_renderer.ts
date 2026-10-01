import type { GameState } from '../engine/types';
import { drawBoard } from '../render/board_renderer';
import { drawNextPiece } from '../render/next_piece_renderer';
import type { RenderContext } from '../render/render_context';
import type { ScreenName } from './app_controller';

/** Canvas donde se dibuja la partida. */
export type CanvasSlot = 'board' | 'preview';

/** Registro de los contextos de dibujo disponibles en cada momento. */
export interface RenderTargets {
  /** Registra (o elimina, con `null`) el contexto de un canvas. */
  readonly register: (slot: CanvasSlot, context: RenderContext | null) => void;
  /** Contexto registrado para un canvas, o `null`. */
  readonly get: (slot: CanvasSlot) => RenderContext | null;
}

/**
 * Crea un registro de canvas vacío.
 * @returns El registro.
 */
export function createRenderTargets(): RenderTargets {
  const contexts = new Map<CanvasSlot, RenderContext>();
  return {
    register: (slot, context) => {
      if (context === null) {
        contexts.delete(slot);
      } else {
        contexts.set(slot, context);
      }
    },
    get: (slot) => contexts.get(slot) ?? null,
  };
}

/**
 * Dibuja la partida en los canvas registrados. En pausa se oculta el tablero.
 * @param targets Canvas disponibles.
 * @param screen Pantalla actual.
 * @param game Estado de la partida, o `null` si no hay partida.
 */
export function renderGame(
  targets: RenderTargets,
  screen: ScreenName,
  game: GameState | null,
): void {
  if (game === null) {
    return;
  }
  const board = targets.get('board');
  const preview = targets.get('preview');
  if (board !== null) {
    drawBoard(board, game, { hidden: screen === 'paused' });
  }
  if (preview !== null) {
    drawNextPiece(preview, game.nextPiece);
  }
}
