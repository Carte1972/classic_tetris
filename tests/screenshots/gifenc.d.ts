/** Tipos mínimos de `gifenc` (el paquete no los incluye). */
declare module 'gifenc' {
  /** Paleta: lista de colores [r, g, b]. */
  export type Palette = number[][];

  /** Codificador de GIF en memoria. */
  export interface GifEncoder {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: { palette?: Palette; delay?: number; repeat?: number },
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  export function GIFEncoder(): GifEncoder;
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number): Palette;
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette): Uint8Array;

  /** El paquete se publica como CommonJS: desde ESM se importa como objeto por defecto. */
  const gifenc: {
    readonly GIFEncoder: typeof GIFEncoder;
    readonly quantize: typeof quantize;
    readonly applyPalette: typeof applyPalette;
  };
  export default gifenc;
}
