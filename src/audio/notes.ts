import { A4_FREQUENCY_HZ, A4_MIDI_NUMBER, SEMITONES_PER_OCTAVE } from '../config/audio_config';

/** Semitono de cada nombre de nota dentro de la octava. */
const NOTE_SEMITONES: Readonly<Record<string, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Formato de nota: letra, alteración opcional (# o b) y octava, p. ej. `G#4`. */
const NOTE_PATTERN = /^([A-G])([#b]?)(-?\d)$/;

/**
 * Convierte una nota en notación científica (p. ej. `A4`, `G#3`, `Bb2`) a frecuencia,
 * con afinación temperada y La4 = 440 Hz.
 * @param note Nombre de la nota.
 * @returns Frecuencia en Hz.
 */
export function noteToFrequency(note: string): number {
  const match = NOTE_PATTERN.exec(note);
  const letter = match?.[1];
  const accidental = match?.[2];
  const octave = match?.[3];
  const base = letter === undefined ? undefined : NOTE_SEMITONES[letter];
  if (base === undefined || accidental === undefined || octave === undefined) {
    throw new Error(`Nota no válida: ${note}`);
  }
  const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const midi = (Number(octave) + 1) * SEMITONES_PER_OCTAVE + base + shift;
  return A4_FREQUENCY_HZ * 2 ** ((midi - A4_MIDI_NUMBER) / SEMITONES_PER_OCTAVE);
}
