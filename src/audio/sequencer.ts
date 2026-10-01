import type { Waveform } from '../config/sfx_config';
import { getTrackLength, type Song } from './song';

/** Nota lista para programar en el tiempo. */
export interface ScheduledNote {
  readonly waveform: Waveform;
  readonly volume: number;
  readonly frequency: number;
  /** Paso absoluto (contando las repeticiones del bucle) en que empieza. */
  readonly startStep: number;
  /** Duración en pasos. */
  readonly steps: number;
}

/**
 * Notas que empiezan en el intervalo de pasos [fromStep, toStep), teniendo en cuenta
 * que cada pista se repite en bucle. Los silencios no se devuelven.
 * @param song Canción.
 * @param fromStep Primer paso del intervalo (incluido).
 * @param toStep Último paso del intervalo (excluido).
 * @returns Notas ordenadas por pista y por inicio.
 */
export function collectNotesInWindow(
  song: Song,
  fromStep: number,
  toStep: number,
): readonly ScheduledNote[] {
  const result: ScheduledNote[] = [];
  for (const track of song.tracks) {
    const length = getTrackLength(track);
    if (length === 0) {
      continue;
    }
    for (let loop = Math.floor(fromStep / length); loop * length < toStep; loop++) {
      let offset = loop * length;
      for (const note of track.notes) {
        if (note.frequency !== null && offset >= fromStep && offset < toStep) {
          result.push({
            waveform: track.waveform,
            volume: track.volume,
            frequency: note.frequency,
            startStep: offset,
            steps: note.steps,
          });
        }
        offset += note.steps;
      }
    }
  }
  return result;
}
