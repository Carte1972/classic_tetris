import { describe, expect, it } from 'vitest';
import { collectNotesInWindow } from '../../../src/audio/sequencer';
import { parseTrack, type Song } from '../../../src/audio/song';

const SONG: Song = {
  bpm: 120,
  stepsPerBeat: 2,
  tracks: [
    { waveform: 'square', volume: 0.5, notes: parseTrack('A4:2 -:1 C5:1') },
    { waveform: 'triangle', volume: 0.3, notes: [] },
  ],
};

describe('collectNotesInWindow', () => {
  it('devuelve las notas que empiezan en el intervalo, sin silencios', () => {
    const notes = collectNotesInWindow(SONG, 0, 4);
    expect(notes.map((n) => [n.startStep, n.steps])).toEqual([
      [0, 2],
      [3, 1],
    ]);
    expect(notes[0]).toMatchObject({ waveform: 'square', volume: 0.5 });
  });

  it('el intervalo incluye el inicio y excluye el final', () => {
    expect(collectNotesInWindow(SONG, 0, 3).map((n) => n.startStep)).toEqual([0]);
    expect(collectNotesInWindow(SONG, 0.5, 3.5).map((n) => n.startStep)).toEqual([3]);
  });

  it('repite la canción en bucle', () => {
    expect(collectNotesInWindow(SONG, 3, 9).map((n) => n.startStep)).toEqual([3, 4, 7, 8]);
  });

  it('un intervalo vacío no devuelve notas', () => {
    expect(collectNotesInWindow(SONG, 5, 5)).toEqual([]);
  });
});
