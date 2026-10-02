import type { CelebrationState } from '../celebration/celebration_state';
import { drawCelebration, type StageContext } from '../celebration/celebration_renderer';
import { isNextPieceVisible } from '../engine/difficulty';
import type { GameState } from '../engine/types';
import type { BackgroundScene, SceneContext } from '../scene/red_square_scene';
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
  /** Registra (o elimina, con `null`) el escenario de las celebraciones. */
  readonly registerStage: (context: StageContext | null) => void;
  /** Escenario de las celebraciones registrado, o `null`. */
  readonly getStage: () => StageContext | null;
  /** Registra (o elimina, con `null`) el canvas del fondo animado. */
  readonly registerBackground: (context: SceneContext | null) => void;
  /** Canvas del fondo registrado, o `null`. */
  readonly getBackground: () => SceneContext | null;
}

/**
 * Crea un registro de canvas vacío.
 * @returns El registro.
 */
export function createRenderTargets(): RenderTargets {
  const contexts = new Map<CanvasSlot, RenderContext>();
  let stage: StageContext | null = null;
  let background: SceneContext | null = null;
  return {
    registerBackground: (context) => {
      background = context;
    },
    getBackground: () => background,
    registerStage: (context) => {
      stage = context;
    },
    getStage: () => stage,
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
 * Dibuja la partida en los canvas registrados (en pausa se oculta el tablero) y, si hay
 * celebración, el bailarín en su escenario.
 * @param targets Canvas disponibles.
 * @param screen Pantalla actual.
 * @param game Estado de la partida, o `null` si no hay partida.
 * @param celebration Celebración en curso, o `null`.
 */
export function renderGame(
  targets: RenderTargets,
  screen: ScreenName,
  game: GameState | null,
  celebration: CelebrationState | null = null,
): void {
  const stage = targets.getStage();
  if (stage !== null && celebration !== null) {
    drawCelebration(stage, celebration);
  }
  if (game === null) {
    return;
  }
  const board = targets.get('board');
  const preview = targets.get('preview');
  if (board !== null) {
    drawBoard(board, game, { hidden: screen === 'paused' });
  }
  if (preview !== null) {
    drawNextPiece(preview, isNextPieceVisible(game.level) ? game.nextPiece : null);
  }
}

/**
 * Dibuja el fondo animado (la Plaza Roja) si su canvas está registrado.
 * @param targets Canvas disponibles.
 * @param scene Escena de fondo.
 */
export function renderBackground(targets: RenderTargets, scene: BackgroundScene): void {
  const background = targets.getBackground();
  if (background !== null) {
    scene.draw(background);
  }
}
