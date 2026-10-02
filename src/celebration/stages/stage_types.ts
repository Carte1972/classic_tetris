import type { RenderContext } from '../../render/render_context';

/** Ancho y alto de los escenarios de las celebraciones (px lógicos, 16:9). */
export const STAGE_SIZE = { width: 320, height: 180 } as const;

/** Fila del suelo donde apoyan los pies los bailarines. */
export const STAGE_GROUND_Y = 152;

/** Columna central donde bailan. */
export const STAGE_CENTER_X = 160;

/** Escenario de una celebración. */
export interface Stage {
  /** Nombre del lugar (se muestra junto al del bailarín). */
  readonly place: string;
  /** Dibuja el escenario completo en un instante (con sus elementos animados). */
  readonly draw: (ctx: RenderContext, timeMs: number) => void;
  /** Elementos que van por delante del bailarín (opcional). */
  readonly drawFront?: (ctx: RenderContext, timeMs: number) => void;
}
