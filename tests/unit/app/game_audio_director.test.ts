import { describe, expect, it, vi } from 'vitest';
import { applyGameAudio } from '../../../src/app/game_audio_director';
import { DANGER_TEMPO_MULTIPLIER } from '../../../src/config/audio_config';
import { TOTAL_ROWS } from '../../../src/config/board_config';
import { createEmptyRow } from '../../../src/engine/board';
import { createInitialState } from '../../../src/engine/game_state';

/** Salida de audio falsa. */
function fakeAudio() {
  return { playSfx: vi.fn(), setTempoMultiplier: vi.fn(), stopMusic: vi.fn() };
}

const state = createInitialState({ seed: 1, startLevel: 0 });

describe('applyGameAudio', () => {
  it('reproduce los efectos y ajusta el tempo según la pila', () => {
    const audio = fakeAudio();
    applyGameAudio(audio, [{ type: 'pieceMoved' }], state);
    expect(audio.playSfx).toHaveBeenCalledWith('move');
    expect(audio.setTempoMultiplier).toHaveBeenCalledWith(1);
  });

  it('acelera la música con la pila cerca del techo', () => {
    const audio = fakeAudio();
    const board = Array.from({ length: TOTAL_ROWS }, createEmptyRow).map((row, y) =>
      y === 3 ? row.map(() => 'I' as const) : row,
    );
    applyGameAudio(audio, [], { ...state, board });
    expect(audio.setTempoMultiplier).toHaveBeenCalledWith(DANGER_TEMPO_MULTIPLIER);
  });

  it('detiene la música al perder', () => {
    const audio = fakeAudio();
    applyGameAudio(audio, [{ type: 'gameOver' }], state);
    expect(audio.stopMusic).toHaveBeenCalled();
    expect(audio.playSfx).toHaveBeenCalledWith('gameOver');
    expect(audio.setTempoMultiplier).not.toHaveBeenCalled();
  });
});
