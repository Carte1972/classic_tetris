import { describe, expect, it } from 'vitest';
import { getEntryDelayFrames } from '../../../src/engine/entry_delay';

describe('getEntryDelayFrames (ARE de NES)', () => {
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
  ])('pieza fijada con el pivote en la fila %i: %i frames', (row, frames) => {
    expect(getEntryDelayFrames(row)).toBe(frames);
  });
});
