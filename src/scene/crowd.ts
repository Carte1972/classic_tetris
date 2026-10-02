import {
  GROUND_FAR_Y,
  GROUND_NEAR_Y,
  LAWN_EDGE,
  PIGEON_COUNT,
  PIGEON_RETURN_MS,
  PIGEON_SCARE_DISTANCE,
  SCENE_WIDTH,
  VANISHING_POINT,
  WALKER_COUNT,
  WALKER_SPEED,
} from '../config/scene_config';
import { nextRandom, normalizeSeed } from '../engine/random';

/** Milisegundos por segundo. */
const MS_PER_SECOND = 1000;

/** Margen fuera de la pantalla por el que entran y salen los paseantes (px). */
const OFFSCREEN_MARGIN = 24;

/** Escala mínima de un elemento muy lejano. */
const MIN_SCALE = 0.1;

/** Velocidad de vuelo de las palomas (px por segundo). */
const PIGEON_FLY_SPEED = 90;

/** Filas de la plaza donde se posan las palomas. */
const PIGEON_ROWS = { from: 300, to: 352 } as const;

/** Distancia mínima de una paloma al borde del césped o de la escena (px). */
const PIGEON_MARGIN = 12;

/** Tipos de paseante. */
export type WalkerKind = 'coat' | 'woman' | 'child' | 'tourist';

/** Tipos de paseante en orden fijo (para el sorteo). */
const WALKER_KINDS: readonly WalkerKind[] = ['coat', 'woman', 'child', 'tourist'];

/** Paseante de la plaza. */
export interface Walker {
  readonly kind: WalkerKind;
  /** Columna de los pies. */
  readonly x: number;
  /** Fila de los pies (profundidad). */
  readonly y: number;
  /** Sentido de la marcha: 1 a la derecha, -1 a la izquierda. */
  readonly direction: 1 | -1;
  /** Velocidad a escala cercana (px por segundo). */
  readonly speed: number;
  /** Variante de colores (índice en la paleta del tipo). */
  readonly palette: number;
  /** Distancia recorrida (para el ciclo de pasos). */
  readonly distance: number;
}

/** Paloma de la plaza. */
export interface Pigeon {
  readonly x: number;
  readonly y: number;
  /** Si está volando o posada. */
  readonly flying: boolean;
  /** Tiempo que lleva volando (ms). */
  readonly flightMs: number;
  /** Sentido del vuelo. */
  readonly direction: 1 | -1;
}

/** Estado de la gente y las palomas de la plaza. */
export interface CrowdState {
  readonly walkers: readonly Walker[];
  readonly pigeons: readonly Pigeon[];
  readonly rngState: number;
}

/**
 * Escala de un elemento según su fila (perspectiva): proporcional a la distancia al
 * punto de fuga, 1 en la fila más cercana.
 * @param y Fila de los pies.
 * @returns Escala entre el mínimo y 1.
 */
export function depthScale(y: number): number {
  const t = (y - VANISHING_POINT.y) / (GROUND_NEAR_Y - VANISHING_POINT.y);
  return Math.min(1, Math.max(MIN_SCALE, t));
}

/**
 * Primera columna transitable de una fila: a la izquierda están el césped y la muralla.
 * @param y Fila.
 * @returns Columna del borde del césped, o el margen exterior si la fila no lo toca.
 */
export function walkableLeft(y: number): number {
  if (y >= LAWN_EDGE.from.y) {
    return -OFFSCREEN_MARGIN;
  }
  const t = (LAWN_EDGE.from.y - y) / (LAWN_EDGE.from.y - LAWN_EDGE.to.y);
  return LAWN_EDGE.from.x + (LAWN_EDGE.to.x - LAWN_EDGE.from.x) * Math.min(1, t);
}

/**
 * Genera un paseante aleatorio.
 * @param rngState Estado del generador.
 * @param x Posición inicial como fracción de la parte transitable de su fila, o `null`
 *   para entrar por un lateral (o por el borde del césped).
 * @returns El paseante y el nuevo estado del generador.
 */
function spawnWalker(rngState: number, x: number | null): { walker: Walker; rngState: number } {
  const a = nextRandom(rngState);
  const b = nextRandom(a.state);
  const c = nextRandom(b.state);
  const d = nextRandom(c.state);
  const direction: 1 | -1 = b.value < 0.5 ? 1 : -1;
  // Más gente cerca que lejos: la plaza se ve llena en primer plano.
  const y = Math.round(GROUND_FAR_Y + Math.sqrt(c.value) * (GROUND_NEAR_Y - GROUND_FAR_Y));
  const left = walkableLeft(y);
  const startX =
    x === null
      ? direction === 1
        ? left
        : SCENE_WIDTH + OFFSCREEN_MARGIN
      : left + x * (SCENE_WIDTH - left);
  return {
    walker: {
      kind: WALKER_KINDS[Math.floor(a.value * WALKER_KINDS.length)] ?? 'coat',
      x: startX,
      y,
      direction,
      speed: WALKER_SPEED.min + d.value * (WALKER_SPEED.max - WALKER_SPEED.min),
      palette: Math.floor(((a.value * 997) % 1) * 4),
      distance: 0,
    },
    rngState: d.state,
  };
}

/**
 * Coloca una paloma posada en un punto aleatorio de la plaza.
 * @param rngState Estado del generador.
 * @returns La paloma y el nuevo estado del generador.
 */
function landPigeon(rngState: number): { pigeon: Pigeon; rngState: number } {
  const a = nextRandom(rngState);
  const b = nextRandom(a.state);
  const y = Math.round(PIGEON_ROWS.from + b.value * (PIGEON_ROWS.to - PIGEON_ROWS.from));
  const left = Math.max(PIGEON_MARGIN, walkableLeft(y) + PIGEON_MARGIN);
  return {
    pigeon: {
      x: Math.round(left + a.value * (SCENE_WIDTH - PIGEON_MARGIN - left)),
      y,
      flying: false,
      flightMs: 0,
      direction: a.value < 0.5 ? 1 : -1,
    },
    rngState: b.state,
  };
}

/**
 * Crea la plaza con los paseantes repartidos y las palomas posadas.
 * @param seed Semilla.
 * @returns Estado inicial.
 */
export function createCrowd(seed: number): CrowdState {
  let rngState = normalizeSeed(seed);
  const walkers: Walker[] = [];
  for (let i = 0; i < WALKER_COUNT; i++) {
    const position = nextRandom(rngState);
    const spawned = spawnWalker(position.state, position.value);
    walkers.push(spawned.walker);
    rngState = spawned.rngState;
  }
  const pigeons: Pigeon[] = [];
  for (let i = 0; i < PIGEON_COUNT; i++) {
    const landed = landPigeon(rngState);
    pigeons.push(landed.pigeon);
    rngState = landed.rngState;
  }
  return { walkers, pigeons, rngState };
}

/**
 * Avanza la plaza: los paseantes caminan (y se sustituyen al salir) y las palomas echan
 * a volar si alguien pasa cerca y vuelven a posarse al cabo de un rato.
 * @param crowd Estado actual.
 * @param dtMs Tiempo transcurrido.
 * @returns Nuevo estado.
 */
export function advanceCrowd(crowd: CrowdState, dtMs: number): CrowdState {
  const seconds = Math.max(0, dtMs) / MS_PER_SECOND;
  let rngState = crowd.rngState;
  const walkers = crowd.walkers.map((walker) => {
    const step = walker.speed * depthScale(walker.y) * seconds;
    const x = walker.x + walker.direction * step;
    if (x < walkableLeft(walker.y) - 1 || x > SCENE_WIDTH + OFFSCREEN_MARGIN + 1) {
      const spawned = spawnWalker(rngState, null);
      rngState = spawned.rngState;
      return spawned.walker;
    }
    return { ...walker, x, distance: walker.distance + step };
  });
  const pigeons = crowd.pigeons.map((pigeon) => {
    if (pigeon.flying) {
      const flightMs = pigeon.flightMs + dtMs;
      if (flightMs >= PIGEON_RETURN_MS) {
        const landed = landPigeon(rngState);
        rngState = landed.rngState;
        return landed.pigeon;
      }
      return {
        ...pigeon,
        flightMs,
        x: pigeon.x + pigeon.direction * PIGEON_FLY_SPEED * seconds,
        y: pigeon.y - PIGEON_FLY_SPEED * 0.6 * seconds,
      };
    }
    const scared = walkers.some(
      (walker) =>
        Math.abs(walker.x - pigeon.x) < PIGEON_SCARE_DISTANCE &&
        Math.abs(walker.y - pigeon.y) < PIGEON_SCARE_DISTANCE / 2,
    );
    return scared ? { ...pigeon, flying: true, flightMs: 0 } : pigeon;
  });
  return { walkers, pigeons, rngState };
}
