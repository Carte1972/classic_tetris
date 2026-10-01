import type { RenderContext } from '../../../src/render/render_context';

/** Llamada registrada a `fillRect`. */
export interface FillCall {
  readonly fillStyle: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Contexto 2D falso que registra los rectángulos dibujados. */
export function createFakeContext(): { ctx: RenderContext; calls: FillCall[] } {
  const calls: FillCall[] = [];
  const ctx: RenderContext = {
    fillStyle: '',
    fillRect(x: number, y: number, width: number, height: number) {
      const style = ctx.fillStyle;
      calls.push({
        fillStyle: typeof style === 'string' ? style : 'no-string',
        x,
        y,
        width,
        height,
      });
    },
  };
  return { ctx, calls };
}
