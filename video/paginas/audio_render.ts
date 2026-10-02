// Renderiza la música y los efectos del juego sin tiempo real, con OfflineAudioContext,
// usando el mismo código de src/audio/ que suena al jugar (canciones, secuenciador,
// sintetizador y definiciones de efectos), y los devuelve como WAV.
import { MASTER_VOLUME, MUSIC_VOLUME, NOTE_GATE, SFX_VOLUME } from '../../src/config/audio_config';
import { SFX_DEFINITIONS, type SfxName } from '../../src/config/sfx_config';
import { collectNotesInWindow } from '../../src/audio/sequencer';
import type { Song } from '../../src/audio/song';
import { KALINKA } from '../../src/audio/songs/kalinka';
import { KOROBEINIKI } from '../../src/audio/songs/korobeiniki';
import { playTone } from '../../src/audio/synth';

/** Frecuencia de muestreo del audio del vídeo (Hz). */
const SAMPLE_RATE = 48000;

/** Segundos por minuto. */
const SECONDS_PER_MINUTE = 60;

/** Silencio que se deja tras un efecto para que suene entero (s). */
const SFX_TAIL_S = 0.3;

/** Petición de render. */
export type AudioRequest =
  | {
      readonly kind: 'song';
      readonly song: 'korobeiniki' | 'kalinka';
      readonly seconds: number;
      readonly tempo: number;
    }
  | { readonly kind: 'sfx'; readonly name: SfxName };

/** Canciones por nombre. */
const SONGS: Readonly<Record<'korobeiniki' | 'kalinka', Song>> = {
  korobeiniki: KOROBEINIKI,
  kalinka: KALINKA,
};

/**
 * Codifica muestras mono en un WAV PCM de 16 bits.
 * @param samples Muestras entre −1 y 1.
 * @returns Bytes del archivo.
 */
function encodeWav(samples: Float32Array): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string): void => {
    [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, i) => {
    view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, sample)) * 0x7fff), true);
  });
  return bytes;
}

/**
 * Renderiza una canción en bucle durante unos segundos, como la toca el reproductor
 * del juego (mismas notas, misma duración de cada paso y misma envolvente).
 * @param song Canción.
 * @param seconds Duración.
 * @param tempo Multiplicador de tempo (1 = original; 1,15 = pila alta).
 * @returns Muestras renderizadas.
 */
async function renderSong(song: Song, seconds: number, tempo: number): Promise<Float32Array> {
  const context = new OfflineAudioContext(1, Math.ceil(seconds * SAMPLE_RATE), SAMPLE_RATE);
  const output = context.createGain();
  output.gain.value = MASTER_VOLUME * MUSIC_VOLUME;
  output.connect(context.destination);
  const stepDuration = SECONDS_PER_MINUTE / (song.bpm * song.stepsPerBeat * tempo);
  const totalSteps = Math.ceil(seconds / stepDuration);
  for (const note of collectNotesInWindow(song, 0, totalSteps)) {
    playTone(context, output, {
      waveform: note.waveform,
      frequency: note.frequency,
      startTime: note.startStep * stepDuration,
      duration: note.steps * stepDuration * NOTE_GATE,
      volume: note.volume,
    });
  }
  return (await context.startRendering()).getChannelData(0);
}

/**
 * Renderiza un efecto de sonido como lo toca el motor de audio del juego.
 * @param name Efecto.
 * @returns Muestras renderizadas.
 */
async function renderSfx(name: SfxName): Promise<Float32Array> {
  const steps = SFX_DEFINITIONS[name];
  const seconds = steps.reduce((total, step) => total + step.duration, 0) + SFX_TAIL_S;
  const context = new OfflineAudioContext(1, Math.ceil(seconds * SAMPLE_RATE), SAMPLE_RATE);
  const output = context.createGain();
  output.gain.value = MASTER_VOLUME * SFX_VOLUME;
  output.connect(context.destination);
  let startTime = 0;
  for (const step of steps) {
    playTone(context, output, { ...step, startTime });
    startTime += step.duration;
  }
  return (await context.startRendering()).getChannelData(0);
}

/**
 * Renderiza una petición y devuelve el WAV en base64 (para pasarlo a Node).
 * @param request Qué renderizar.
 * @returns WAV en base64.
 */
async function renderAudio(request: AudioRequest): Promise<string> {
  const samples =
    request.kind === 'song'
      ? await renderSong(SONGS[request.song], request.seconds, request.tempo)
      : await renderSfx(request.name);
  const bytes = encodeWav(samples);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

declare global {
  interface Window {
    /** Render de audio para el script del vídeo. */
    __renderAudio?: (request: AudioRequest) => Promise<string>;
  }
}

window.__renderAudio = renderAudio;
