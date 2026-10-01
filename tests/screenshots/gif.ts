import type { Page } from '@playwright/test';
import gifenc from 'gifenc';

const { applyPalette, GIFEncoder, quantize } = gifenc;

/** Colores máximos de la paleta de cada fotograma. */
const GIF_COLORS = 128;

/** Fotograma ya reducido, en RGBA. */
export interface GifFrame {
  readonly rgba: Uint8Array;
  readonly width: number;
  readonly height: number;
}

/**
 * Captura la página y la reduce al tamaño indicado. La decodificación del PNG se hace en
 * el propio navegador (canvas), así no hace falta ninguna librería de imágenes.
 */
export async function captureFrame(page: Page, width: number, height: number): Promise<GifFrame> {
  const png = (await page.screenshot({ animations: 'disabled' })).toString('base64');
  const base64 = await page.evaluate(
    async ({ data, w, h }) => {
      const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      const canvas = new OffscreenCanvas(w, h);
      const context = canvas.getContext('2d');
      if (context === null) {
        throw new Error('Sin contexto 2D');
      }
      context.drawImage(bitmap, 0, 0, w, h);
      const pixels = context.getImageData(0, 0, w, h).data;
      let binary = '';
      for (let i = 0; i < pixels.length; i += 0x8000) {
        binary += String.fromCharCode(...pixels.subarray(i, i + 0x8000));
      }
      return btoa(binary);
    },
    { data: png, w: width, h: height },
  );
  return { rgba: Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)), width, height };
}

/** Codifica los fotogramas como GIF en bucle. */
export function encodeGif(frames: readonly GifFrame[], delayMs: number): Uint8Array {
  const gif = GIFEncoder();
  for (const frame of frames) {
    const palette = quantize(frame.rgba, GIF_COLORS);
    gif.writeFrame(applyPalette(frame.rgba, palette), frame.width, frame.height, {
      palette,
      delay: delayMs,
    });
  }
  gif.finish();
  return gif.bytes();
}
