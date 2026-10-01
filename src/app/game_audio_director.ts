import type { AudioEngine } from '../audio/audio_engine';
import { getMusicTempoMultiplier, getSfxForEvents } from '../audio/game_audio';
import { getStackHeight } from '../engine/board';
import type { GameEvent, GameState } from '../engine/types';

/** Parte del motor de audio que necesita la partida. */
export type GameAudioOutput = Pick<AudioEngine, 'playSfx' | 'setTempoMultiplier' | 'stopMusic'>;

/**
 * Traduce lo ocurrido en la partida a audio: efectos por cada evento, tempo de la
 * música según la altura de la pila y fin de la música al perder.
 * @param audio Salida de audio.
 * @param events Eventos producidos desde la última llamada.
 * @param state Estado actual de la partida.
 */
export function applyGameAudio(
  audio: GameAudioOutput,
  events: readonly GameEvent[],
  state: GameState,
): void {
  for (const sfx of getSfxForEvents(events)) {
    audio.playSfx(sfx);
  }
  if (events.some((event) => event.type === 'gameOver')) {
    audio.stopMusic();
  } else {
    audio.setTempoMultiplier(getMusicTempoMultiplier(getStackHeight(state.board)));
  }
}
