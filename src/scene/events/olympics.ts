import { LAWN_EDGE, SCENE_HEIGHT, SCENE_WIDTH } from '../../config/scene_config';
import type { RenderContext } from '../../render/render_context';
import type { SceneActor } from '../actors';
import { depthScale } from '../crowd';
import { drawOlympicRings } from '../olympic_rings';
import { fillCircle, fillPixelRect } from '../pixel_shapes';
import { drawPixelText, pixelTextWidth } from '../pixel_text';
import { RUSSIAN_FLAG, SKINS, hash, pick } from './event_helpers';
import type { EventFrame, PlazaEvent } from './event_types';
import { FIGURE_HEIGHT, drawFigure, type FigureStyle } from './figures';

/** Milisegundos por segundo. */
const MS_PER_SECOND = 1000;

/** Escenario delante de San Basilio: columnas, fila de la tarima y fila del suelo. */
const STAGE = { left: 452, right: 588, top: 336, foot: 354 } as const;

/** Cartel del fondo del escenario. */
const BOARD = { left: 462, right: 578, top: 262, bottom: 296 } as const;

/** Rótulo del cartel. */
const TITLE = 'ЧЕМПИОНЫ!';

/** Cajones del podio: puesto, centro, altura y color. */
const PODIUM = [
  { place: '2', x: 500, height: 10, color: '#c8c8d2' },
  { place: '1', x: 520, height: 15, color: '#e8b947' },
  { place: '3', x: 540, height: 7, color: '#c87a3a' },
] as const;

/** Colores del escenario. */
const COLORS = {
  stage: '#1f4fb0',
  stageDark: '#163a84',
  stageTop: '#d8d8e0',
  board: '#f4f1e6',
  boardFrame: '#1f4fb0',
  text: '#c8202f',
  tracksuit: '#d8202f',
  tracksuitTrim: '#f4f4f4',
} as const;

/** Colores del confeti. */
const CONFETTI = ['#e0243a', '#f0c24a', '#1f4fb0', '#f4f4f4', '#2fae5a', '#ff8ad0'] as const;

/** Trozos de confeti en el aire. */
const CONFETTI_COUNT = 140;

/** Ropa de los aficionados (camisetas de los colores de la bandera). */
const FAN_CLOTHES = ['#f4f4f4', '#1f4fb0', '#d8202f', '#e8e2d0', '#2a2a32'] as const;

/**
 * Escenario con el podio, el cartel con los aros y los campeones saludando.
 * @param ctx Contexto de dibujo.
 * @param frame Fotograma.
 */
function drawStage(ctx: RenderContext, frame: EventFrame): void {
  // Cartel con los aros olímpicos y el rótulo.
  fillPixelRect(
    ctx,
    BOARD.left - 2,
    BOARD.top - 2,
    BOARD.right - BOARD.left + 4,
    BOARD.bottom - BOARD.top + 4,
    COLORS.boardFrame,
  );
  fillPixelRect(
    ctx,
    BOARD.left,
    BOARD.top,
    BOARD.right - BOARD.left,
    BOARD.bottom - BOARD.top,
    COLORS.board,
  );
  const center = (BOARD.left + BOARD.right) / 2;
  drawOlympicRings(ctx, center, BOARD.top + 9, 5, COLORS.board);
  drawPixelText(
    ctx,
    TITLE,
    Math.round(center - pixelTextWidth(TITLE, 2) / 2),
    BOARD.top + 21,
    2,
    COLORS.text,
  );
  for (const x of [BOARD.left + 6, BOARD.right - 7]) {
    fillPixelRect(ctx, x, BOARD.bottom + 2, 2, STAGE.top - BOARD.bottom - 2, COLORS.stageDark);
  }
  // Tarima.
  fillPixelRect(ctx, STAGE.left, STAGE.top, STAGE.right - STAGE.left, 2, COLORS.stageTop);
  fillPixelRect(
    ctx,
    STAGE.left,
    STAGE.top + 2,
    STAGE.right - STAGE.left,
    STAGE.foot - STAGE.top - 2,
    COLORS.stage,
  );
  for (let x = STAGE.left + 4; x < STAGE.right; x += 8) {
    fillPixelRect(ctx, x, STAGE.top + 3, 1, STAGE.foot - STAGE.top - 3, COLORS.stageDark);
  }
  // Podio con los tres campeones.
  const s = depthScale(STAGE.top);
  PODIUM.forEach((step, i) => {
    const top = STAGE.top - step.height;
    fillPixelRect(ctx, step.x - 10, top, 20, step.height, step.color);
    drawPixelText(ctx, step.place, step.x - 1, top + 2, 1, '#2a2a32');
    const style: FigureStyle = {
      body: COLORS.tracksuit,
      legs: COLORS.tracksuitTrim,
      skin: pick(SKINS, i, 7),
      headwear: 'none',
      hat: '#000000',
    };
    drawFigure(ctx, step.x, top, FIGURE_HEIGHT * s, style, {
      stride: 0,
      arms: i === 1 ? 'up' : 'wave',
      phase: frame.timeMs / 200 + i,
      prop: i === 1 ? { kind: 'flag', stripes: RUSSIAN_FLAG, wave: frame.timeMs / 150 } : undefined,
    });
    // Medalla al cuello.
    fillCircle(ctx, step.x, top - Math.round(FIGURE_HEIGHT * s * 0.62), 1.5, step.color);
  });
}

/**
 * Aficionados que saltan con banderas a lo largo del césped y abajo.
 * @param frame Fotograma.
 * @returns Actores.
 */
function fans(frame: EventFrame): SceneActor[] {
  const edgeAt = (x: number): number =>
    LAWN_EDGE.from.y + ((LAWN_EDGE.to.y - LAWN_EDGE.from.y) * x) / LAWN_EDGE.to.x;
  const spots: { x: number; y: number }[] = [];
  for (let i = 0; i < 24; i++) {
    const x = 6 + i * 10 + (i % 3) * 2;
    spots.push({ x, y: Math.round(edgeAt(x) + 4 + (i % 2) * 4) });
  }
  for (let i = 0; i < 12; i++) {
    spots.push({ x: 10 + i * 9 + (i % 2) * 3, y: 344 + (i % 3) * 4 });
  }
  for (let i = 0; i < 8; i++) {
    spots.push({ x: 600 + (i % 4) * 10, y: 340 + Math.floor(i / 4) * 10 });
  }
  return spots.map((spot, i) => {
    const style: FigureStyle = {
      body: pick(FAN_CLOTHES, i),
      legs: '#2a2a32',
      skin: pick(SKINS, i, 2),
      headwear: i % 4 === 0 ? 'cap' : 'none',
      hat: pick(FAN_CLOTHES, i, 5),
    };
    const s = depthScale(spot.y);
    const bounce = Math.max(0, Math.sin(frame.timeMs / 180 + hash(i, 4) * 6));
    return {
      y: spot.y,
      draw: (ctx: RenderContext) =>
        drawFigure(ctx, spot.x, spot.y, FIGURE_HEIGHT * s, style, {
          stride: 0,
          arms: i % 3 === 0 ? 'up' : 'wave',
          phase: frame.timeMs / 160 + i,
          jump: bounce * 0.12,
          prop:
            i % 2 === 0
              ? { kind: 'flag', stripes: RUSSIAN_FLAG, wave: frame.timeMs / 140 + i }
              : undefined,
        }),
    };
  });
}

/**
 * Confeti que cae balanceándose por toda la plaza.
 * @param ctx Contexto de dibujo.
 * @param timeMs Tiempo de la escena.
 */
function drawConfetti(ctx: RenderContext, timeMs: number): void {
  const seconds = timeMs / MS_PER_SECOND;
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const speed = 18 + hash(i, 1) * 20;
    const y = (hash(i, 2) * SCENE_HEIGHT + speed * seconds) % SCENE_HEIGHT;
    const x =
      (hash(i, 3) * SCENE_WIDTH + Math.sin(seconds * 2 + i) * 6 + SCENE_WIDTH) % SCENE_WIDTH;
    const flip = Math.floor(seconds * 6 + i) % 2 === 0;
    fillPixelRect(ctx, x, y, flip ? 2 : 1, flip ? 1 : 2, pick(CONFETTI, i, 6));
  }
}

/** Celebración de victorias olímpicas: podio, aros, aficionados y confeti. */
export const OLYMPICS: PlazaEvent = {
  kind: 'olympics',
  actors: (frame) => [
    { y: STAGE.foot, draw: (ctx) => drawStage(ctx, frame) },
    ...fans(frame),
    { y: Number.POSITIVE_INFINITY, draw: (ctx) => drawConfetti(ctx, frame.timeMs) },
  ],
};
