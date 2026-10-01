import { CELEBRATION_DURATION_MS } from '../config/celebration_config';
import { DANCERS } from './characters';
import type { CharacterDefinition } from './sprites/sprite_types';

/** Estado de una celebración en curso. */
export interface CelebrationState {
  /** Nivel alcanzado. */
  readonly level: number;
  /** Índice del bailarín en `DANCERS`. */
  readonly dancerIndex: number;
  /** Tiempo transcurrido (ms), entre 0 y la duración total. */
  readonly elapsedMs: number;
}

/**
 * Bailarín que corresponde a un nivel: `(nivel − 1) % número de personajes`, de forma
 * que el nivel 1 trae al primero y la lista se repite en rotación.
 * @param level Nivel alcanzado (1 o más).
 * @param count Número de bailarines.
 * @returns Índice del bailarín.
 */
export function selectDancerIndex(level: number, count: number = DANCERS.length): number {
  return (((level - 1) % count) + count) % count;
}

/**
 * Empieza la celebración de un nivel.
 * @param level Nivel alcanzado.
 * @returns Estado inicial de la celebración.
 */
export function startCelebration(level: number): CelebrationState {
  return { level, dancerIndex: selectDancerIndex(level), elapsedMs: 0 };
}

/**
 * Avanza la animación; no pasa de la duración total.
 * @param state Estado actual.
 * @param dtMs Tiempo transcurrido.
 * @returns Nuevo estado.
 */
export function advanceCelebration(state: CelebrationState, dtMs: number): CelebrationState {
  return {
    ...state,
    elapsedMs: Math.min(CELEBRATION_DURATION_MS, state.elapsedMs + Math.max(0, dtMs)),
  };
}

/**
 * Salta la celebración (Enter o Espacio).
 * @param state Estado actual.
 * @returns Estado terminado.
 */
export function skipCelebration(state: CelebrationState): CelebrationState {
  return { ...state, elapsedMs: CELEBRATION_DURATION_MS };
}

/**
 * Coloca la animación en un instante concreto (modo test y capturas).
 * @param state Estado actual.
 * @param elapsedMs Instante deseado.
 * @returns Nuevo estado.
 */
export function seekCelebration(state: CelebrationState, elapsedMs: number): CelebrationState {
  return { ...state, elapsedMs: Math.min(CELEBRATION_DURATION_MS, Math.max(0, elapsedMs)) };
}

/**
 * Indica si la celebración ha terminado.
 * @param state Estado actual.
 * @returns `true` si ya no queda animación.
 */
export function isCelebrationFinished(state: CelebrationState): boolean {
  return state.elapsedMs >= CELEBRATION_DURATION_MS;
}

/**
 * Bailarín de la celebración.
 * @param state Estado actual.
 * @returns Definición del personaje.
 */
export function getDancer(state: CelebrationState): CharacterDefinition {
  const dancer = DANCERS[state.dancerIndex];
  if (dancer === undefined) {
    throw new RangeError(`Bailarín inexistente: ${state.dancerIndex}`);
  }
  return dancer;
}
