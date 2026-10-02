import { MATRYOSHKA_SHELL_MS, MATRYOSHKA_SHELL_TRAVEL } from '../config/celebration_config';
import type { RenderContext } from '../render/render_context';
import type { CanvasSize } from '../render/render_context';
import { getPerformer, type CelebrationState } from './celebration_state';
import { placeDancer } from './dancer_renderer';
import type { DancerDefinition } from './dancers/dancer_types';
import { buildHumanoid, type BodyPart } from './dancers/humanoid';
import { DANCE_SEGMENTS, STANDING } from './puppet/choreography';
import { drawBody } from './puppet/puppet_renderer';
import { solveSkeleton } from './puppet/skeleton';
import { STAGE_CENTER_X, STAGE_GROUND_Y, STAGE_SIZE } from './stages/stage_types';

/** Contexto del escenario de las celebraciones. */
export type StageContext = RenderContext;

/** Momento en que se abre la matrioska: al empezar el giro (ms). */
export const MATRYOSHKA_OPEN_AT_MS = (() => {
  let start = 0;
  for (const segment of DANCE_SEGMENTS) {
    if (segment.move === 'spin') {
      return start;
    }
    start += segment.durationMs;
  }
  return start;
})();

/**
 * Tamaño del escenario de las celebraciones.
 * @returns Ancho y alto en píxeles lógicos.
 */
export function getStageSize(): CanvasSize {
  return { width: STAGE_SIZE.width, height: STAGE_SIZE.height };
}

/**
 * Dibuja una mitad de la matrioska grande mientras sale despedida al abrirse.
 * @param ctx Contexto de dibujo.
 * @param doll Matrioska grande.
 * @param part Mitad (de arriba o de abajo).
 * @param progress Progreso de la animación (0–1).
 */
function drawShell(
  ctx: RenderContext,
  doll: DancerDefinition,
  part: BodyPart,
  progress: number,
): void {
  const up = part === 'upper';
  const travel = MATRYOSHKA_SHELL_TRAVEL * progress;
  const skeleton = solveSkeleton(
    {
      ...STANDING,
      lean: (up ? -0.6 : 0.4) * progress,
      x: (up ? -1 : 1) * travel * 0.8,
      lift: up ? travel * 1.4 : 0,
    },
    doll.body,
    STAGE_CENTER_X,
    STAGE_GROUND_Y + (up ? 0 : travel * 0.6),
  );
  const frame = { elapsedMs: 0, move: 'spin' as const, moveElapsedMs: 0, moveProgress: 0 };
  drawBody(ctx, buildHumanoid(doll, skeleton, frame, part));
}

/**
 * Dibuja un fotograma de la celebración: escenario, bailarín y lo que va delante. La
 * matrioska se abre al empezar el giro y sigue bailando la pequeña.
 * @param ctx Contexto del escenario.
 * @param state Estado de la celebración.
 */
export function drawCelebration(ctx: StageContext, state: CelebrationState): void {
  ctx.clearRect(0, 0, STAGE_SIZE.width, STAGE_SIZE.height);
  if (state.kind !== 'dance') {
    return;
  }
  const performer = getPerformer(state);
  performer.stage.draw(ctx, state.elapsedMs);
  const opened = performer.opensInto !== undefined && state.elapsedMs >= MATRYOSHKA_OPEN_AT_MS;
  const dancer =
    opened && performer.opensInto !== undefined ? performer.opensInto : performer.dancer;
  const { skeleton, frame } = placeDancer(dancer, state.elapsedMs, STAGE_CENTER_X, STAGE_GROUND_Y);
  drawBody(ctx, buildHumanoid(dancer, skeleton, frame));
  if (opened) {
    const progress = (state.elapsedMs - MATRYOSHKA_OPEN_AT_MS) / MATRYOSHKA_SHELL_MS;
    if (progress < 1) {
      drawShell(ctx, performer.dancer, 'lower', progress);
      drawShell(ctx, performer.dancer, 'upper', progress);
    }
  }
  performer.stage.drawFront?.(ctx, state.elapsedMs);
}
