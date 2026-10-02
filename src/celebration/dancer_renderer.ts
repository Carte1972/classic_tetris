import type { RenderContext } from '../render/render_context';
import type { DancerDefinition, DancerFrame } from './dancers/dancer_types';
import { buildHumanoid } from './dancers/humanoid';
import { getDanceFrame } from './puppet/choreography';
import { drawBody } from './puppet/puppet_renderer';
import { solveSkeleton, type Pose, type Skeleton } from './puppet/skeleton';

/** Balanceo de la bailarina en la prisiadka (rad y px). */
const WOBBLE = { lean: 0.12, x: 2, periodMs: 260 } as const;

/**
 * Ajusta la postura a las particularidades del personaje (saltos más altos,
 * tambaleo…).
 * @param def Bailarín.
 * @param pose Postura de la coreografía.
 * @param frame Momento de la coreografía.
 * @returns Postura ajustada.
 */
function personalize(def: DancerDefinition, pose: Pose, frame: DancerFrame): Pose {
  let result = { ...pose, lift: pose.lift * (frame.move === 'jump' ? (def.jumpScale ?? 1) : 1) };
  if (def.wobbles === true && (frame.move === 'prisiadka' || frame.move === 'kicks')) {
    const sway = Math.sin(frame.moveElapsedMs / WOBBLE.periodMs);
    result = { ...result, lean: result.lean + sway * WOBBLE.lean, x: result.x + sway * WOBBLE.x };
  }
  return result;
}

/** Bailarín colocado en un instante. */
export interface PlacedDancer {
  readonly skeleton: Skeleton;
  readonly frame: DancerFrame;
}

/**
 * Coloca al bailarín en un instante de la coreografía.
 * @param def Bailarín.
 * @param elapsedMs Tiempo desde el inicio de la celebración.
 * @param baseX Columna central del escenario.
 * @param groundY Fila del suelo.
 * @returns Esqueleto y momento de la coreografía.
 */
export function placeDancer(
  def: DancerDefinition,
  elapsedMs: number,
  baseX: number,
  groundY: number,
): PlacedDancer {
  const dance = getDanceFrame(elapsedMs);
  const frame: DancerFrame = {
    elapsedMs,
    move: dance.move,
    moveElapsedMs: dance.moveElapsedMs,
    moveProgress: dance.moveProgress,
  };
  const skeleton = solveSkeleton(personalize(def, dance.pose, frame), def.body, baseX, groundY);
  return { skeleton, frame };
}

/**
 * Dibuja al bailarín en un instante de la coreografía.
 * @param ctx Contexto de dibujo.
 * @param def Bailarín.
 * @param elapsedMs Tiempo desde el inicio de la celebración.
 * @param baseX Columna central del escenario.
 * @param groundY Fila del suelo.
 */
export function drawDancer(
  ctx: RenderContext,
  def: DancerDefinition,
  elapsedMs: number,
  baseX: number,
  groundY: number,
): void {
  const { skeleton, frame } = placeDancer(def, elapsedMs, baseX, groundY);
  drawBody(ctx, buildHumanoid(def, skeleton, frame));
}
