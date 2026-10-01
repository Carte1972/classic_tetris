import type { DanceMovement } from '../../config/celebration_config';
import type { ArmPose, ArmsPose, LowerBodyPose, PixelMatrix } from './sprite_types';

/**
 * Refleja una matriz horizontalmente.
 * @param rows Matriz original.
 * @returns Matriz reflejada.
 */
export function mirrorMatrix(rows: PixelMatrix): PixelMatrix {
  return rows.map((row) => [...row].reverse().join(''));
}

/**
 * Refleja una pose de piernas.
 * @param pose Pose original.
 * @returns Pose reflejada, con la cadera en su sitio.
 */
function mirrorLower(pose: LowerBodyPose): LowerBodyPose {
  const width = pose.rows[0]?.length ?? 0;
  return { ...pose, rows: mirrorMatrix(pose.rows), hipX: width - pose.hipX };
}

/** De pie. */
const STAND: LowerBodyPose = {
  hipX: 6,
  stretchable: true,
  rows: [
    '..PPPPPPPP..',
    '..PPPPPPPP..',
    '..PPP..PPP..',
    '..PPP..PPP..',
    '..PPP..PPP..',
    '..PPP..PPP..',
    '..BBB..BBB..',
    '..BBB..BBB..',
    '.BBBB..BBBB.',
  ],
};

/** Piernas abiertas (paso de baile). */
const APART: LowerBodyPose = {
  hipX: 7,
  stretchable: true,
  rows: [
    '...PPPPPPPP...',
    '...PPPPPPPP...',
    '..PPP....PPP..',
    '..PPP....PPP..',
    '.PPP......PPP.',
    '.PPP......PPP.',
    '.BBB......BBB.',
    '.BBB......BBB.',
    'BBBB......BBBB',
  ],
};

/** Rodilla derecha levantada. */
const KNEE_UP_RIGHT: LowerBodyPose = {
  hipX: 6,
  stretchable: true,
  rows: [
    '..PPPPPPPP....',
    '..PPPPPPPPPPP.',
    '..PPP..PPPPPP.',
    '..PPP.....PPP.',
    '..PPP.....BBB.',
    '..PPP.....BBB.',
    '..BBB.........',
    '..BBB.........',
    '.BBBB.........',
  ],
};

/** Agachado (base de la prisiadka). */
const SQUAT: LowerBodyPose = {
  hipX: 7,
  stretchable: false,
  rows: ['..PPPPPPPPPP..', '.PPPPPPPPPPPP.', 'PPPP......PPPP', 'BBB........BBB', 'BBBB......BBBB'],
};

/** Agachado lanzando la pierna derecha a medias. */
const KICK_HALF_RIGHT: LowerBodyPose = {
  hipX: 7,
  stretchable: false,
  rows: [
    '..PPPPPPPPPP....',
    '.PPPPPPPPPPPPP..',
    'PPPP.......PPPP.',
    'BBB..........PPB',
    'BBBB..........BB',
  ],
};

/** Agachado con la pierna derecha estirada al frente. */
const KICK_FULL_RIGHT: LowerBodyPose = {
  hipX: 7,
  stretchable: false,
  rows: [
    '..PPPPPPPPPP....BB',
    '.PPPPPPPPPPPPPPPBB',
    'PPPP......PPPPPPBB',
    'BBB...............',
    'BBBB..............',
  ],
};

/** Piernas en V en el aire. */
const HALF_SPLIT: LowerBodyPose = {
  hipX: 9,
  stretchable: false,
  rows: [
    '....PPPPPPPPPP....',
    '...PPPP....PPPP...',
    '..PPP........PPP..',
    '.PPP..........PPP.',
    'BBB............BBB',
    'BB..............BB',
  ],
};

/** Salto abierto con las piernas en horizontal. */
const SPLIT: LowerBodyPose = {
  hipX: 13,
  stretchable: false,
  rows: ['BB.......PPPPPPPP.......BB', 'BBPPPPPPPPPPPPPPPPPPPPPPBB', 'BBPPPPPPPPPPPPPPPPPPPPPPBB'],
};

/** Brazo caído junto al cuerpo. */
const ARM_DOWN: ArmPose = {
  rows: ['RR', 'RR', 'RR', 'RR', 'RR', 'SS'],
  shoulder: { x: 0, y: 0 },
  hand: { x: 0, y: 5 },
};

/** Brazo abierto hacia abajo. */
const ARM_OUT: ArmPose = {
  rows: ['RR...', '.RR..', '..RR.', '...SS'],
  shoulder: { x: 0, y: 0 },
  hand: { x: 3, y: 3 },
};

/** Brazo levantado. */
const ARM_UP: ArmPose = {
  rows: ['SS', 'RR', 'RR', 'RR', 'RR', 'RR', 'RR'],
  shoulder: { x: 0, y: 6 },
  hand: { x: 0, y: 0 },
};

/** Brazo levantado y abierto (saludo). */
const ARM_UP_OUT: ArmPose = {
  rows: ['...SS', '..RR.', '..RR.', '.RR..', '.RR..', 'RR...'],
  shoulder: { x: 0, y: 5 },
  hand: { x: 3, y: 0 },
};

/** Brazo estirado en horizontal. */
const ARM_REACH: ArmPose = {
  rows: ['RRRRRRRS', 'RRRRRRRS'],
  shoulder: { x: 0, y: 0 },
  hand: { x: 7, y: 0 },
};

/** Brazo estirado hacia las puntas de los pies. */
const ARM_REACH_DOWN: ArmPose = {
  rows: ['RRR.....', '..RRR...', '....RRR.', '......SS'],
  shoulder: { x: 0, y: 0 },
  hand: { x: 6, y: 3 },
};

/** Brazos cruzados sobre el pecho (postura clásica de la prisiadka). */
const CROSSED: ArmsPose = { kind: 'crossed' };

/**
 * Brazos separados.
 * @param left Pose del brazo izquierdo (se refleja).
 * @param right Pose del brazo derecho.
 * @returns La pose de brazos.
 */
function arms(left: ArmPose, right: ArmPose): ArmsPose {
  return { kind: 'separate', left, right };
}

/** Piernas de cada fotograma de cada movimiento (6 fotogramas por movimiento). */
export const LOWER_BODY_FRAMES: Readonly<Record<DanceMovement, readonly LowerBodyPose[]>> = {
  enter: [STAND, APART, KNEE_UP_RIGHT, STAND, APART, mirrorLower(KNEE_UP_RIGHT)],
  prisiadka: [
    SQUAT,
    KICK_HALF_RIGHT,
    KICK_FULL_RIGHT,
    SQUAT,
    mirrorLower(KICK_HALF_RIGHT),
    mirrorLower(KICK_FULL_RIGHT),
  ],
  jump: [SQUAT, STAND, HALF_SPLIT, SPLIT, HALF_SPLIT, SQUAT],
  exit: [STAND, APART, KNEE_UP_RIGHT, STAND, APART, mirrorLower(KNEE_UP_RIGHT)],
};

/** Brazos de cada fotograma de cada movimiento (6 fotogramas por movimiento). */
export const ARMS_FRAMES: Readonly<Record<DanceMovement, readonly ArmsPose[]>> = {
  enter: [
    arms(ARM_UP_OUT, ARM_DOWN),
    arms(ARM_UP_OUT, ARM_OUT),
    arms(ARM_UP, ARM_DOWN),
    arms(ARM_DOWN, ARM_UP_OUT),
    arms(ARM_OUT, ARM_UP_OUT),
    arms(ARM_DOWN, ARM_UP),
  ],
  prisiadka: [CROSSED, CROSSED, CROSSED, CROSSED, CROSSED, CROSSED],
  jump: [
    CROSSED,
    arms(ARM_UP, ARM_UP),
    arms(ARM_REACH, ARM_REACH),
    arms(ARM_REACH_DOWN, ARM_REACH_DOWN),
    arms(ARM_REACH, ARM_REACH),
    arms(ARM_DOWN, ARM_DOWN),
  ],
  exit: [
    arms(ARM_DOWN, ARM_UP),
    arms(ARM_DOWN, ARM_UP_OUT),
    arms(ARM_DOWN, ARM_UP),
    arms(ARM_DOWN, ARM_UP_OUT),
    arms(ARM_DOWN, ARM_UP),
    arms(ARM_DOWN, ARM_UP_OUT),
  ],
};
