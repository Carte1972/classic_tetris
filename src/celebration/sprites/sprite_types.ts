/**
 * Matriz de píxeles: cada cadena es una fila y cada carácter un píxel. `.` es
 * transparente; el resto de caracteres son papeles de color que cada personaje traduce
 * a colores concretos (por ejemplo `S` piel, `T` torso, `P` piernas, `B` botas).
 */
export type PixelMatrix = readonly string[];

/** Colores de cada papel de un personaje. */
export type ColorRoles = Readonly<Record<string, string>>;

/** Punto dentro de una matriz (columna, fila). */
export interface MatrixPoint {
  readonly x: number;
  readonly y: number;
}

/** Pose de la parte inferior del cuerpo (piernas y botas). */
export interface LowerBodyPose {
  readonly rows: PixelMatrix;
  /** Columna (frontera entre píxeles) que queda bajo el centro de la cadera. */
  readonly hipX: number;
  /** Si las piernas están rectas y se pueden alargar (personajes altos). */
  readonly stretchable: boolean;
}

/** Pose de un brazo (el derecho; el izquierdo es su reflejo). */
export interface ArmPose {
  readonly rows: PixelMatrix;
  /** Píxel que se une al hombro. */
  readonly shoulder: MatrixPoint;
  /** Píxel de la mano (para sostener objetos). */
  readonly hand: MatrixPoint;
}

/** Posición de los brazos en un fotograma. */
export type ArmsPose =
  | { readonly kind: 'crossed' }
  | { readonly kind: 'separate'; readonly left: ArmPose; readonly right: ArmPose };

/** Identificadores de los personajes. */
export type CharacterId =
  | 'cossack'
  | 'matryoshka'
  | 'matryoshkaSmall'
  | 'bear'
  | 'babushka'
  | 'cosmonaut'
  | 'chessMaster'
  | 'basketballGiant'
  | 'ballerina';

/** Definición de un personaje bailarín. */
export interface CharacterDefinition {
  readonly id: CharacterId;
  readonly colors: ColorRoles;
  readonly head: PixelMatrix;
  readonly torso: PixelMatrix;
  /** Ancho de los hombros (por defecto, el del torso). */
  readonly shoulderWidth?: number;
  /** Filas extra para alargar las piernas rectas (personajes altos). */
  readonly legStretch?: number;
  /** Objeto colgado sobre el pecho, debajo de los brazos (p. ej., una balalaika). */
  readonly chestProp?: PixelMatrix;
  /** Objeto sostenido en la mano derecha (p. ej., una pieza de ajedrez). */
  readonly heldProp?: PixelMatrix;
  /** Balón que bota a su lado. */
  readonly ball?: PixelMatrix;
  /** Si se tambalea durante la prisiadka. */
  readonly wobbles?: boolean;
  /** Personaje que sale de dentro al abrirse (matrioska). */
  readonly opensInto?: CharacterDefinition;
}
