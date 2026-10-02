import type { RenderContext } from '../../render/render_context';
import { fillEllipse, fillPolygon, type Point } from '../../scene/pixel_shapes';
import type { Skeleton } from './skeleton';

/** Forma que compone el cuerpo de un personaje. */
export type BodyShape =
  | {
      readonly kind: 'capsule';
      readonly from: Point;
      readonly to: Point;
      readonly radius: number;
      readonly color: string;
      /** Color de sombra del lado derecho (da volumen). */
      readonly shade?: string;
    }
  | { readonly kind: 'polygon'; readonly points: readonly Point[]; readonly color: string }
  | {
      readonly kind: 'ellipse';
      readonly center: Point;
      readonly rx: number;
      readonly ry: number;
      readonly color: string;
      readonly shade?: string;
    };

/** Cuerpo de un personaje en un fotograma: formas con contorno y detalles encima. */
export interface BodyDrawing {
  readonly shapes: readonly BodyShape[];
  /** Detalles sin contorno (cara, botones, dibujos de la ropa…). */
  readonly details?: (ctx: RenderContext) => void;
  /** Objetos que van por delante de todo (balón, pieza de ajedrez…). */
  readonly props?: (ctx: RenderContext) => void;
}

/** Color del contorno de las figuras. */
export const OUTLINE_COLOR = '#1b1220';

/**
 * Cápsula rellena (segmento con extremos redondeados), pintada por filas.
 * @param ctx Contexto de dibujo.
 * @param from Extremo inicial.
 * @param to Extremo final.
 * @param radius Radio.
 * @param color Color.
 */
export function fillCapsule(
  ctx: RenderContext,
  from: Point,
  to: Point,
  radius: number,
  color: string,
): void {
  if (radius <= 0) {
    return;
  }
  ctx.fillStyle = color;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSq = dx * dx + dy * dy;
  const top = Math.floor(Math.min(from.y, to.y) - radius);
  const bottom = Math.ceil(Math.max(from.y, to.y) + radius);
  const left = Math.floor(Math.min(from.x, to.x) - radius);
  const right = Math.ceil(Math.max(from.x, to.x) + radius);
  const radiusSq = radius * radius;
  const inside = (px: number, py: number): boolean => {
    const t =
      lengthSq === 0
        ? 0
        : Math.min(1, Math.max(0, ((px - from.x) * dx + (py - from.y) * dy) / lengthSq));
    const cx = from.x + dx * t - px;
    const cy = from.y + dy * t - py;
    return cx * cx + cy * cy <= radiusSq;
  };
  for (let y = top; y <= bottom; y++) {
    let start: number | null = null;
    for (let x = left; x <= right + 1; x++) {
      const hit = x <= right && inside(x + 0.5, y + 0.5);
      if (hit && start === null) {
        start = x;
      } else if (!hit && start !== null) {
        ctx.fillRect(start, y, x - start, 1);
        start = null;
      }
    }
  }
}

/**
 * Dibuja una forma con un margen (para el contorno) o con su color y sombra.
 * @param ctx Contexto de dibujo.
 * @param shape Forma.
 * @param grow Píxeles de más alrededor (contorno) o 0.
 * @param outline Si se pinta como contorno.
 */
function drawShape(ctx: RenderContext, shape: BodyShape, grow: number, outline: boolean): void {
  switch (shape.kind) {
    case 'capsule': {
      fillCapsule(
        ctx,
        shape.from,
        shape.to,
        shape.radius + grow,
        outline ? OUTLINE_COLOR : shape.color,
      );
      if (!outline && shape.shade !== undefined && shape.radius >= 2) {
        const offset = shape.radius * 0.5;
        fillCapsule(
          ctx,
          { x: shape.from.x + offset, y: shape.from.y },
          { x: shape.to.x + offset, y: shape.to.y },
          shape.radius * 0.5,
          shape.shade,
        );
      }
      return;
    }
    case 'ellipse': {
      fillEllipse(
        ctx,
        shape.center.x,
        shape.center.y,
        shape.rx + grow,
        shape.ry + grow,
        outline ? OUTLINE_COLOR : shape.color,
      );
      if (!outline && shape.shade !== undefined && shape.rx >= 3) {
        fillEllipse(
          ctx,
          shape.center.x + shape.rx * 0.45,
          shape.center.y,
          shape.rx * 0.5,
          shape.ry * 0.85,
          shape.shade,
        );
      }
      return;
    }
    case 'polygon': {
      if (outline) {
        const center = shape.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), {
          x: 0,
          y: 0,
        });
        const cx = center.x / shape.points.length;
        const cy = center.y / shape.points.length;
        const grown = shape.points.map((p) => {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const length = Math.hypot(dx, dy) || 1;
          return { x: p.x + (dx / length) * grow, y: p.y + (dy / length) * grow };
        });
        fillPolygon(ctx, grown, OUTLINE_COLOR);
      } else {
        fillPolygon(ctx, shape.points, shape.color);
      }
      return;
    }
  }
}

/**
 * Dibuja un personaje: contorno común de toda la silueta, relleno con sombreado,
 * detalles y objetos.
 * @param ctx Contexto de dibujo.
 * @param drawing Cuerpo del personaje en este fotograma.
 */
export function drawBody(ctx: RenderContext, drawing: BodyDrawing): void {
  drawing.shapes.forEach((shape) => drawShape(ctx, shape, 1, true));
  drawing.shapes.forEach((shape) => drawShape(ctx, shape, 0, false));
  drawing.details?.(ctx);
  drawing.props?.(ctx);
}

/**
 * Gira un punto alrededor de un centro.
 * @param point Punto (relativo al centro, sin girar).
 * @param center Centro de giro.
 * @param angle Ángulo (rad).
 * @param scaleX Escala horizontal (giro sobre sí mismo).
 * @returns Punto girado en el escenario.
 */
export function rotateAround(point: Point, center: Point, angle: number, scaleX = 1): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: center.x + (point.x * cos - point.y * sin) * scaleX,
    y: center.y + point.x * sin + point.y * cos,
  };
}

/**
 * Convierte puntos relativos a la cabeza en puntos del escenario (siguen su inclinación).
 * @param skeleton Esqueleto.
 * @param points Puntos relativos al centro de la cabeza.
 * @returns Puntos en el escenario.
 */
export function headPoints(skeleton: Skeleton, points: readonly Point[]): Point[] {
  const angle = skeleton.lean + skeleton.headTilt;
  return points.map((p) => rotateAround(p, skeleton.head, angle, skeleton.spinScale));
}

/**
 * Punto a lo largo de un segmento.
 * @param from Inicio.
 * @param to Fin.
 * @param t Proporción (0–1).
 * @returns Punto intermedio.
 */
export function along(from: Point, to: Point, t: number): Point {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}
