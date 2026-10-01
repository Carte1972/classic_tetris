import { describe, expect, it } from 'vitest';
import { createAudioEngine } from '../../../src/audio/audio_engine';
import { parseTrack, type Song } from '../../../src/audio/song';
import { MASTER_VOLUME } from '../../../src/config/audio_config';
import { SFX_DEFINITIONS } from '../../../src/config/sfx_config';
import { createManualInterval, FakeAudioContext } from './fake_audio';

const SONG: Song = {
  bpm: 120,
  tracks: [{ waveform: 'square', volume: 0.2, notes: parseTrack('A4:1 -:1') }],
};

/** Crea un motor con un contexto falso y devuelve ambos. */
function setup() {
  const contexts: FakeAudioContext[] = [];
  const { interval, active } = createManualInterval();
  const engine = createAudioEngine(() => {
    const context = new FakeAudioContext();
    contexts.push(context);
    return context;
  }, interval);
  const context = () => {
    const created = contexts[0];
    if (created === undefined) {
      throw new Error('El contexto aún no se ha creado');
    }
    return created;
  };
  return { engine, contexts, context, activeTimers: active };
}

/** Ganancia general (la primera que crea el motor). */
function masterGain(context: FakeAudioContext): number | undefined {
  return context.gains[0]?.gain.value;
}

describe('createAudioEngine', () => {
  it('no crea el contexto de audio hasta el primer gesto del usuario', () => {
    const { engine, contexts } = setup();
    engine.playSfx('move');
    engine.playMusic(SONG);
    expect(contexts).toHaveLength(0);
    expect(engine.isUnlocked()).toBe(false);
    engine.unlock();
    engine.unlock();
    expect(contexts).toHaveLength(1);
    expect(engine.isUnlocked()).toBe(true);
  });

  it('al desbloquear empieza la música pedida antes', () => {
    const { engine, context, activeTimers } = setup();
    engine.playMusic(SONG);
    engine.unlock();
    expect(activeTimers()).toBe(1);
    expect(context().oscillators.length).toBeGreaterThan(0);
  });

  it('reanuda el contexto si el navegador lo ha suspendido', () => {
    const { engine, context } = setup();
    engine.unlock();
    context().state = 'suspended';
    engine.unlock();
    expect(context().resumeCalls).toBe(1);
  });

  it('cada efecto toca sus tramos uno detrás de otro', () => {
    const { engine, context } = setup();
    engine.unlock();
    engine.playSfx('lineClear');
    const steps = SFX_DEFINITIONS.lineClear;
    const starts = context().oscillators.map((o) => o.startTime);
    expect(starts).toHaveLength(steps.length);
    expect(starts[1]).toBeCloseTo(steps[0]?.duration ?? 0);
  });

  it('M silencia y reactiva todo el audio', () => {
    const { engine, context } = setup();
    engine.setMuted(true);
    engine.unlock();
    expect(engine.isMuted()).toBe(true);
    expect(masterGain(context())).toBe(0);
    engine.setMuted(false);
    expect(masterGain(context())).toBe(MASTER_VOLUME);
  });

  it('desactivar la música la detiene y activarla la retoma', () => {
    const { engine, activeTimers } = setup();
    engine.unlock();
    engine.playMusic(SONG);
    engine.setMusicEnabled(false);
    engine.setMusicEnabled(false);
    expect(activeTimers()).toBe(0);
    engine.playMusic(SONG);
    expect(activeTimers()).toBe(0);
    engine.setMusicEnabled(true);
    expect(activeTimers()).toBe(1);
  });

  it('stopMusic olvida la canción pendiente', () => {
    const { engine, activeTimers } = setup();
    engine.playMusic(SONG);
    engine.stopMusic();
    engine.unlock();
    expect(activeTimers()).toBe(0);
    engine.setTempoMultiplier(1.5);
    engine.setMusicEnabled(false);
    engine.setMusicEnabled(true);
    expect(activeTimers()).toBe(0);
  });
});
