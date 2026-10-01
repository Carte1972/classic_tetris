import type { Waveform } from '../config/sfx_config';
import { noteToFrequency } from './notes';

/** Nota (o silencio) de una pista. */
export interface SongNote {
  /** Frecuencia en Hz, o `null` si es un silencio. */
  readonly frequency: number | null;
  /** Duración en pasos (corcheas). */
  readonly steps: number;
}

/** Pista de una canción, tocada por un único oscilador. */
export interface SongTrack {
  readonly waveform: Waveform;
  /** Volumen de la pista (0–1). */
  readonly volume: number;
  readonly notes: readonly SongNote[];
}

/** Canción que se repite en bucle. */
export interface Song {
  /** Tempo en negras por minuto. */
  readonly bpm: number;
  readonly tracks: readonly SongTrack[];
}

/**
 * Convierte una pista escrita como texto en notas. Cada elemento es `NOTA:pasos`
 * (`-` para silencio) y las barras `|` separan compases solo para facilitar la lectura.
 * Ejemplo: `"E5:2 B4:1 C5:1 | -:4"`.
 * @param text Pista en texto.
 * @returns Las notas de la pista.
 */
export function parseTrack(text: string): readonly SongNote[] {
  return text
    .split(/\s+/)
    .filter((token) => token !== '' && token !== '|')
    .map((token) => {
      const [name, stepsText] = token.split(':');
      const steps = Number(stepsText);
      if (name === undefined || name === '' || !Number.isInteger(steps) || steps <= 0) {
        throw new Error(`Elemento de pista no válido: ${token}`);
      }
      return { frequency: name === '-' ? null : noteToFrequency(name), steps };
    });
}

/**
 * Duración total de una pista en pasos.
 * @param track Pista.
 * @returns Número de pasos.
 */
export function getTrackLength(track: SongTrack): number {
  return track.notes.reduce((total, note) => total + note.steps, 0);
}
