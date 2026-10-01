import { describe, expect, it } from 'vitest';
import { getTrackLength } from '../../../src/audio/song';
import { KOROBEINIKI } from '../../../src/audio/songs/korobeiniki';

/** Pasos de un compás de 4/4 en corcheas. */
const STEPS_PER_BAR = 8;

describe('KOROBEINIKI', () => {
  it('todas las pistas duran lo mismo (16 compases) para que el bucle cuadre', () => {
    for (const track of KOROBEINIKI.tracks) {
      expect(getTrackLength(track)).toBe(16 * STEPS_PER_BAR);
    }
  });

  it('usa onda cuadrada para melodía y armonía y triangular para el bajo', () => {
    expect(KOROBEINIKI.tracks.map((track) => track.waveform)).toEqual([
      'square',
      'square',
      'triangle',
    ]);
  });

  it('las notas están en un rango audible razonable', () => {
    for (const track of KOROBEINIKI.tracks) {
      for (const note of track.notes) {
        if (note.frequency !== null) {
          expect(note.frequency).toBeGreaterThan(60);
          expect(note.frequency).toBeLessThan(1000);
        }
      }
    }
  });
});
