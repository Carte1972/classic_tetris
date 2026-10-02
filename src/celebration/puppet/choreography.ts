import { blendPoses, type Pose } from './skeleton';

/** Movimientos de la coreografía, en orden. */
export type DanceMove = 'enter' | 'prisiadka' | 'spin' | 'jump' | 'kicks' | 'bow' | 'exit';

/** Tramo de la coreografía. */
export interface DanceSegment {
  readonly move: DanceMove;
  /** Duración (ms). */
  readonly durationMs: number;
}

/**
 * Coreografía completa (10 s): entrada bailando, prisiadka con patadas alternas, giro,
 * salto abierto tocándose las puntas de los pies, segunda tanda de patadas con palmas,
 * reverencia y salida saludando.
 */
export const DANCE_SEGMENTS: readonly DanceSegment[] = [
  { move: 'enter', durationMs: 1500 },
  { move: 'prisiadka', durationMs: 2600 },
  { move: 'spin', durationMs: 1000 },
  { move: 'jump', durationMs: 1100 },
  { move: 'kicks', durationMs: 1900 },
  { move: 'bow', durationMs: 900 },
  { move: 'exit', durationMs: 1000 },
];

/** Duración total de la coreografía (ms). */
export const DANCE_DURATION_MS = DANCE_SEGMENTS.reduce((sum, s) => sum + s.durationMs, 0);

/** Tiempo de fundido entre movimientos para que no haya saltos (ms). */
const BLEND_MS = 160;

/** Distancia de entrada y salida respecto al centro (px). */
export const TRAVEL_DISTANCE = 190;

/** Duración de una patada de la prisiadka (ms). */
const KICK_MS = 430;

/** Duración de una patada de la segunda tanda, más rápida (ms). */
const FAST_KICK_MS = 320;

/** Ángulo recto (rad). */
const RIGHT = Math.PI / 2;

/** Postura de pie, relajada. */
export const STANDING: Pose = {
  x: 0,
  lift: 0,
  lean: 0,
  headTilt: 0,
  armLeft: { upper: 0.25, fore: 0.1 },
  armRight: { upper: 0.25, fore: 0.1 },
  legLeft: { thigh: 0.08, shin: 0 },
  legRight: { thigh: 0.08, shin: 0 },
  spin: 0,
};

/** Brazos cruzados sobre el pecho (los antebrazos se cruzan por delante). */
const CROSSED_ARMS = {
  armLeft: { upper: 0.55, fore: -2.4 },
  armRight: { upper: 0.55, fore: -2.4 },
} as const;

/** Manos en la cintura. */
const HANDS_ON_HIPS = {
  armLeft: { upper: 0.9, fore: -2.3 },
  armRight: { upper: 0.9, fore: -2.3 },
} as const;

/** Agachado sobre los talones (base de la prisiadka). */
const SQUAT_LEG = { thigh: 1.45, shin: -2.65 } as const;

/** Pierna estirada hacia delante y a un lado (patada de la prisiadka). */
const KICK_LEG = { thigh: 1.25, shin: 0.05 } as const;

/**
 * Suaviza una transición (0–1) con aceleración y frenada.
 * @param t Proporción lineal.
 * @returns Proporción suavizada.
 */
export function ease(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Postura de prisiadka con una patada: una pierna agachada y la otra estirada.
 * @param phase Fase de la patada (0–1); las patadas alternan de pierna.
 * @param kickIndex Número de patada (par: derecha, impar: izquierda).
 * @param arms Posición de los brazos.
 * @returns La postura.
 */
function kickPose(
  phase: number,
  kickIndex: number,
  arms: Pick<Pose, 'armLeft' | 'armRight'>,
): Pose {
  const extension = Math.sin(phase * Math.PI);
  const kicking = {
    thigh: SQUAT_LEG.thigh + (KICK_LEG.thigh - SQUAT_LEG.thigh) * extension,
    shin: SQUAT_LEG.shin + (KICK_LEG.shin - SQUAT_LEG.shin) * extension,
  };
  const right = kickIndex % 2 === 0;
  return {
    ...STANDING,
    ...arms,
    lift: 0,
    lean: (right ? -0.06 : 0.06) * extension,
    headTilt: (right ? 0.08 : -0.08) * extension,
    legLeft: right ? SQUAT_LEG : kicking,
    legRight: right ? kicking : SQUAT_LEG,
  };
}

/**
 * Postura de un movimiento en un instante.
 * @param move Movimiento.
 * @param elapsedMs Tiempo desde que empezó el movimiento.
 * @param durationMs Duración del movimiento.
 * @returns La postura.
 */
function movePose(move: DanceMove, elapsedMs: number, durationMs: number): Pose {
  const t = Math.min(1, Math.max(0, elapsedMs / durationMs));
  switch (move) {
    case 'enter':
    case 'exit': {
      const step = Math.sin((elapsedMs / 250) * Math.PI);
      const travel = move === 'enter' ? -TRAVEL_DISTANCE * (1 - t) : TRAVEL_DISTANCE * t;
      const wave = move === 'exit' ? Math.sin(elapsedMs / 120) * 0.35 : 0;
      return {
        ...STANDING,
        x: travel,
        lift: Math.abs(step) * 3,
        lean: step * 0.05,
        armLeft: { upper: move === 'enter' ? 2.5 + step * 0.2 : 0.3, fore: 0.3 },
        armRight: move === 'enter' ? { upper: 0.9, fore: -2.3 } : { upper: 2.7 + wave, fore: 0.4 },
        legLeft: { thigh: 0.1 + Math.max(0, step) * 0.7, shin: -Math.max(0, step) * 1.2 },
        legRight: { thigh: 0.1 + Math.max(0, -step) * 0.7, shin: -Math.max(0, -step) * 1.2 },
      };
    }
    case 'prisiadka':
      return kickPose(
        (elapsedMs % KICK_MS) / KICK_MS,
        Math.floor(elapsedMs / KICK_MS),
        CROSSED_ARMS,
      );
    case 'kicks': {
      const clap = Math.sin((elapsedMs / FAST_KICK_MS) * Math.PI * 2) > 0;
      const arms = clap
        ? { armLeft: { upper: 1.9, fore: 1.0 }, armRight: { upper: 1.9, fore: 1.0 } }
        : HANDS_ON_HIPS;
      return kickPose(
        (elapsedMs % FAST_KICK_MS) / FAST_KICK_MS,
        Math.floor(elapsedMs / FAST_KICK_MS),
        arms,
      );
    }
    case 'spin':
      return {
        ...STANDING,
        lift: Math.sin(t * Math.PI) * 4,
        armLeft: { upper: RIGHT + 0.2, fore: 0.1 },
        armRight: { upper: RIGHT + 0.2, fore: 0.1 },
        legLeft: { thigh: 0.05, shin: 0 },
        legRight: { thigh: 0.35, shin: -0.6 },
        spin: ease(t),
      };
    case 'jump': {
      // Agacharse, despegar, abrir las piernas tocándose las puntas y aterrizar.
      const crouch = t < 0.2 ? t / 0.2 : t > 0.85 ? (1 - t) / 0.15 : 0;
      const air = t >= 0.2 && t <= 0.85 ? Math.sin(((t - 0.2) / 0.65) * Math.PI) : 0;
      const split = ease(air * 1.6);
      return {
        ...STANDING,
        lift: air * 42,
        lean: 0,
        headTilt: 0,
        // Al abrir las piernas, los brazos van hacia las puntas de los pies.
        armLeft: { upper: 2.6 - split * (2.6 - (RIGHT - 0.3)), fore: 0 },
        armRight: { upper: 2.6 - split * (2.6 - (RIGHT - 0.3)), fore: 0 },
        legLeft: { thigh: 0.1 + crouch * 1.2 + split * (RIGHT - 0.1), shin: -crouch * 2.2 },
        legRight: { thigh: 0.1 + crouch * 1.2 + split * (RIGHT - 0.1), shin: -crouch * 2.2 },
      };
    }
    case 'bow': {
      const depth = Math.sin(t * Math.PI);
      return {
        ...STANDING,
        lean: depth * 0.55,
        headTilt: depth * 0.3,
        armLeft: { upper: 0.2 + depth * 0.3, fore: 0 },
        armRight: { upper: 0.2 + depth * 1.2, fore: depth * 0.8 },
      };
    }
  }
}

/** Punto de la coreografía en un instante. */
export interface DanceFrame {
  readonly move: DanceMove;
  /** Tiempo desde que empezó el movimiento (ms). */
  readonly moveElapsedMs: number;
  /** Proporción del movimiento (0–1). */
  readonly moveProgress: number;
  readonly pose: Pose;
}

/**
 * Postura de la coreografía en un instante, con fundido entre movimientos.
 * @param elapsedMs Tiempo desde el inicio de la celebración.
 * @param segments Tramos de la coreografía.
 * @returns Movimiento y postura.
 */
export function getDanceFrame(
  elapsedMs: number,
  segments: readonly DanceSegment[] = DANCE_SEGMENTS,
): DanceFrame {
  let start = 0;
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    if (segment === undefined) {
      continue;
    }
    const end = start + segment.durationMs;
    if (elapsedMs < end || index === segments.length - 1) {
      const local = Math.min(segment.durationMs, Math.max(0, elapsedMs - start));
      const pose = movePose(segment.move, local, segment.durationMs);
      const previous = segments[index - 1];
      if (previous !== undefined && local < BLEND_MS) {
        const from = movePose(previous.move, previous.durationMs, previous.durationMs);
        return {
          move: segment.move,
          moveElapsedMs: local,
          moveProgress: local / segment.durationMs,
          // El desplazamiento y el giro no se mezclan para que no "resbale".
          pose: { ...blendPoses(from, pose, ease(local / BLEND_MS)), x: pose.x, spin: pose.spin },
        };
      }
      return {
        move: segment.move,
        moveElapsedMs: local,
        moveProgress: local / segment.durationMs,
        pose,
      };
    }
    start = end;
  }
  throw new Error('La coreografía está vacía');
}
