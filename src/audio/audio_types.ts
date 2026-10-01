/**
 * Subconjunto de la Web Audio API que usa el juego. Permite inyectar dobles de prueba;
 * un `AudioContext` real cumple estas interfaces.
 */

/** Parámetro automatizable (frecuencia, ganancia). */
export interface AudioParamLike {
  value: number;
  setValueAtTime(value: number, startTime: number): unknown;
  linearRampToValueAtTime(value: number, endTime: number): unknown;
  exponentialRampToValueAtTime(value: number, endTime: number): unknown;
}

/** Nodo de audio al que se puede conectar otro. */
export interface AudioNodeLike {
  connect(destination: AudioNodeLike): unknown;
}

/** Oscilador. */
export interface OscillatorLike extends AudioNodeLike {
  type: OscillatorType;
  readonly frequency: AudioParamLike;
  start(when: number): void;
  stop(when: number): void;
}

/** Nodo de ganancia (volumen). */
export interface GainLike extends AudioNodeLike {
  readonly gain: AudioParamLike;
}

/** Contexto de audio. */
export interface AudioContextLike {
  readonly currentTime: number;
  readonly destination: AudioNodeLike;
  readonly state: AudioContextState;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
  resume(): Promise<void>;
}

/** Temporizador periódico inyectable (en el navegador, `setInterval`). */
export type IntervalScheduler = (callback: () => void, intervalMs: number) => () => void;
