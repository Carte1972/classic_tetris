import { NOTE_GATE, SCHEDULER_INTERVAL_MS, SCHEDULER_LOOKAHEAD_S } from '../config/audio_config';
import type { AudioContextLike, AudioNodeLike, IntervalScheduler } from './audio_types';
import { collectNotesInWindow } from './sequencer';
import type { Song } from './song';
import { playTone } from './synth';

/** Segundos por minuto. */
const SECONDS_PER_MINUTE = 60;

/** Reproductor de música en bucle con tempo variable. */
export interface MusicPlayer {
  /** Empieza a tocar una canción (sustituye a la actual), por defecto desde el principio. */
  readonly play: (song: Song, startStep?: number) => void;
  /** Detiene la música (las notas ya programadas terminan solas en milisegundos). */
  readonly stop: () => void;
  /** Cambia la velocidad de la canción (1 = tempo original). */
  readonly setTempoMultiplier: (multiplier: number) => void;
  /** Canción que está sonando, o `null`. */
  readonly getCurrentSong: () => Song | null;
  /** Paso de la canción que está sonando ahora (0 si no suena nada). */
  readonly getCurrentStep: () => number;
}

/**
 * Temporizador del navegador basado en `setInterval`.
 * @param callback Función a llamar periódicamente.
 * @param intervalMs Periodo en milisegundos.
 * @returns Función que cancela el temporizador.
 */
const browserInterval: IntervalScheduler = (callback, intervalMs) => {
  const id = setInterval(callback, intervalMs);
  return () => clearInterval(id);
};

/**
 * Crea un secuenciador con programación anticipada: cada pocos milisegundos programa
 * en el reloj de audio las notas que caen en los próximos instantes, de forma que el
 * ritmo no depende de la precisión de los temporizadores de JavaScript.
 * @param context Contexto de audio.
 * @param destination Nodo de salida de la música.
 * @param interval Temporizador periódico (inyectable para tests).
 * @returns El reproductor.
 */
export function createMusicPlayer(
  context: AudioContextLike,
  destination: AudioNodeLike,
  interval: IntervalScheduler = browserInterval,
): MusicPlayer {
  let song: Song | null = null;
  let cancelTimer: (() => void) | null = null;
  let tempoMultiplier = 1;
  /** Paso de la canción en el instante `anchorTime`. */
  let anchorStep = 0;
  let anchorTime = 0;
  /** Primer paso aún no programado. */
  let scheduledUntilStep = 0;

  const stepDuration = (current: Song): number =>
    SECONDS_PER_MINUTE / (current.bpm * current.stepsPerBeat * tempoMultiplier);

  const stepAt = (current: Song, time: number): number =>
    anchorStep + (time - anchorTime) / stepDuration(current);

  const timeOfStep = (current: Song, step: number): number =>
    anchorTime + (step - anchorStep) * stepDuration(current);

  const scheduleAhead = (): void => {
    if (song === null) {
      return;
    }
    const current = song;
    const horizonStep = stepAt(current, context.currentTime + SCHEDULER_LOOKAHEAD_S);
    if (horizonStep <= scheduledUntilStep) {
      return;
    }
    for (const note of collectNotesInWindow(current, scheduledUntilStep, horizonStep)) {
      playTone(context, destination, {
        waveform: note.waveform,
        frequency: note.frequency,
        startTime: timeOfStep(current, note.startStep),
        duration: note.steps * stepDuration(current) * NOTE_GATE,
        volume: note.volume,
      });
    }
    scheduledUntilStep = horizonStep;
  };

  const stop = (): void => {
    cancelTimer?.();
    cancelTimer = null;
    song = null;
  };

  return {
    play: (next, startStep = 0) => {
      stop();
      song = next;
      anchorStep = startStep;
      anchorTime = context.currentTime;
      scheduledUntilStep = startStep;
      scheduleAhead();
      cancelTimer = interval(scheduleAhead, SCHEDULER_INTERVAL_MS);
    },
    stop,
    setTempoMultiplier: (multiplier) => {
      if (multiplier === tempoMultiplier) {
        return;
      }
      if (song !== null) {
        anchorStep = stepAt(song, context.currentTime);
        anchorTime = context.currentTime;
      }
      tempoMultiplier = multiplier;
    },
    getCurrentSong: () => song,
    getCurrentStep: () => (song === null ? 0 : stepAt(song, context.currentTime)),
  };
}
