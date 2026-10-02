import { WALL_FOOT } from '../../config/scene_config';
import type { Point } from '../pixel_shapes';

/** Franjas de la bandera de Rusia, de arriba abajo. */
export const RUSSIAN_FLAG = ['#f4f4f4', '#1f4fb0', '#d8202f'] as const;

/** Colores de piel de los figurantes. */
export const SKINS = ['#f1c7a0', '#d9a57c', '#e8b48f', '#f3d2b4'] as const;

/**
 * Pseudoaleatorio estable a partir de un índice (sin estado).
 * @param index Índice.
 * @param salt Variante.
 * @returns Valor en [0, 1).
 */
export function hash(index: number, salt = 0): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Elemento de una lista elegido de forma estable por índice.
 * @param list Lista no vacía.
 * @param index Índice.
 * @param salt Variante.
 * @returns Elemento.
 */
export function pick<T>(list: readonly T[], index: number, salt = 0): T {
  const item = list[Math.floor(hash(index, salt) * list.length)] ?? list[0];
  if (item === undefined) {
    throw new Error('Lista vacía');
  }
  return item;
}

/**
 * Fila del pie de la muralla en una columna (para colocar cosas sobre el césped).
 * @param x Columna.
 * @returns Fila.
 */
export function wallFootAt(x: number): number {
  const t = (x - WALL_FOOT.from.x) / (WALL_FOOT.to.x - WALL_FOOT.from.x);
  return WALL_FOOT.from.y + (WALL_FOOT.to.y - WALL_FOOT.from.y) * t;
}

/**
 * Punto de un recorrido de varios tramos rectos.
 * @param path Vértices del recorrido.
 * @param distance Distancia recorrida desde el primer vértice (px).
 * @returns Posición, o `null` si ya ha terminado el recorrido.
 */
export function alongPath(path: readonly Point[], distance: number): Point | null {
  let left = distance;
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    if (from === undefined || to === undefined) {
      continue;
    }
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    if (left <= length) {
      const t = length === 0 ? 0 : left / length;
      return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    }
    left -= length;
  }
  return null;
}

/**
 * Longitud total de un recorrido.
 * @param path Vértices.
 * @returns Longitud en píxeles.
 */
export function pathLength(path: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    if (from !== undefined && to !== undefined) {
      total += Math.hypot(to.x - from.x, to.y - from.y);
    }
  }
  return total;
}
