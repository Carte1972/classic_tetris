/**
 * Une una secuencia de fotogramas PNG (frame_00000.png…) en un vídeo H.264.
 * @param framesDir Carpeta de los fotogramas.
 * @param output Vídeo de salida (.mp4).
 * @param fps Fotogramas por segundo.
 */
export function encodeFrames(framesDir: string, output: string, fps: number): void;

/**
 * Vacía (o crea) una carpeta.
 * @param dir Carpeta.
 */
export function resetDir(dir: string): void;

/**
 * Extrae un fotograma de un vídeo a PNG.
 * @param video Vídeo.
 * @param seconds Instante.
 * @param output PNG de salida.
 * @param width Ancho final.
 * @param height Alto final.
 */
export function extractFrame(
  video: string,
  seconds: number,
  output: string,
  width: number,
  height: number,
): void;
