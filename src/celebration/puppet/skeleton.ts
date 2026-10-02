import type { Point } from '../../scene/pixel_shapes';

/** Anchura relativa mínima de la figura al girar (de perfil). */
const MIN_SPIN_WIDTH = 0.38;

/** Ángulos de un brazo: el superior respecto a la vertical hacia abajo (positivo hacia fuera) y el antebrazo respecto al brazo. */
export interface ArmAngles {
  readonly upper: number;
  readonly fore: number;
}

/** Ángulos de una pierna: el muslo respecto a la vertical (positivo hacia fuera) y la espinilla respecto al muslo. */
export interface LegAngles {
  readonly thigh: number;
  readonly shin: number;
}

/** Postura completa del muñeco en un instante. */
export interface Pose {
  /** Desplazamiento horizontal respecto a su posición en el escenario (px). */
  readonly x: number;
  /** Altura sobre el suelo del pie más bajo (px): mayor que 0 en los saltos. */
  readonly lift: number;
  /** Inclinación del torso (rad; positivo hacia la derecha de la pantalla). */
  readonly lean: number;
  /** Inclinación de la cabeza respecto al torso (rad). */
  readonly headTilt: number;
  readonly armLeft: ArmAngles;
  readonly armRight: ArmAngles;
  readonly legLeft: LegAngles;
  readonly legRight: LegAngles;
  /** Giro sobre sí mismo (vueltas): la figura se estrecha y se refleja al girar. */
  readonly spin: number;
}

/** Medidas del cuerpo de un personaje (px). */
export interface Proportions {
  readonly torso: number;
  readonly neck: number;
  readonly headRadius: number;
  readonly shoulderHalf: number;
  readonly hipHalf: number;
  readonly upperArm: number;
  readonly forearm: number;
  readonly thigh: number;
  readonly shin: number;
}

/** Posiciones de las articulaciones de un lado. */
export interface LimbJoints {
  readonly root: Point;
  readonly middle: Point;
  readonly end: Point;
}

/** Esqueleto ya colocado en el escenario. */
export interface Skeleton {
  readonly pelvis: Point;
  readonly chest: Point;
  readonly head: Point;
  readonly armLeft: LimbJoints;
  readonly armRight: LimbJoints;
  readonly legLeft: LimbJoints;
  readonly legRight: LimbJoints;
  /** Escala horizontal por el giro (1 de frente, 0 de perfil, -1 de espaldas). */
  readonly spinScale: number;
  /** Inclinación del torso usada. */
  readonly lean: number;
  readonly headTilt: number;
}

/**
 * Vector unitario de un miembro: ángulo 0 hacia abajo y positivo hacia fuera del lado.
 * @param angle Ángulo (rad).
 * @param side -1 izquierda, 1 derecha.
 * @returns Vector unitario.
 */
function limbVector(angle: number, side: -1 | 1): Point {
  return { x: side * Math.sin(angle), y: Math.cos(angle) };
}

/**
 * Calcula un miembro de dos segmentos.
 * @param root Articulación de partida.
 * @param first Ángulo del primer segmento.
 * @param second Ángulo del segundo respecto al primero.
 * @param lengths Longitudes de los dos segmentos.
 * @param side Lado del cuerpo.
 * @returns Las tres articulaciones.
 */
function limb(
  root: Point,
  first: number,
  second: number,
  lengths: readonly [number, number],
  side: -1 | 1,
): LimbJoints {
  const a = limbVector(first, side);
  const middle = { x: root.x + a.x * lengths[0], y: root.y + a.y * lengths[0] };
  const b = limbVector(first + second, side);
  return { root, middle, end: { x: middle.x + b.x * lengths[1], y: middle.y + b.y * lengths[1] } };
}

/**
 * Coloca el esqueleto: cinemática directa a partir de la postura, con los pies apoyados
 * en el suelo salvo que la postura levante al personaje.
 * @param pose Postura.
 * @param body Medidas del cuerpo.
 * @param baseX Columna del escenario donde está el personaje.
 * @param groundY Fila del suelo.
 * @returns El esqueleto colocado.
 */
export function solveSkeleton(
  pose: Pose,
  body: Proportions,
  baseX: number,
  groundY: number,
): Skeleton {
  const turn = Math.cos(pose.spin * Math.PI * 2);
  // De perfil la figura se estrecha, pero no tanto como para quedarse en una línea.
  const spinScale = (turn < 0 ? -1 : 1) * Math.max(MIN_SPIN_WIDTH, Math.abs(turn));
  const origin = { x: 0, y: 0 };
  const legs = (pelvis: Point) => ({
    left: limb(
      { x: pelvis.x - body.hipHalf, y: pelvis.y },
      pose.legLeft.thigh,
      pose.legLeft.shin,
      [body.thigh, body.shin],
      -1,
    ),
    right: limb(
      { x: pelvis.x + body.hipHalf, y: pelvis.y },
      pose.legRight.thigh,
      pose.legRight.shin,
      [body.thigh, body.shin],
      1,
    ),
  });
  const draft = legs(origin);
  const lowestFoot = Math.max(
    draft.left.end.y,
    draft.right.end.y,
    draft.left.middle.y,
    draft.right.middle.y,
  );
  const pelvis = { x: baseX + pose.x, y: groundY - pose.lift - lowestFoot };
  const scaleX = (point: Point): Point => ({
    x: pelvis.x + (point.x - pelvis.x) * spinScale,
    y: point.y,
  });
  const up = { x: Math.sin(pose.lean), y: -Math.cos(pose.lean) };
  const across = { x: Math.cos(pose.lean), y: Math.sin(pose.lean) };
  const chest = { x: pelvis.x + up.x * body.torso, y: pelvis.y + up.y * body.torso };
  const headAngle = pose.lean + pose.headTilt;
  const headDistance = body.neck + body.headRadius;
  const head = {
    x: chest.x + Math.sin(headAngle) * headDistance,
    y: chest.y - Math.cos(headAngle) * headDistance,
  };
  const shoulder = (side: -1 | 1): Point => ({
    x: chest.x + across.x * body.shoulderHalf * side,
    y: chest.y + across.y * body.shoulderHalf * side,
  });
  const arm = (side: -1 | 1, angles: ArmAngles): LimbJoints =>
    limb(
      shoulder(side),
      angles.upper + pose.lean * side,
      angles.fore,
      [body.upperArm, body.forearm],
      side,
    );
  const placedLegs = legs(pelvis);
  const mapLimb = (joints: LimbJoints): LimbJoints => ({
    root: scaleX(joints.root),
    middle: scaleX(joints.middle),
    end: scaleX(joints.end),
  });
  return {
    pelvis,
    chest: scaleX(chest),
    head: scaleX(head),
    armLeft: mapLimb(arm(-1, pose.armLeft)),
    armRight: mapLimb(arm(1, pose.armRight)),
    legLeft: mapLimb(placedLegs.left),
    legRight: mapLimb(placedLegs.right),
    spinScale,
    lean: pose.lean,
    headTilt: pose.headTilt,
  };
}

/**
 * Interpola linealmente entre dos posturas.
 * @param from Postura inicial.
 * @param to Postura final.
 * @param t Proporción de la final (0–1).
 * @returns Postura intermedia.
 */
export function blendPoses(from: Pose, to: Pose, t: number): Pose {
  const mix = (a: number, b: number): number => a + (b - a) * t;
  return {
    x: mix(from.x, to.x),
    lift: mix(from.lift, to.lift),
    lean: mix(from.lean, to.lean),
    headTilt: mix(from.headTilt, to.headTilt),
    armLeft: {
      upper: mix(from.armLeft.upper, to.armLeft.upper),
      fore: mix(from.armLeft.fore, to.armLeft.fore),
    },
    armRight: {
      upper: mix(from.armRight.upper, to.armRight.upper),
      fore: mix(from.armRight.fore, to.armRight.fore),
    },
    legLeft: {
      thigh: mix(from.legLeft.thigh, to.legLeft.thigh),
      shin: mix(from.legLeft.shin, to.legLeft.shin),
    },
    legRight: {
      thigh: mix(from.legRight.thigh, to.legRight.thigh),
      shin: mix(from.legRight.shin, to.legRight.shin),
    },
    spin: mix(from.spin, to.spin),
  };
}
