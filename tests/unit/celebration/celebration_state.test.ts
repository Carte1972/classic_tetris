import { describe, expect, it } from 'vitest';
import { PERFORMERS } from '../../../src/celebration/characters';
import {
  advanceCelebration,
  getPerformer,
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

/** Celebración con baile del nivel superado número `n`. */
const dance = (n: number) => startCelebration({ level: n, levelsCompleted: n, dance: true });

describe('selectDancerIndex: un personaje distinto por nivel superado, en rotación', () => {
  it('hay 9 bailarines y el primer nivel superado trae al cosaco', () => {
    expect(PERFORMERS).toHaveLength(9);
    expect(PERFORMERS[selectDancerIndex(1)]?.dancer.id).toBe('cossack');
  });

  it('sigue el orden acordado, con Rasputín el noveno', () => {
    const ids = Array.from(
      { length: 9 },
      (_, i) => PERFORMERS[selectDancerIndex(i + 1)]?.dancer.id,
    );
    expect(ids).toEqual([
      'cossack',
      'matryoshka',
      'bear',
      'babushka',
      'cosmonaut',
      'chessMaster',
      'basketballGiant',
      'ballerina',
      'rasputin',
    ]);
  });

  it('vuelve a empezar tras el noveno: (niveles superados − 1) % 9', () => {
    expect(selectDancerIndex(10)).toBe(0);
    expect(selectDancerIndex(18)).toBe(8);
    expect(selectDancerIndex(0)).toBe(8);
  });

  it('niveles consecutivos nunca repiten bailarín', () => {
    for (let n = 1; n < 40; n++) {
      expect(selectDancerIndex(n + 1)).not.toBe(selectDancerIndex(n));
    }
  });

  it('cada bailarín tiene su propio escenario', () => {
    expect(new Set(PERFORMERS.map((p) => p.stage.place)).size).toBe(PERFORMERS.length);
  });
});

describe('máquina de estados de la celebración', () => {
  it('con baile dura 10 segundos', () => {
    expect(CELEBRATION_DURATION_MS).toBe(10_000);
    let state = dance(1);
    expect(state).toMatchObject({ kind: 'dance', elapsedMs: 0, durationMs: 10_000 });
    state = advanceCelebration(state, 9_999);
    expect(isCelebrationFinished(state)).toBe(false);
    state = advanceCelebration(state, 1);
    expect(isCelebrationFinished(state)).toBe(true);
  });

  it('sin baile es un rótulo de 2 segundos', () => {
    const banner = startCelebration({ level: 3, levelsCompleted: 3, dance: false });
    expect(banner).toMatchObject({ kind: 'banner', durationMs: LEVEL_BANNER_DURATION_MS });
    expect(isCelebrationFinished(advanceCelebration(banner, LEVEL_BANNER_DURATION_MS))).toBe(true);
  });

  it('no avanza más allá del final ni hacia atrás', () => {
    expect(advanceCelebration(dance(1), 99_999).elapsedMs).toBe(CELEBRATION_DURATION_MS);
    expect(advanceCelebration(dance(1), -50).elapsedMs).toBe(0);
  });

  it('saltarla la termina en el acto y se puede colocar en un instante', () => {
    expect(isCelebrationFinished(skipCelebration(dance(3)))).toBe(true);
    expect(seekCelebration(dance(1), 1500).elapsedMs).toBe(1500);
    expect(seekCelebration(dance(1), -1).elapsedMs).toBe(0);
    expect(seekCelebration(dance(1), 1e9).elapsedMs).toBe(CELEBRATION_DURATION_MS);
  });

  it('el bailarín depende de los niveles superados, no del número de nivel', () => {
    const fromLevelSix = startCelebration({ level: 6, levelsCompleted: 1, dance: true });
    expect(getPerformer(fromLevelSix).dancer.id).toBe('cossack');
  });

  it('rechaza un bailarín inexistente', () => {
    expect(() =>
      getPerformer({ level: 1, kind: 'dance', dancerIndex: 99, elapsedMs: 0, durationMs: 1 }),
    ).toThrow(RangeError);
  });
});
