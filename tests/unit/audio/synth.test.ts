import { describe, expect, it } from 'vitest';
import { playTone } from '../../../src/audio/synth';
import { FakeAudioContext, FakeNode } from './fake_audio';

describe('playTone', () => {
  it('crea un oscilador con su envolvente conectado al destino', () => {
    const context = new FakeAudioContext();
    const destination = new FakeNode();
    playTone(context, destination, {
      waveform: 'square',
      frequency: 440,
      startTime: 1,
      duration: 0.5,
      volume: 0.3,
    });
    const oscillator = context.oscillators[0];
    const envelope = context.gains[0];
    expect(oscillator?.type).toBe('square');
    expect(oscillator?.frequency.events[0]).toEqual({ kind: 'set', value: 440, time: 1 });
    expect(oscillator?.startTime).toBe(1);
    expect(oscillator?.stopTime).toBe(1.5);
    expect(oscillator?.connections).toEqual([envelope]);
    expect(envelope?.connections).toEqual([destination]);
    const peak = Math.max(...(envelope?.gain.events.map((e) => e.value) ?? []));
    expect(peak).toBe(0.3);
    expect(envelope?.gain.events.at(-1)?.time).toBe(1.5);
  });

  it('desliza la frecuencia si se indica una final', () => {
    const context = new FakeAudioContext();
    playTone(context, new FakeNode(), {
      waveform: 'triangle',
      frequency: 200,
      endFrequency: 100,
      startTime: 0,
      duration: 0.1,
      volume: 1,
    });
    expect(context.oscillators[0]?.frequency.events).toContainEqual({
      kind: 'exponential',
      value: 100,
      time: 0.1,
    });
  });
});
