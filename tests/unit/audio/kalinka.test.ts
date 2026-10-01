import { describe, expect, it } from 'vitest';
import { noteToFrequency } from '../../../src/audio/notes';
import { getTrackLength } from '../../../src/audio/song';
import { KALINKA } from '../../../src/audio/songs/kalinka';
import { CELEBRATION_DURATION_MS } from '../../../src/config/celebration_config';

/** Milisegundos por minuto. */
const MS_PER_MINUTE = 60_000;

describe('KALINKA', () => {
  it('todas las pistas duran lo mismo para que el bucle cuadre', () => {
    const lengths = KALINKA.tracks.map(getTrackLength);
    expect(new Set(lengths).size).toBe(1);
  });

  it('el fragmento dura lo mismo que la celebración', () => {
    const steps = getTrackLength(KALINKA.tracks[0] ?? { waveform: 'square', volume: 0, notes: [] });
    const durationMs = (steps / KALINKA.stepsPerBeat) * (MS_PER_MINUTE / KALINKA.bpm);
    expect(durationMs).toBe(CELEBRATION_DURATION_MS);
  });

  it('la melodía empieza con el motivo "Ka-lin-ka": La, Sol, Mi, Fa', () => {
    const melody = KALINKA.tracks[0]?.notes.slice(0, 4).map((note) => note.frequency);
    expect(melody).toEqual(['A5', 'G5', 'E5', 'F5'].map(noteToFrequency));
  });
});
