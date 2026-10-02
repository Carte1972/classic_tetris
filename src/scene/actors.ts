import type { RenderContext } from '../render/render_context';

/**
 * Elemento móvil o cercano de la plaza (paseante, paloma, farola, figurante de un
 * evento) que se dibuja ordenado por profundidad.
 */
export interface SceneActor {
  /** Fila de los pies: los de fila mayor (más cerca) se dibujan encima. */
  readonly y: number;
  readonly draw: (ctx: RenderContext) => void;
}

/**
 * Ordena los actores de lejos a cerca.
 * @param actors Actores.
 * @returns Copia ordenada por fila.
 */
export function sortByDepth(actors: readonly SceneActor[]): SceneActor[] {
  return [...actors].sort((a, b) => a.y - b.y);
}
