import { ENVELOPE_ATTACK_S, ENVELOPE_RELEASE_S } from '../config/audio_config';
import type { Waveform } from '../config/sfx_config';
import type { AudioContextLike, AudioNodeLike } from './audio_types';

/** Ganancia mínima para las rampas exponenciales (no admiten 0). */
const SILENCE_GAIN = 0.0001;

/** Tono a sintetizar. */
export interface ToneOptions {
  readonly waveform: Waveform;
  /** Frecuencia inicial (Hz). */
  readonly frequency: number;
  /** Frecuencia final (Hz) para barridos. */
  readonly endFrequency?: number;
  /** Instante de inicio en el reloj del contexto (s). */
  readonly startTime: number;
  /** Duración (s). */
  readonly duration: number;
  /** Volumen (0–1). */
  readonly volume: number;
}

/**
 * Programa un tono chiptune con envolvente corta de ataque y caída.
 * @param context Contexto de audio.
 * @param destination Nodo al que se conecta el tono.
 * @param tone Parámetros del tono.
 */
export function playTone(
  context: AudioContextLike,
  destination: AudioNodeLike,
  tone: ToneOptions,
): void {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const endTime = tone.startTime + tone.duration;
  const releaseStart = Math.max(tone.startTime + ENVELOPE_ATTACK_S, endTime - ENVELOPE_RELEASE_S);

  oscillator.type = tone.waveform;
  oscillator.frequency.setValueAtTime(tone.frequency, tone.startTime);
  if (tone.endFrequency !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, endTime);
  }
  envelope.gain.setValueAtTime(SILENCE_GAIN, tone.startTime);
  envelope.gain.linearRampToValueAtTime(tone.volume, tone.startTime + ENVELOPE_ATTACK_S);
  envelope.gain.setValueAtTime(tone.volume, releaseStart);
  envelope.gain.linearRampToValueAtTime(SILENCE_GAIN, endTime);

  oscillator.connect(envelope);
  envelope.connect(destination);
  oscillator.start(tone.startTime);
  oscillator.stop(endTime);
}
