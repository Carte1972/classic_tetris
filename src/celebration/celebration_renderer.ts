import {
  BALL_OFFSETS,
  DANCE_CENTER_X,
  ENTER_START_X,
  EXIT_END_X,
  JUMP_HEIGHTS,
  MATRYOSHKA_OPEN_AT_MS,
  MATRYOSHKA_SHELL_MS,
  MATRYOSHKA_SHELL_TRAVEL,
  STAGE_FLOOR_THICKNESS,
  STAGE_GROUND_Y,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  WOBBLE_OFFSETS,
} from '../config/celebration_config';
import { CELEBRATION_FLOOR_COLOR } from '../config/palette';
import type { CanvasSize, RenderContext } from '../render/render_context';
import { getDancer, type CelebrationState } from './celebration_state';
import { getChoreographyPose, type ChoreographyPose } from './choreography';
import { colorizeMatrix, composeFigure, type PixelGrid } from './sprite_composer';

/** Contexto que necesita el escenario (también borra el fotograma anterior). */
export type StageContext = RenderContext & Pick<CanvasRenderingContext2D, 'clearRect'>;

/** Rango de filas de una matriz. */
interface RowRange {
  readonly from: number;
  readonly to: number;
}

/**
 * Tamaño del escenario de las celebraciones.
 * @returns Ancho y alto en píxeles lógicos.
 */
export function getStageSize(): CanvasSize {
  return { width: STAGE_WIDTH, height: STAGE_HEIGHT };
}

/**
 * Posición horizontal de los pies del bailarín en cada momento: entra desde la
 * izquierda, baila en el centro y sale por la derecha.
 * @param pose Pose de la coreografía.
 * @returns Columna del escenario.
 */
export function getDancerX(pose: ChoreographyPose): number {
  const progress = pose.movementProgress;
  switch (pose.movement) {
    case 'enter':
      return Math.round(ENTER_START_X + (DANCE_CENTER_X - ENTER_START_X) * progress);
    case 'prisiadka':
    case 'jump':
      return DANCE_CENTER_X;
    case 'exit':
      return Math.round(DANCE_CENTER_X + (EXIT_END_X - DANCE_CENTER_X) * progress);
  }
}

/**
 * Dibuja píxeles agrupando tramos horizontales del mismo color.
 * @param ctx Contexto del escenario.
 * @param grid Píxeles.
 * @param left Columna del escenario de la esquina superior izquierda.
 * @param top Fila del escenario de la esquina superior izquierda.
 * @param rows Filas a dibujar (todas por defecto).
 */
function drawGrid(
  ctx: RenderContext,
  grid: PixelGrid,
  left: number,
  top: number,
  rows: RowRange = { from: 0, to: grid.length },
): void {
  for (let y = rows.from; y < rows.to; y++) {
    const line = grid[y] ?? [];
    let x = 0;
    while (x < line.length) {
      const color = line[x] ?? null;
      let end = x + 1;
      while (end < line.length && line[end] === color) {
        end++;
      }
      if (color !== null) {
        ctx.fillStyle = color;
        ctx.fillRect(left + x, top + y, end - x, 1);
      }
      x = end;
    }
  }
}

/**
 * Dibuja un fotograma de la celebración: suelo, bailarín (con su balón o la apertura
 * de la matrioska si corresponde).
 * @param ctx Contexto del escenario.
 * @param state Estado de la celebración.
 */
export function drawCelebration(ctx: StageContext, state: CelebrationState): void {
  ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  if (state.kind !== 'dance') {
    return;
  }
  ctx.fillStyle = CELEBRATION_FLOOR_COLOR;
  ctx.fillRect(0, STAGE_GROUND_Y + 1, STAGE_WIDTH, STAGE_FLOOR_THICKNESS);

  const pose = getChoreographyPose(state.elapsedMs);
  const dancer = getDancer(state);
  const wobble =
    dancer.wobbles === true && pose.movement === 'prisiadka'
      ? (WOBBLE_OFFSETS[pose.frame] ?? 0)
      : 0;
  const x = getDancerX(pose) + wobble;
  const lift = pose.movement === 'jump' ? (JUMP_HEIGHTS[pose.frame] ?? 0) : 0;
  const opened = dancer.opensInto !== undefined && state.elapsedMs >= MATRYOSHKA_OPEN_AT_MS;
  const performer = opened && dancer.opensInto !== undefined ? dancer.opensInto : dancer;

  const figure = composeFigure(performer, pose.movement, pose.frame);
  const figureLeft = x - figure.anchorX;
  const figureTop = STAGE_GROUND_Y - figure.bottomY - lift;
  drawGrid(ctx, figure.grid, figureLeft, figureTop);

  if (opened && state.elapsedMs < MATRYOSHKA_OPEN_AT_MS + MATRYOSHKA_SHELL_MS) {
    const progress = (state.elapsedMs - MATRYOSHKA_OPEN_AT_MS) / MATRYOSHKA_SHELL_MS;
    const travel = Math.round(progress * MATRYOSHKA_SHELL_TRAVEL);
    const shell = composeFigure(dancer, pose.movement, pose.frame);
    const shellLeft = x - shell.anchorX;
    const shellTop = STAGE_GROUND_Y - shell.bottomY - lift;
    drawGrid(ctx, shell.grid, shellLeft + travel, shellTop - travel, {
      from: 0,
      to: shell.splitRow,
    });
    drawGrid(ctx, shell.grid, shellLeft - travel, shellTop + Math.round(travel / 2), {
      from: shell.splitRow,
      to: shell.legsTop,
    });
  }

  if (dancer.ball !== undefined) {
    const offset = BALL_OFFSETS[pose.movement][pose.frame] ?? { x: 0, y: 0 };
    const ball = colorizeMatrix(dancer.ball, dancer.colors);
    const ballWidth = ball[0]?.length ?? 0;
    drawGrid(
      ctx,
      ball,
      x + offset.x - Math.floor(ballWidth / 2),
      STAGE_GROUND_Y - offset.y - lift - ball.length + 1,
    );
  }
}
