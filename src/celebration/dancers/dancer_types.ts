import type { RenderContext } from '../../render/render_context';
import type { DanceMove } from '../puppet/choreography';
import type { BodyShape } from '../puppet/puppet_renderer';
import type { Proportions, Skeleton } from '../puppet/skeleton';

/** Momento de la coreografía que necesitan los detalles animados. */
export interface DancerFrame {
  /** Tiempo desde el inicio de la celebración (ms). */
  readonly elapsedMs: number;
  readonly move: DanceMove;
  /** Tiempo desde que empezó el movimiento actual (ms). */
  readonly moveElapsedMs: number;
  readonly moveProgress: number;
}

/** Ropa de un personaje humanoide. */
export interface Outfit {
  readonly skin: string;
  readonly skinShade: string;
  readonly shirt: string;
  readonly shirtShade: string;
  /** Color de las mangas (por defecto, el de la camisa). */
  readonly sleeve?: string;
  readonly pants: string;
  readonly pantsShade: string;
  readonly boots: string;
  /** Radio de brazos y piernas (px). */
  readonly armRadius: number;
  readonly legRadius: number;
  /** Semiancho del torso en la cintura (en los hombros se usa el de las proporciones). */
  readonly waistHalf: number;
  /** Parte de la espinilla cubierta por la bota (0–1). */
  readonly bootCover: number;
  /** Abrigo largo o falda que tapa los muslos. */
  readonly skirt?: {
    readonly color: string;
    readonly shade: string;
    /** Largo por debajo de la cadera (px). */
    readonly length: number;
    /** Vuelo: semiancho en el bajo (px). */
    readonly hemHalf: number;
  };
}

/** Partes extra de un personaje: formas con contorno, detalles y objetos. */
export interface DancerParts {
  readonly shapes?: readonly BodyShape[];
  readonly details?: (ctx: RenderContext) => void;
  readonly props?: (ctx: RenderContext) => void;
}

/** Definición completa de un bailarín. */
export interface DancerDefinition {
  readonly id: string;
  /** Nombre que se muestra en la celebración. */
  readonly name: string;
  readonly body: Proportions;
  readonly outfit: Outfit;
  /** Cabeza: pelo, gorro, cara (se dibuja sobre el óvalo de piel). */
  readonly head: (skeleton: Skeleton, frame: DancerFrame) => DancerParts;
  /** Partes que van detrás del cuerpo (capa, mochila…). */
  readonly behind?: (skeleton: Skeleton, frame: DancerFrame) => DancerParts;
  /** Partes del torso que van encima de la ropa, antes de los brazos. */
  readonly torso?: (skeleton: Skeleton, frame: DancerFrame) => DancerParts;
  /** Objetos y detalles finales (balón, pieza de ajedrez, balalaika…). */
  readonly front?: (skeleton: Skeleton, frame: DancerFrame) => DancerParts;
  /** Escala de la altura del salto (los cosmonautas saltan más). */
  readonly jumpScale?: number;
  /** Si se tambalea en la prisiadka (la bailarina). */
  readonly wobbles?: boolean;
}
