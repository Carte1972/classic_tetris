import { CELEBRATION_DURATION_MS, LEVEL_BANNER_DURATION_MS } from '../config/celebration_config';
import { DANCERS } from './characters';
import type { CharacterDefinition } from './sprites/sprite_types';

/** Tipo de transición entre niveles: baile completo o solo el rótulo del nivel. */
export type CelebrationKind = 'dance' | 'banner';

/** Estado de una celebración en curso. */
export interface CelebrationState {
  /** Nivel alcanzado. */
  readonly level: number;
  readonly kind: CelebrationKind;
  /** Índice del bailarín en `DANCERS`. */
  readonly dancerIndex: number;
  /** Tiempo transcurrido (ms), entre 0 y la duración total. */
  readonly elapsedMs: number;
  /** Duración total (ms). */
  readonly durationMs: number;
}

/** Datos para empezar una celebración. */
export interface CelebrationStart {
  /** Nivel alcanzado. */
  readonly level: number;
  /** Niveles superados en la partida, incluido este (1 = el primero). */
  readonly levelsCompleted: number;
  /** Si hay baile (celebraciones activadas) o solo el rótulo del nivel. */
  readonly dance: boolean;
}

/**
 * Bailarín que corresponde a cada nivel superado: `(niveles superados − 1) % número de
 * personajes`, de forma que el primer nivel superado trae al primero y la lista se
 * repite en rotación.
 * @param levelsCompleted Niveles superados en la partida (1 o más).
 * @param count Número de bailarines.
 * @returns Índice del bailarín.
 */
export function selectDancerIndex(levelsCompleted: number, count: number = DANCERS.length): number {
  return (((levelsCompleted - 1) % count) + count) % count;
}

/**
 * Empieza la celebración de un nivel superado.
 * @param start Nivel, niveles superados y si hay baile.
 * @returns Estado inicial de la celebración.
 */
export function startCelebration(start: CelebrationStart): CelebrationState {
  return {
    level: start.level,
    kind: start.dance ? 'dance' : 'banner',
    dancerIndex: selectDancerIndex(start.levelsCompleted),
    elapsedMs: 0,
    durationMs: start.dance ? CELEBRATION_DURATION_MS : LEVEL_BANNER_DURATION_MS,
  };
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
    elapsedMs: Math.min(state.durationMs, state.elapsedMs + Math.max(0, dtMs)),
  };
}

/**
 * Salta la celebración (Enter o Espacio).
 * @param state Estado actual.
 * @returns Estado terminado.
 */
export function skipCelebration(state: CelebrationState): CelebrationState {
  return { ...state, elapsedMs: state.durationMs };
}

/**
 * Coloca la animación en un instante concreto (modo test y capturas).
 * @param state Estado actual.
 * @param elapsedMs Instante deseado.
 * @returns Nuevo estado.
 */
export function seekCelebration(state: CelebrationState, elapsedMs: number): CelebrationState {
  return { ...state, elapsedMs: Math.min(state.durationMs, Math.max(0, elapsedMs)) };
}

/**
 * Indica si la celebración ha terminado.
 * @param state Estado actual.
 * @returns `true` si ya no queda animación.
 */
export function isCelebrationFinished(state: CelebrationState): boolean {
  return state.elapsedMs >= state.durationMs;
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
