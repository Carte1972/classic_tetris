import { describe, expect, it } from 'vitest';
import { noteToFrequency } from '../../../src/audio/notes';
import { getTrackLength, parseTrack } from '../../../src/audio/song';

describe('parseTrack', () => {
  it('convierte notas y silencios ignorando las barras de compás', () => {
    expect(parseTrack(' E5:2 -:1 | G#4:1 \n')).toEqual([
      { frequency: noteToFrequency('E5'), steps: 2 },
      { frequency: null, steps: 1 },
      { frequency: noteToFrequency('G#4'), steps: 1 },
    ]);
  });

  it.each(['E5', 'E5:0', 'E5:x', ':2', 'E5:1.5'])('rechaza el elemento "%s"', (token) => {
    expect(() => parseTrack(token)).toThrow();
  });
});

describe('getTrackLength', () => {
  it('suma los pasos de notas y silencios', () => {
    expect(getTrackLength({ waveform: 'square', volume: 1, notes: parseTrack('A4:3 -:5') })).toBe(
      8,
    );
  });
});
