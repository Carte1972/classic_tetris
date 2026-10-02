import type { RenderContext } from '../../render/render_context';
import { fillPixelRect, type Point } from '../../scene/pixel_shapes';
import { rotateAround } from '../puppet/puppet_renderer';
import type { Skeleton } from '../puppet/skeleton';

/** Anchura mínima (giro) a partir de la cual se ve la cara. */
const FACE_VISIBLE_FROM = 0.2;

/**
 * Indica si el personaje está de frente lo suficiente para ver su cara.
 * @param skeleton Esqueleto.
 * @returns `true` si se ve la cara.
 */
export function faceVisible(skeleton: Skeleton): boolean {
  return skeleton.spinScale > FACE_VISIBLE_FROM;
}

/**
 * Punto relativo a un centro del cuerpo, siguiendo inclinación y giro.
 * @param skeleton Esqueleto.
 * @param center Centro de referencia (cabeza, pecho o cadera).
 * @param point Punto relativo.
 * @param angle Ángulo de giro (por defecto, el del torso).
 * @returns Punto en el escenario.
 */
export function bodyPoint(
  skeleton: Skeleton,
  center: Point,
  point: Point,
  angle: number = skeleton.lean,
): Point {
  return rotateAround(point, center, angle, skeleton.spinScale);
}

/**
 * Pinta un rectángulo de píxeles relativo a la cabeza.
 * @param ctx Contexto de dibujo.
 * @param skeleton Esqueleto.
 * @param point Esquina relativa al centro de la cabeza.
 * @param width Ancho.
 * @param height Alto.
 * @param color Color.
 */
export function headPixel(
  ctx: RenderContext,
  skeleton: Skeleton,
  point: Point,
  width: number,
  height: number,
  color: string,
): void {
  const p = bodyPoint(skeleton, skeleton.head, point, skeleton.lean + skeleton.headTilt);
  fillPixelRect(ctx, p.x, p.y, width, height, color);
}

/** Opciones de los ojos. */
export interface EyeOptions {
  /** Separación desde el centro (px). */
  readonly spread: number;
  /** Altura respecto al centro de la cabeza (px). */
  readonly y: number;
  readonly color: string;
  /** Blanco del ojo (ojos grandes y expresivos). */
  readonly white?: string;
}

/**
 * Dibuja los ojos del personaje.
 * @param ctx Contexto de dibujo.
 * @param skeleton Esqueleto.
 * @param options Posición y colores.
 */
export function drawEyes(ctx: RenderContext, skeleton: Skeleton, options: EyeOptions): void {
  for (const side of [-1, 1]) {
    if (options.white !== undefined) {
      headPixel(
        ctx,
        skeleton,
        { x: side * options.spread - 1, y: options.y - 1 },
        3,
        3,
        options.white,
      );
    }
    headPixel(ctx, skeleton, { x: side * options.spread, y: options.y }, 1, 2, options.color);
  }
}

/**
 * Dibuja una boca sonriente.
 * @param ctx Contexto de dibujo.
 * @param skeleton Esqueleto.
 * @param y Altura respecto al centro de la cabeza.
 * @param color Color.
 */
export function drawSmile(ctx: RenderContext, skeleton: Skeleton, y: number, color: string): void {
  headPixel(ctx, skeleton, { x: -2, y }, 1, 1, color);
  headPixel(ctx, skeleton, { x: -1, y: y + 1 }, 3, 1, color);
  headPixel(ctx, skeleton, { x: 2, y }, 1, 1, color);
}
