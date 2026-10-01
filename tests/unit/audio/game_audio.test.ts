import { describe, expect, it } from 'vitest';
import { getMusicTempoMultiplier, getSfxForEvents } from '../../../src/audio/game_audio';
import { DANGER_TEMPO_MULTIPLIER } from '../../../src/config/audio_config';

describe('getSfxForEvents', () => {
  it('asocia cada evento a su efecto', () => {
    expect(
      getSfxForEvents([
        { type: 'pieceMoved' },
        { type: 'pieceRotated' },
        { type: 'levelUp', level: 3 },
        { type: 'gameOver' },
      ]),
    ).toEqual(['move', 'rotate', 'levelUp', 'gameOver']);
  });

  it('fijar sin limpiar líneas suena a fijar', () => {
    expect(getSfxForEvents([{ type: 'pieceLocked' }])).toEqual(['lock']);
  });

  it('limpiar líneas sustituye al sonido de fijar', () => {
    expect(getSfxForEvents([{ type: 'pieceLocked' }, { type: 'linesCleared', count: 2 }])).toEqual([
      'lineClear',
    ]);
  });

  it('4 líneas tienen su propio sonido', () => {
    expect(getSfxForEvents([{ type: 'pieceLocked' }, { type: 'linesCleared', count: 4 }])).toEqual([
      'tetris',
    ]);
  });

  it('no repite efectos en el mismo fotograma', () => {
    expect(getSfxForEvents([{ type: 'pieceMoved' }, { type: 'pieceMoved' }])).toEqual(['move']);
  });
});

describe('getMusicTempoMultiplier', () => {
  it('mantiene el tempo con la pila baja y acelera con bloques en las 5 filas superiores', () => {
    expect(getMusicTempoMultiplier(0)).toBe(1);
    expect(getMusicTempoMultiplier(15)).toBe(1);
    expect(getMusicTempoMultiplier(16)).toBe(DANGER_TEMPO_MULTIPLIER);
    expect(getMusicTempoMultiplier(20)).toBe(DANGER_TEMPO_MULTIPLIER);
  });
});
