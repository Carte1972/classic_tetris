import { FIGURE_HEIGHT, FIGURE_WIDTH, type DanceMovement } from '../config/celebration_config';
import { ARMS_FRAMES, LOWER_BODY_FRAMES, mirrorMatrix } from './sprites/poses';
import type {
  ArmPose,
  CharacterDefinition,
  ColorRoles,
  LowerBodyPose,
  MatrixPoint,
  PixelMatrix,
} from './sprites/sprite_types';

/** Píxeles de un fotograma ya coloreados (`null` = transparente). */
export type PixelGrid = readonly (readonly (string | null)[])[];

/** Fotograma compuesto de un bailarín. */
export interface ComposedFigure {
  readonly grid: PixelGrid;
  /** Columna central de los pies. */
  readonly anchorX: number;
  /** Fila de los pies. */
  readonly bottomY: number;
  /** Fila por la que se parte la figura en dos (apertura de la matrioska). */
  readonly splitRow: number;
  /** Primera fila de las piernas. */
  readonly legsTop: number;
}

/** Píxel transparente en las matrices. */
const TRANSPARENT = '.';

/** Fila de las piernas rectas que se repite para alargarlas. */
const STRETCH_ROW = 3;

/** Lienzo mutable donde se pintan las partes. */
type Canvas = (string | null)[][];

/**
 * Pinta una matriz sobre el lienzo traduciendo cada papel a su color.
 * @param canvas Lienzo.
 * @param rows Matriz.
 * @param left Columna de la esquina superior izquierda.
 * @param top Fila de la esquina superior izquierda.
 * @param colors Colores del personaje.
 */
function paint(
  canvas: Canvas,
  rows: PixelMatrix,
  left: number,
  top: number,
  colors: ColorRoles,
): void {
  rows.forEach((row, dy) => {
    [...row].forEach((role, dx) => {
      if (role === TRANSPARENT) {
        return;
      }
      const color = colors[role];
      if (color === undefined) {
        throw new Error(`Papel de color sin definir: "${role}"`);
      }
      const line = canvas[top + dy];
      if (line !== undefined && left + dx >= 0 && left + dx < line.length) {
        line[left + dx] = color;
      }
    });
  });
}

/**
 * Ancho de una matriz.
 * @param rows Matriz.
 * @returns Número de columnas.
 */
function widthOf(rows: PixelMatrix): number {
  return rows[0]?.length ?? 0;
}

/**
 * Alarga las piernas rectas repitiendo una fila intermedia.
 * @param pose Pose de piernas.
 * @param extraRows Filas a añadir.
 * @returns Filas de la pose.
 */
function stretchLegs(pose: LowerBodyPose, extraRows: number): PixelMatrix {
  const row = pose.rows[STRETCH_ROW];
  if (!pose.stretchable || extraRows <= 0 || row === undefined) {
    return pose.rows;
  }
  return [
    ...pose.rows.slice(0, STRETCH_ROW),
    ...Array.from({ length: extraRows }, () => row),
    ...pose.rows.slice(STRETCH_ROW),
  ];
}

/**
 * Brazos cruzados sobre el pecho para unos hombros de un ancho dado.
 * @param shoulderWidth Ancho de los hombros.
 * @returns Matriz de los brazos.
 */
export function crossedArms(shoulderWidth: number): PixelMatrix {
  const gap = TRANSPARENT.repeat(shoulderWidth);
  const band = 'R'.repeat(shoulderWidth + 2);
  return [`RR${gap}RR`, `RR${gap}RR`, `S${band}S`, `${TRANSPARENT}${band}${TRANSPARENT}`];
}

/**
 * Pinta un brazo con su hombro en un punto del lienzo.
 * @param canvas Lienzo.
 * @param arm Pose del brazo (derecho).
 * @param mirrored Si es el brazo izquierdo (se refleja).
 * @param shoulder Punto del lienzo donde va el hombro.
 * @param colors Colores del personaje.
 * @returns Posición de la mano en el lienzo.
 */
function paintArm(
  canvas: Canvas,
  arm: ArmPose,
  mirrored: boolean,
  shoulder: MatrixPoint,
  colors: ColorRoles,
): MatrixPoint {
  const width = widthOf(arm.rows);
  const rows = mirrored ? mirrorMatrix(arm.rows) : arm.rows;
  const shoulderX = mirrored ? width - 1 - arm.shoulder.x : arm.shoulder.x;
  const handX = mirrored ? width - 1 - arm.hand.x : arm.hand.x;
  const left = shoulder.x - shoulderX;
  const top = shoulder.y - arm.shoulder.y;
  paint(canvas, rows, left, top, colors);
  return { x: left + handX, y: top + arm.hand.y };
}

/**
 * Compone un fotograma de un bailarín: piernas, torso, objeto del pecho, cabeza, brazos
 * y objeto de la mano, en ese orden, sobre una matriz de tamaño fijo.
 * @param character Bailarín.
 * @param movement Movimiento de la coreografía.
 * @param frame Fotograma del movimiento (0–5).
 * @returns El fotograma compuesto.
 */
export function composeFigure(
  character: CharacterDefinition,
  movement: DanceMovement,
  frame: number,
): ComposedFigure {
  const lower = LOWER_BODY_FRAMES[movement][frame];
  const armsPose = ARMS_FRAMES[movement][frame];
  if (lower === undefined || armsPose === undefined) {
    throw new RangeError(`Fotograma inexistente: ${movement} ${frame}`);
  }
  const { colors, head, torso } = character;
  const canvas: Canvas = Array.from({ length: FIGURE_HEIGHT }, () =>
    Array.from({ length: FIGURE_WIDTH }, () => null),
  );
  const anchorX = Math.floor(FIGURE_WIDTH / 2);
  const bottomY = FIGURE_HEIGHT - 1;

  const legs = stretchLegs(lower, character.legStretch ?? 0);
  const legsTop = bottomY - legs.length + 1;
  paint(canvas, legs, anchorX - lower.hipX, legsTop, colors);

  const torsoTop = legsTop - torso.length;
  paint(canvas, torso, anchorX - Math.floor(widthOf(torso) / 2), torsoTop, colors);
  if (character.chestProp !== undefined) {
    const prop = character.chestProp;
    paint(canvas, prop, anchorX - Math.floor(widthOf(prop) / 2), torsoTop + 1, colors);
  }
  paint(canvas, head, anchorX - Math.floor(widthOf(head) / 2), torsoTop - head.length, colors);

  const shoulderWidth = character.shoulderWidth ?? widthOf(torso);
  const shoulderLeft = anchorX - Math.floor(shoulderWidth / 2);
  const shoulderY = torsoTop + 1;
  let hand: MatrixPoint;
  if (armsPose.kind === 'crossed') {
    paint(canvas, crossedArms(shoulderWidth), shoulderLeft - 2, shoulderY, colors);
    hand = { x: shoulderLeft + shoulderWidth + 1, y: shoulderY + 2 };
  } else {
    paintArm(canvas, armsPose.left, true, { x: shoulderLeft - 1, y: shoulderY }, colors);
    hand = paintArm(
      canvas,
      armsPose.right,
      false,
      { x: shoulderLeft + shoulderWidth, y: shoulderY },
      colors,
    );
  }
  if (character.heldProp !== undefined) {
    const prop = character.heldProp;
    paint(canvas, prop, hand.x - Math.floor(widthOf(prop) / 2), hand.y - prop.length + 1, colors);
  }

  return {
    grid: canvas,
    anchorX,
    bottomY,
    splitRow: torsoTop + Math.floor(torso.length / 2),
    legsTop,
  };
}

/**
 * Colorea una matriz suelta (por ejemplo, el balón).
 * @param rows Matriz.
 * @param colors Colores.
 * @returns Píxeles coloreados.
 */
export function colorizeMatrix(rows: PixelMatrix, colors: ColorRoles): PixelGrid {
  const canvas: Canvas = rows.map((row) => Array.from({ length: row.length }, () => null));
  paint(canvas, rows, 0, 0, colors);
  return canvas;
}
