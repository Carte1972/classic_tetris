import { describe, expect, it } from 'vitest';
import { createMusicPlayer } from '../../../src/audio/music_player';
import { parseTrack, type Song } from '../../../src/audio/song';
import { SCHEDULER_LOOKAHEAD_S } from '../../../src/config/audio_config';
import { createManualInterval, FakeAudioContext, FakeNode } from './fake_audio';

/** Canción de prueba: una corchea por paso a 60 negras/min = 0,5 s por paso. */
const SONG: Song = {
  bpm: 60,
  stepsPerBeat: 2,
  tracks: [{ waveform: 'square', volume: 0.2, notes: parseTrack('A4:1 B4:1 C5:1 D5:1') }],
};
const STEP_S = 60 / (SONG.bpm * SONG.stepsPerBeat);

/** Instantes de inicio de las notas programadas. */
function startTimes(context: FakeAudioContext): (number | null)[] {
  return context.oscillators.map((o) => o.startTime);
}

describe('createMusicPlayer', () => {
  it('programa por adelantado solo las notas dentro del margen', () => {
    const context = new FakeAudioContext();
    const { interval } = createManualInterval();
    const player = createMusicPlayer(context, new FakeNode(), interval);
    player.play(SONG);
    expect(startTimes(context)).toEqual([0]);
    expect(player.getCurrentSong()).toBe(SONG);
  });

  it('va programando nuevas notas según avanza el reloj, sin repetirlas', () => {
    const context = new FakeAudioContext();
    const { interval, tick } = createManualInterval();
    const player = createMusicPlayer(context, new FakeNode(), interval);
    player.play(SONG);
    context.currentTime = STEP_S - SCHEDULER_LOOKAHEAD_S / 2;
    tick();
    tick();
    context.currentTime = 2 * STEP_S;
    tick();
    expect(startTimes(context)).toEqual([0, STEP_S, 2 * STEP_S]);
  });

  it('al acelerar, las notas siguientes se acercan', () => {
    const context = new FakeAudioContext();
    const { interval, tick } = createManualInterval();
    const player = createMusicPlayer(context, new FakeNode(), interval);
    player.play(SONG);
    player.setTempoMultiplier(2);
    player.setTempoMultiplier(2);
    context.currentTime = STEP_S / 2;
    tick();
    expect(startTimes(context)).toEqual([0, STEP_S / 2]);
  });

  it('stop detiene la programación', () => {
    const context = new FakeAudioContext();
    const { interval, tick, active } = createManualInterval();
    const player = createMusicPlayer(context, new FakeNode(), interval);
    player.play(SONG);
    player.stop();
    expect(active()).toBe(0);
    expect(player.getCurrentSong()).toBeNull();
    context.currentTime = 10;
    tick();
    expect(context.oscillators).toHaveLength(1);
  });

  it('tocar otra canción sustituye a la actual y empieza desde el principio', () => {
    const context = new FakeAudioContext();
    const { interval, active } = createManualInterval();
    const player = createMusicPlayer(context, new FakeNode(), interval);
    player.play(SONG);
    context.currentTime = 5;
    player.play(SONG);
    expect(active()).toBe(1);
    expect(startTimes(context)).toEqual([0, 5]);
  });

  it('cambiar el tempo sin música no falla y se aplica al empezar', () => {
    const context = new FakeAudioContext();
    const { interval, tick } = createManualInterval();
    const player = createMusicPlayer(context, new FakeNode(), interval);
    player.setTempoMultiplier(2);
    player.play(SONG);
    context.currentTime = STEP_S / 2;
    tick();
    expect(startTimes(context)).toEqual([0, STEP_S / 2]);
  });

  it('puede empezar desde un paso intermedio e informa del paso actual', () => {
    const context = new FakeAudioContext();
    const { interval } = createManualInterval();
    const player = createMusicPlayer(context, new FakeNode(), interval);
    expect(player.getCurrentStep()).toBe(0);
    player.play(SONG, 2);
    expect(context.oscillators[0]?.frequency.events[0]?.value).toBeCloseTo(523.25, 1);
    context.currentTime = STEP_S;
    expect(player.getCurrentStep()).toBeCloseTo(3);
  });
});
