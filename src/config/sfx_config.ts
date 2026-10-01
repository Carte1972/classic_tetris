/** Forma de onda de los sonidos sintetizados (chiptune). */
export type Waveform = 'square' | 'triangle';

/** Tramo de un efecto: un tono, opcionalmente con barrido de frecuencia. */
export interface SfxStep {
  readonly waveform: Waveform;
  /** Frecuencia inicial (Hz). */
  readonly frequency: number;
  /** Frecuencia final (Hz); si se indica, la frecuencia se desliza hasta ella. */
  readonly endFrequency?: number;
  /** Duración del tramo (s). */
  readonly duration: number;
  /** Volumen del tramo (0–1). */
  readonly volume: number;
}

/** Efectos de sonido del juego. */
export type SfxName = 'move' | 'rotate' | 'lock' | 'lineClear' | 'tetris' | 'levelUp' | 'gameOver';

/** Definición de cada efecto como sucesión de tramos. */
export const SFX_DEFINITIONS: Readonly<Record<SfxName, readonly SfxStep[]>> = {
  move: [{ waveform: 'square', frequency: 660, duration: 0.025, volume: 0.25 }],
  rotate: [{ waveform: 'square', frequency: 520, endFrequency: 880, duration: 0.05, volume: 0.25 }],
  lock: [{ waveform: 'triangle', frequency: 180, endFrequency: 70, duration: 0.09, volume: 0.9 }],
  lineClear: [
    { waveform: 'square', frequency: 523, duration: 0.06, volume: 0.35 },
    { waveform: 'square', frequency: 659, duration: 0.06, volume: 0.35 },
    { waveform: 'square', frequency: 784, duration: 0.12, volume: 0.35 },
  ],
  tetris: [
    { waveform: 'square', frequency: 523, duration: 0.06, volume: 0.4 },
    { waveform: 'square', frequency: 659, duration: 0.06, volume: 0.4 },
    { waveform: 'square', frequency: 784, duration: 0.06, volume: 0.4 },
    { waveform: 'square', frequency: 1047, duration: 0.06, volume: 0.4 },
    { waveform: 'square', frequency: 1319, endFrequency: 1568, duration: 0.25, volume: 0.4 },
  ],
  levelUp: [
    { waveform: 'square', frequency: 392, duration: 0.08, volume: 0.35 },
    { waveform: 'square', frequency: 523, duration: 0.08, volume: 0.35 },
    { waveform: 'square', frequency: 659, duration: 0.08, volume: 0.35 },
    { waveform: 'square', frequency: 784, duration: 0.08, volume: 0.35 },
    { waveform: 'square', frequency: 659, duration: 0.08, volume: 0.35 },
    { waveform: 'square', frequency: 1047, duration: 0.3, volume: 0.35 },
  ],
  gameOver: [
    { waveform: 'square', frequency: 659, endFrequency: 523, duration: 0.25, volume: 0.35 },
    { waveform: 'square', frequency: 494, endFrequency: 392, duration: 0.25, volume: 0.35 },
    { waveform: 'square', frequency: 349, endFrequency: 262, duration: 0.3, volume: 0.35 },
    { waveform: 'triangle', frequency: 196, endFrequency: 98, duration: 0.6, volume: 0.9 },
  ],
};
