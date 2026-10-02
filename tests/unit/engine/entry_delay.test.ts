import { describe, expect, it } from 'vitest';
import { getEntryDelayFrames } from '../../../src/engine/entry_delay';

describe('getEntryDelayFrames (ARE de NES, más corto en niveles altos)', () => {
  it.each([
    [21, 10],
    [20, 10],
    [19, 12],
    [16, 12],
    [15, 14],
    [12, 14],
    [11, 16],
    [8, 16],
    [7, 18],
    [0, 18],
  ])('en el nivel 0, pieza fijada con el pivote en la fila %i: %i frames', (row, frames) => {
    expect(getEntryDelayFrames(row, 0)).toBe(frames);
  });

  it('resta 1 frame por nivel', () => {
    expect(getEntryDelayFrames(21, 3)).toBe(7);
    expect(getEntryDelayFrames(7, 5)).toBe(13);
  });

  it('nunca baja de 4 frames', () => {
    expect(getEntryDelayFrames(21, 6)).toBe(4);
    expect(getEntryDelayFrames(21, 29)).toBe(4);
  });

  it('trata los niveles negativos como el nivel 0', () => {
    expect(getEntryDelayFrames(21, -2)).toBe(10);
  });
});
