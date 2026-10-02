import type { RenderContext } from '../../render/render_context';
import { fillCircle, fillPixelRect, mixColors, withAlpha } from '../pixel_shapes';

/** Altura de un adulto en la fila más cercana de la plaza (px), como los paseantes. */
export const FIGURE_HEIGHT = 30;

/** Tocado de una figura. */
export type Headwear = 'none' | 'cap' | 'helmet' | 'sailor' | 'scarf' | 'kokoshnik' | 'mitre';

/** Colores y ropa de una figura. */
export interface FigureStyle {
  /** Chaqueta, abrigo o vestido. */
  readonly body: string;
  readonly legs: string;
  readonly skin: string;
  readonly headwear: Headwear;
  /** Color del tocado. */
  readonly hat: string;
  /** Falda o túnica larga hasta los pies (sin piernas a la vista). */
  readonly long?: boolean;
  /** Barba blanca (Ded Moroz, sacerdotes). */
  readonly beard?: boolean;
}

/** Objeto que lleva una figura en la mano. */
export type FigureProp =
  | { readonly kind: 'rifle' }
  | { readonly kind: 'flag'; readonly stripes: readonly string[]; readonly wave: number }
  | { readonly kind: 'candle'; readonly flicker: number }
  | { readonly kind: 'banner'; readonly color: string; readonly trim: string }
  | { readonly kind: 'icon' }
  | { readonly kind: 'cross' }
  | { readonly kind: 'staff' };

/** Postura de una figura. */
export interface FigurePose {
  /** Fase del paso, de −1 a 1 (0 = parada). */
  readonly stride: number;
  /** Brazos: abajo, levantados o uno saludando. */
  readonly arms: 'down' | 'up' | 'wave';
  /** Fase del saludo o del salto (radianes). */
  readonly phase?: number;
  /** Altura del salto en fracción de la altura (fans celebrando). */
  readonly jump?: number;
  readonly prop?: FigureProp;
  /** Oscurecimiento de noche (0–1). */
  readonly night?: number;
}

/** Color hacia el que se oscurecen las figuras de noche. */
const NIGHT_COLOR = '#0a0f2e';

/** Color de la llama de una vela. */
const FLAME = { core: '#fff3b0', glow: '#ffc24a' } as const;

/** Colores de los objetos de madera, metal y oro. */
const PROP_COLORS = {
  wood: '#5a3a22',
  metal: '#2a2a30',
  gold: '#e8b947',
  icon: '#7a3a1a',
} as const;

/**
 * Dibuja una figura de pie o caminando, del tamaño indicado, con su tocado y lo que
 * lleve en la mano. Pensada para figurantes de los eventos (a tamaño de paseante).
 * @param ctx Contexto de dibujo.
 * @param x Columna del centro.
 * @param footY Fila de los pies.
 * @param height Altura total sin tocado (px).
 * @param style Ropa y colores.
 * @param pose Postura.
 */
export function drawFigure(
  ctx: RenderContext,
  x: number,
  footY: number,
  height: number,
  style: FigureStyle,
  pose: FigurePose,
): void {
  const night = pose.night ?? 0;
  const shade = (color: string): string => mixColors(color, NIGHT_COLOR, night * 0.6);
  const h = Math.max(5, height);
  const cx = Math.round(x);
  const feet = Math.round(footY - (pose.jump ?? 0) * h);
  const width = Math.max(2, Math.round(h * 0.32));
  const half = Math.floor(width / 2);
  const headRadius = Math.max(1, h * 0.11);
  const legTop = feet - Math.round(h * 0.32);
  const bodyTop = feet - Math.round(h * 0.78);
  const headY = bodyTop - headRadius;
  const legWidth = Math.max(1, Math.floor(width / 3));
  const step = Math.round(pose.stride * Math.max(1, h * 0.12));

  if (style.long === true) {
    fillPixelRect(ctx, cx - half - 1, bodyTop, width + 2, feet - bodyTop, shade(style.body));
    fillPixelRect(ctx, cx - half, bodyTop, width, feet - bodyTop, shade(style.body));
  } else {
    fillPixelRect(
      ctx,
      cx - Math.ceil(width / 4) + step,
      legTop,
      legWidth,
      feet - legTop,
      shade(style.legs),
    );
    fillPixelRect(
      ctx,
      cx + Math.floor(width / 6) - step,
      legTop,
      legWidth,
      feet - legTop,
      shade(style.legs),
    );
    fillPixelRect(ctx, cx - half, bodyTop, width, legTop - bodyTop + 1, shade(style.body));
  }

  // Brazos (líneas de 1 px) y manos.
  const armLength = Math.round(h * 0.34);
  const shoulderY = bodyTop + 1;
  const hands: { x: number; y: number }[] = [];
  const phase = pose.phase ?? 0;
  for (const side of [-1, 1] as const) {
    const shoulderX = side === -1 ? cx - half - 1 : cx + half;
    const raised = pose.arms === 'up' || (pose.arms === 'wave' && side === 1);
    if (raised) {
      const sway = pose.arms === 'wave' ? Math.round(Math.sin(phase) * 2) : 0;
      const handY = shoulderY - armLength;
      fillPixelRect(ctx, shoulderX + sway, handY, 1, armLength, shade(style.body));
      hands.push({ x: shoulderX + sway, y: handY });
    } else {
      fillPixelRect(ctx, shoulderX, shoulderY, 1, armLength, shade(style.body));
      hands.push({ x: shoulderX, y: shoulderY + armLength });
    }
  }
  hands.forEach((hand) => fillPixelRect(ctx, hand.x, hand.y, 1, 1, shade(style.skin)));

  // Cabeza, barba y tocado.
  fillCircle(ctx, cx, headY, headRadius, shade(style.skin));
  if (style.beard === true) {
    fillPixelRect(
      ctx,
      cx - Math.ceil(headRadius),
      Math.round(headY),
      Math.ceil(headRadius) * 2 + 1,
      Math.round(headRadius * 1.6),
      shade('#f2f2f2'),
    );
  }
  drawHeadwear(ctx, cx, headY, headRadius, style, shade);

  if (pose.prop !== undefined) {
    const hand = hands[1] ?? { x: cx, y: shoulderY };
    drawProp(ctx, hand, h, pose.prop, shade, night);
  }
}

/**
 * Dibuja el tocado de una figura.
 * @param ctx Contexto de dibujo.
 * @param cx Centro x de la cabeza.
 * @param headY Centro y de la cabeza.
 * @param r Radio de la cabeza.
 * @param style Estilo de la figura.
 * @param shade Oscurecimiento nocturno.
 */
function drawHeadwear(
  ctx: RenderContext,
  cx: number,
  headY: number,
  r: number,
  style: FigureStyle,
  shade: (color: string) => string,
): void {
  const left = cx - Math.ceil(r);
  const width = Math.ceil(r) * 2 + 1;
  const top = Math.round(headY - r);
  const hat = shade(style.hat);
  switch (style.headwear) {
    case 'none':
      return;
    case 'cap':
      fillPixelRect(ctx, left - 1, top, width + 2, Math.max(1, Math.round(r * 0.8)), hat);
      return;
    case 'helmet':
      fillPixelRect(ctx, left, top - 1, width, Math.max(2, Math.round(r * 1.1)), hat);
      return;
    case 'sailor':
      fillPixelRect(
        ctx,
        left - 1,
        top,
        width + 2,
        Math.max(1, Math.round(r * 0.6)),
        shade('#f4f4f4'),
      );
      return;
    case 'scarf':
      fillPixelRect(ctx, left, top, width, Math.max(1, Math.round(r * 1.2)), hat);
      return;
    case 'kokoshnik':
      fillPixelRect(
        ctx,
        left - 1,
        top - Math.round(r),
        width + 2,
        Math.max(2, Math.round(r * 1.4)),
        hat,
      );
      fillPixelRect(ctx, cx, top - Math.round(r), 1, 1, shade(PROP_COLORS.gold));
      return;
    case 'mitre':
      fillPixelRect(
        ctx,
        left,
        top - Math.round(r * 1.2),
        width,
        Math.max(2, Math.round(r * 1.9)),
        shade(PROP_COLORS.gold),
      );
      fillPixelRect(
        ctx,
        cx,
        top - Math.round(r * 1.6),
        1,
        Math.max(1, Math.round(r * 0.5)),
        shade(PROP_COLORS.gold),
      );
      return;
  }
}

/**
 * Dibuja lo que lleva una figura en la mano.
 * @param ctx Contexto de dibujo.
 * @param hand Posición de la mano.
 * @param hand.x Columna.
 * @param hand.y Fila.
 * @param h Altura de la figura.
 * @param prop Objeto.
 * @param shade Oscurecimiento nocturno.
 * @param night Nivel de noche (las velas brillan más).
 */
function drawProp(
  ctx: RenderContext,
  hand: { readonly x: number; readonly y: number },
  h: number,
  prop: FigureProp,
  shade: (color: string) => string,
  night: number,
): void {
  const unit = Math.max(1, Math.round(h / 15));
  switch (prop.kind) {
    case 'rifle':
      fillPixelRect(
        ctx,
        hand.x,
        hand.y - Math.round(h * 0.55),
        1,
        Math.round(h * 0.6),
        shade(PROP_COLORS.metal),
      );
      return;
    case 'flag': {
      const poleTop = hand.y - Math.round(h * 0.7);
      fillPixelRect(ctx, hand.x, poleTop, 1, Math.round(h * 0.75), shade(PROP_COLORS.wood));
      const flagWidth = Math.max(3, Math.round(h * 0.45));
      const stripe = Math.max(1, Math.round(h * 0.09));
      for (let col = 0; col < flagWidth; col++) {
        const wave = Math.round(Math.sin(prop.wave + col * 0.6) * unit * 0.6);
        prop.stripes.forEach((color, i) => {
          fillPixelRect(
            ctx,
            hand.x + 1 + col,
            poleTop + wave + i * stripe,
            1,
            stripe,
            shade(color),
          );
        });
      }
      return;
    }
    case 'candle': {
      const flameY = hand.y - unit * 2;
      fillPixelRect(ctx, hand.x, hand.y - unit, 1, unit + 1, shade('#f2ead2'));
      const glow = 0.08 + 0.17 * night;
      fillCircle(ctx, hand.x, flameY, unit * 1.6 + prop.flicker * 0.5, withAlpha(FLAME.glow, glow));
      fillPixelRect(ctx, hand.x, flameY - unit + 1, 1, unit, FLAME.core);
      return;
    }
    case 'banner': {
      const poleTop = hand.y - Math.round(h * 0.9);
      fillPixelRect(ctx, hand.x, poleTop, 1, Math.round(h * 0.95), shade(PROP_COLORS.wood));
      const w = Math.max(3, Math.round(h * 0.36));
      const bannerH = Math.max(4, Math.round(h * 0.42));
      fillPixelRect(ctx, hand.x - Math.floor(w / 2), poleTop + 1, w, bannerH, shade(prop.trim));
      fillPixelRect(
        ctx,
        hand.x - Math.floor(w / 2) + 1,
        poleTop + 2,
        w - 2,
        bannerH - 2,
        shade(prop.color),
      );
      fillPixelRect(ctx, hand.x, poleTop - unit, 1, unit, shade(PROP_COLORS.gold));
      return;
    }
    case 'icon': {
      const w = Math.max(3, Math.round(h * 0.25));
      const iconH = Math.max(4, Math.round(h * 0.32));
      fillPixelRect(
        ctx,
        hand.x - Math.floor(w / 2),
        hand.y - iconH,
        w,
        iconH,
        shade(PROP_COLORS.gold),
      );
      fillPixelRect(
        ctx,
        hand.x - Math.floor(w / 2) + 1,
        hand.y - iconH + 1,
        w - 2,
        iconH - 2,
        shade(PROP_COLORS.icon),
      );
      return;
    }
    case 'staff': {
      const top = hand.y - Math.round(h * 0.75);
      fillPixelRect(ctx, hand.x, top, 1, Math.round(h * 0.8), shade('#d8d0b8'));
      fillPixelRect(ctx, hand.x - unit, top - unit, unit * 2 + 1, unit * 2, shade('#9ad0f0'));
      return;
    }
    case 'cross': {
      const top = hand.y - Math.round(h * 0.6);
      fillPixelRect(ctx, hand.x, top, 1, Math.round(h * 0.62), shade(PROP_COLORS.gold));
      fillPixelRect(ctx, hand.x - unit, top + unit, unit * 2 + 1, 1, shade(PROP_COLORS.gold));
      return;
    }
  }
}
