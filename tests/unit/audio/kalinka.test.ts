import { describe, expect, it } from 'vitest';
import { noteToFrequency } from '../../../src/audio/notes';
import { getTrackLength } from '../../../src/audio/song';
import { KALINKA } from '../../../src/audio/songs/kalinka';

/** Milisegundos por minuto. */
const MS_PER_MINUTE = 60_000;

describe('KALINKA', () => {
  it('todas las pistas duran lo mismo para que el bucle cuadre', () => {
    const lengths = KALINKA.tracks.map(getTrackLength);
    expect(new Set(lengths).size).toBe(1);
  });

  it('una vuelta (estribillo y estrofa) dura 12 segundos, más que la celebración', () => {
    const steps = getTrackLength(KALINKA.tracks[0] ?? { waveform: 'square', volume: 0, notes: [] });
    const durationMs = (steps / KALINKA.stepsPerBeat) * (MS_PER_MINUTE / KALINKA.bpm);
    expect(durationMs).toBe(12_000);
  });

  it('la melodía empieza con el motivo "Ka-lin-ka": La, Sol, Mi, Fa', () => {
    const melody = KALINKA.tracks[0]?.notes.slice(0, 4).map((note) => note.frequency);
    expect(melody).toEqual(['A5', 'G5', 'E5', 'F5'].map(noteToFrequency));
  });
});
