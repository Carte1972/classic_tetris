import type {
  AudioContextLike,
  AudioNodeLike,
  AudioParamLike,
  GainLike,
  IntervalScheduler,
  OscillatorLike,
} from '../../../src/audio/audio_types';

/** Automatización registrada en un parámetro. */
export interface ParamEvent {
  readonly kind: 'set' | 'linear' | 'exponential';
  readonly value: number;
  readonly time: number;
}

/** Parámetro falso que registra su automatización. */
export class FakeParam implements AudioParamLike {
  value = 0;
  readonly events: ParamEvent[] = [];
  setValueAtTime(value: number, time: number) {
    this.value = value;
    this.events.push({ kind: 'set', value, time });
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.events.push({ kind: 'linear', value, time });
  }
  exponentialRampToValueAtTime(value: number, time: number) {
    this.events.push({ kind: 'exponential', value, time });
  }
}

/** Nodo falso que recuerda a qué se conecta. */
export class FakeNode implements AudioNodeLike {
  readonly connections: AudioNodeLike[] = [];
  connect(destination: AudioNodeLike) {
    this.connections.push(destination);
  }
}

/** Oscilador falso. */
export class FakeOscillator extends FakeNode implements OscillatorLike {
  type: OscillatorType = 'sine';
  readonly frequency = new FakeParam();
  startTime: number | null = null;
  stopTime: number | null = null;
  start(when: number) {
    this.startTime = when;
  }
  stop(when: number) {
    this.stopTime = when;
  }
}

/** Ganancia falsa. */
export class FakeGain extends FakeNode implements GainLike {
  readonly gain = new FakeParam();
}

/** Contexto de audio falso con reloj controlable. */
export class FakeAudioContext implements AudioContextLike {
  currentTime = 0;
  state: AudioContextState = 'running';
  readonly destination = new FakeNode();
  readonly oscillators: FakeOscillator[] = [];
  readonly gains: FakeGain[] = [];
  resumeCalls = 0;
  createOscillator() {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }
  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }
  resume() {
    this.resumeCalls++;
    this.state = 'running';
    return Promise.resolve();
  }
}

/** Temporizador manual: `tick()` ejecuta las funciones registradas. */
export function createManualInterval(): {
  interval: IntervalScheduler;
  tick: () => void;
  active: () => number;
} {
  const callbacks = new Set<() => void>();
  return {
    interval: (callback) => {
      callbacks.add(callback);
      return () => callbacks.delete(callback);
    },
    tick: () => callbacks.forEach((callback) => callback()),
    active: () => callbacks.size,
  };
}
