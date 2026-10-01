/** Subconjunto del contexto 2D que usa el render (permite dobles de prueba). */
export type RenderContext = Pick<CanvasRenderingContext2D, 'fillStyle' | 'fillRect'>;

/** Tamaño de un canvas en píxeles lógicos. */
export interface CanvasSize {
  readonly width: number;
  readonly height: number;
}
