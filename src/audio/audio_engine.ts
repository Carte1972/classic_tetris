import { MASTER_VOLUME, MUSIC_VOLUME, SFX_VOLUME } from '../config/audio_config';
import { SFX_DEFINITIONS, type SfxName } from '../config/sfx_config';
import type { AudioContextLike, GainLike, IntervalScheduler } from './audio_types';
import { createMusicPlayer, type MusicPlayer } from './music_player';
import type { Song } from './song';
import { playTone } from './synth';

/** Motor de audio del juego: música, efectos y volumen. */
export interface AudioEngine {
  /**
   * Crea o reanuda el contexto de audio. Debe llamarse dentro de un gesto del usuario
   * (los navegadores bloquean el audio hasta entonces).
   */
  readonly unlock: () => void;
  /** Indica si el contexto de audio ya está creado. */
  readonly isUnlocked: () => boolean;
  /** Reproduce un efecto (no hace nada si el audio aún no está desbloqueado). */
  readonly playSfx: (name: SfxName) => void;
  /** Toca una canción en bucle; si la música está desactivada, la recuerda para luego. */
  readonly playMusic: (song: Song) => void;
  /** Detiene la música. */
  readonly stopMusic: () => void;
  /** Detiene la música recordando por dónde iba, para reanudarla con `resumeMusic`. */
  readonly pauseMusic: () => void;
  /** Reanuda la última música pausada desde donde se quedó. */
  readonly resumeMusic: () => void;
  /** Cambia la velocidad de la música (1 = tempo original). */
  readonly setTempoMultiplier: (multiplier: number) => void;
  /** Activa o desactiva solo la música (opción MÚSICA del menú). */
  readonly setMusicEnabled: (enabled: boolean) => void;
  /** Silencia o reactiva todo el audio (tecla M). */
  readonly setMuted: (muted: boolean) => void;
  /** Indica si todo el audio está silenciado. */
  readonly isMuted: () => boolean;
}

/** Canción pausada y paso por el que iba. */
interface PausedMusic {
  readonly song: Song;
  readonly step: number;
}

/** Nodos y reproductor que existen una vez desbloqueado el audio. */
interface AudioGraph {
  readonly context: AudioContextLike;
  readonly master: GainLike;
  readonly sfx: GainLike;
  readonly music: MusicPlayer;
}

/**
 * Crea el motor de audio. El contexto se crea de forma perezosa en `unlock`.
 * @param createContext Fábrica del contexto de audio (inyectable para tests).
 * @param interval Temporizador del secuenciador (inyectable para tests).
 * @returns El motor de audio.
 */
export function createAudioEngine(
  createContext: () => AudioContextLike = () => new AudioContext(),
  interval?: IntervalScheduler,
): AudioEngine {
  let graph: AudioGraph | null = null;
  let muted = false;
  let musicEnabled = true;
  let pendingSong: Song | null = null;
  let pausedMusic: PausedMusic | null = null;
  let tempoMultiplier = 1;

  const applyMasterVolume = (): void => {
    if (graph !== null) {
      graph.master.gain.setValueAtTime(muted ? 0 : MASTER_VOLUME, graph.context.currentTime);
    }
  };

  const startPendingMusic = (startStep = 0): void => {
    if (graph !== null && musicEnabled && pendingSong !== null) {
      graph.music.play(pendingSong, startStep);
      graph.music.setTempoMultiplier(tempoMultiplier);
    }
  };

  const buildGraph = (): AudioGraph => {
    const context = createContext();
    const master = context.createGain();
    const musicGain = context.createGain();
    const sfx = context.createGain();
    master.connect(context.destination);
    musicGain.connect(master);
    sfx.connect(master);
    musicGain.gain.setValueAtTime(MUSIC_VOLUME, context.currentTime);
    sfx.gain.setValueAtTime(SFX_VOLUME, context.currentTime);
    return { context, master, sfx, music: createMusicPlayer(context, musicGain, interval) };
  };

  return {
    unlock: () => {
      if (graph === null) {
        graph = buildGraph();
        applyMasterVolume();
        startPendingMusic();
      }
      if (graph.context.state === 'suspended') {
        void graph.context.resume();
      }
    },
    isUnlocked: () => graph !== null,
    playSfx: (name) => {
      if (graph === null) {
        return;
      }
      let startTime = graph.context.currentTime;
      for (const step of SFX_DEFINITIONS[name]) {
        playTone(graph.context, graph.sfx, { ...step, startTime });
        startTime += step.duration;
      }
    },
    playMusic: (song) => {
      pendingSong = song;
      graph?.music.stop();
      startPendingMusic();
    },
    stopMusic: () => {
      pendingSong = null;
      pausedMusic = null;
      graph?.music.stop();
    },
    pauseMusic: () => {
      const playing = graph?.music.getCurrentSong() ?? null;
      if (playing !== null && graph !== null) {
        pausedMusic = { song: playing, step: graph.music.getCurrentStep() };
        graph.music.stop();
      } else {
        pausedMusic = pendingSong === null ? null : { song: pendingSong, step: 0 };
      }
    },
    resumeMusic: () => {
      if (pausedMusic === null) {
        return;
      }
      pendingSong = pausedMusic.song;
      graph?.music.stop();
      startPendingMusic(pausedMusic.step);
      pausedMusic = null;
    },
    setTempoMultiplier: (multiplier) => {
      tempoMultiplier = multiplier;
      graph?.music.setTempoMultiplier(multiplier);
    },
    setMusicEnabled: (enabled) => {
      if (enabled === musicEnabled) {
        return;
      }
      musicEnabled = enabled;
      if (enabled) {
        startPendingMusic();
      } else {
        graph?.music.stop();
      }
    },
    setMuted: (value) => {
      muted = value;
      applyMasterVolume();
    },
    isMuted: () => muted,
  };
}
