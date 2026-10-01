import { describe, expect, it } from 'vitest';
import { noteToFrequency } from '../../../src/audio/notes';

describe('noteToFrequency', () => {
  it.each([
    ['A4', 440],
    ['A5', 880],
    ['A3', 220],
    ['C4', 261.63],
    ['E2', 82.41],
    ['G#4', 415.3],
    ['Ab4', 415.3],
    ['Bb3', 233.08],
  ])('%s suena a %f Hz', (note, frequency) => {
    expect(noteToFrequency(note)).toBeCloseTo(frequency, 1);
  });

  it.each(['H4', 'A', 'C##4', 'e4', ''])('rechaza la nota no válida "%s"', (note) => {
    expect(() => noteToFrequency(note)).toThrow();
  });
});
