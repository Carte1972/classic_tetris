import { describe, expect, it } from 'vitest';
import { consumeFrames } from '../../../src/app/timestep';
import { FRAME_DURATION_MS } from '../../../src/config/timing_config';

describe('consumeFrames', () => {
  it('reparte el tiempo en frames completos y guarda el resto', () => {
    const budget = consumeFrames(0, FRAME_DURATION_MS * 2.5);
    expect(budget.frames).toBe(2);
    expect(budget.remainderMs).toBeCloseTo(FRAME_DURATION_MS / 2);
  });

  it('a 120 Hz completa un frame cada dos fotogramas de pantalla', () => {
    const halfFrame = FRAME_DURATION_MS / 2;
    const first = consumeFrames(0, halfFrame);
    expect(first.frames).toBe(0);
    const second = consumeFrames(first.remainderMs, halfFrame);
    expect(second.frames).toBe(1);
    expect(second.remainderMs).toBeCloseTo(0);
  });
});
