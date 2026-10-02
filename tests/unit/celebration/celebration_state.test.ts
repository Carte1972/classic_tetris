import { describe, expect, it } from 'vitest';
import { DANCERS } from '../../../src/celebration/characters';
import {
  advanceCelebration,
  getDancer,
  isCelebrationFinished,
  seekCelebration,
  selectDancerIndex,
  skipCelebration,
  startCelebration,
} from '../../../src/celebration/celebration_state';
import {
  CELEBRATION_DURATION_MS,
  LEVEL_BANNER_DURATION_MS,
} from '../../../src/config/celebration_config';

describe('selectDancerIndex: un personaje distinto por nivel, en rotación', () => {
  it('hay 8 bailarines y el nivel 1 trae al cosaco', () => {
    expect(DANCERS).toHaveLength(8);
    expect(DANCERS[selectDancerIndex(1)]?.id).toBe('cossack');
  });

  it('sigue el orden acordado del nivel 1 al 8', () => {
    const ids = Array.from({ length: 8 }, (_, i) => DANCERS[selectDancerIndex(i + 1)]?.id);
    expect(ids).toEqual([
      'cossack',
      'matryoshka',
      'bear',
      'babushka',
      'cosmonaut',
      'chessMaster',
      'basketballGiant',
      'ballerina',
    ]);
  });

  it('vuelve a empezar tras el octavo: (nivel − 1) % 8', () => {
    expect(selectDancerIndex(9)).toBe(0);
    expect(selectDancerIndex(16)).toBe(7);
    expect(selectDancerIndex(29)).toBe(4);
  });

  it('niveles consecutivos nunca repiten bailarín', () => {
    for (let level = 1; level < 40; level++) {
      expect(selectDancerIndex(level + 1)).not.toBe(selectDancerIndex(level));
    }
  });

  it('nunca devuelve un índice negativo', () => {
    expect(selectDancerIndex(0)).toBe(7);
  });
});

describe('máquina de estados de la celebración', () => {
  it('empieza en el instante 0 con el bailarín del nivel', () => {
    const state = startCelebration({ level: 2, levelsCompleted: 2, dance: true });
    expect(state).toEqual({
      level: 2,
      kind: 'dance',
      dancerIndex: 1,
      elapsedMs: 0,
      durationMs: CELEBRATION_DURATION_MS,
    });
    expect(getDancer(state).id).toBe('matryoshka');
    expect(isCelebrationFinished(state)).toBe(false);
  });

  it('dura 4 segundos', () => {
    expect(CELEBRATION_DURATION_MS).toBe(4000);
    let state = startCelebration({ level: 1, levelsCompleted: 1, dance: true });
    state = advanceCelebration(state, 3999);
    expect(isCelebrationFinished(state)).toBe(false);
    state = advanceCelebration(state, 1);
    expect(isCelebrationFinished(state)).toBe(true);
  });

  it('no avanza más allá del final ni hacia atrás', () => {
    const state = advanceCelebration(
      startCelebration({ level: 1, levelsCompleted: 1, dance: true }),
      99_999,
    );
    expect(state.elapsedMs).toBe(CELEBRATION_DURATION_MS);
    expect(
      advanceCelebration(startCelebration({ level: 1, levelsCompleted: 1, dance: true }), -50)
        .elapsedMs,
    ).toBe(0);
  });

  it('saltar la celebración la termina en el acto', () => {
    expect(
      isCelebrationFinished(
        skipCelebration(startCelebration({ level: 3, levelsCompleted: 3, dance: true })),
      ),
    ).toBe(true);
  });

  it('se puede colocar en un instante concreto dentro de la duración', () => {
    const state = startCelebration({ level: 1, levelsCompleted: 1, dance: true });
    expect(seekCelebration(state, 1500).elapsedMs).toBe(1500);
    expect(seekCelebration(state, -1).elapsedMs).toBe(0);
    expect(seekCelebration(state, 10_000).elapsedMs).toBe(CELEBRATION_DURATION_MS);
  });

  it('rechaza un bailarín inexistente', () => {
    expect(() =>
      getDancer({ level: 1, kind: 'dance', dancerIndex: 99, elapsedMs: 0, durationMs: 1 }),
    ).toThrow(RangeError);
  });

  it('el bailarín depende de los niveles superados en la partida, no del número de nivel', () => {
    const fromLevelSix = startCelebration({ level: 6, levelsCompleted: 1, dance: true });
    expect(getDancer(fromLevelSix).id).toBe(DANCERS[0]?.id);
  });

  it('con las celebraciones desactivadas es solo un rótulo de 2 segundos', () => {
    const banner = startCelebration({ level: 3, levelsCompleted: 3, dance: false });
    expect(banner.kind).toBe('banner');
    expect(banner.durationMs).toBe(LEVEL_BANNER_DURATION_MS);
    expect(isCelebrationFinished(advanceCelebration(banner, LEVEL_BANNER_DURATION_MS))).toBe(true);
  });
});
