import { describe, expect, it } from 'vitest';
import {
  drawCelebration,
  getDancerX,
  getStageSize,
  type StageContext,
} from '../../../src/celebration/celebration_renderer';
import { seekCelebration, startCelebration } from '../../../src/celebration/celebration_state';
import { DANCERS } from '../../../src/celebration/characters';
import { MATRYOSHKA_SMALL } from '../../../src/celebration/sprites/characters/matryoshka';
import {
  DANCE_CENTER_X,
  ENTER_START_X,
  EXIT_END_X,
  MATRYOSHKA_OPEN_AT_MS,
  STAGE_HEIGHT,
  STAGE_WIDTH,
} from '../../../src/config/celebration_config';
import { CELEBRATION_FLOOR_COLOR } from '../../../src/config/palette';

/** Escenario falso que registra lo dibujado. */
function createFakeStage() {
  const fills: { color: string; x: number; y: number; w: number }[] = [];
  let clears = 0;
  const ctx: StageContext = {
    fillStyle: '',
    fillRect(x, y, w) {
      const style = ctx.fillStyle;
      fills.push({ color: typeof style === 'string' ? style : '', x, y, w });
    },
    clearRect() {
      clears++;
    },
  };
  return { ctx, fills, clears: () => clears };
}

/** Colores usados en un fotograma. */
const colorsUsed = (fills: { color: string }[]) => new Set(fills.map((f) => f.color));

describe('drawCelebration', () => {
  it('borra el fotograma anterior y dibuja el suelo y al bailarín', () => {
    const { ctx, fills, clears } = createFakeStage();
    drawCelebration(
      ctx,
      seekCelebration(startCelebration({ level: 1, levelsCompleted: 1, dance: true }), 1500),
    );
    expect(clears()).toBe(1);
    expect(fills[0]).toMatchObject({ color: CELEBRATION_FLOOR_COLOR, w: STAGE_WIDTH });
    expect(colorsUsed(fills)).toContain(DANCERS[0]?.colors['B']);
  });

  it('el escenario es de 16:9', () => {
    expect(getStageSize()).toEqual({ width: STAGE_WIDTH, height: STAGE_HEIGHT });
  });

  it('la matrioska grande da paso a la pequeña al abrirse', () => {
    const before = createFakeStage();
    drawCelebration(
      before.ctx,
      seekCelebration(
        startCelebration({ level: 2, levelsCompleted: 2, dance: true }),
        MATRYOSHKA_OPEN_AT_MS - 10,
      ),
    );
    expect(colorsUsed(before.fills)).not.toContain(MATRYOSHKA_SMALL.colors['T']);
    const opening = createFakeStage();
    drawCelebration(
      opening.ctx,
      seekCelebration(
        startCelebration({ level: 2, levelsCompleted: 2, dance: true }),
        MATRYOSHKA_OPEN_AT_MS + 100,
      ),
    );
    const colors = colorsUsed(opening.fills);
    expect(colors).toContain(MATRYOSHKA_SMALL.colors['T']);
    expect(colors).toContain(DANCERS[1]?.colors['T']);
    const after = createFakeStage();
    drawCelebration(
      after.ctx,
      seekCelebration(startCelebration({ level: 2, levelsCompleted: 2, dance: true }), 3000),
    );
    expect(colorsUsed(after.fills)).not.toContain(DANCERS[1]?.colors['T']);
  });

  it('el gigante bota su balón', () => {
    const { ctx, fills } = createFakeStage();
    drawCelebration(
      ctx,
      seekCelebration(startCelebration({ level: 7, levelsCompleted: 7, dance: true }), 1500),
    );
    expect(colorsUsed(fills)).toContain(DANCERS[6]?.colors['X']);
  });

  it('la bailarina se tambalea durante la prisiadka', () => {
    const lefts = [1000, 1150, 1290, 1420].map((t) => {
      const { ctx, fills } = createFakeStage();
      drawCelebration(
        ctx,
        seekCelebration(startCelebration({ level: 8, levelsCompleted: 8, dance: true }), t),
      );
      return Math.min(...fills.slice(1).map((f) => f.x));
    });
    expect(new Set(lefts).size).toBeGreaterThan(1);
  });
});

describe('drawCelebration con rótulo', () => {
  it('sin baile solo borra el escenario', () => {
    const { ctx, fills, clears } = createFakeStage();
    drawCelebration(ctx, startCelebration({ level: 2, levelsCompleted: 1, dance: false }));
    expect(clears()).toBe(1);
    expect(fills).toHaveLength(0);
  });
});

describe('getDancerX', () => {
  it('entra por la izquierda, baila en el centro y sale por la derecha', () => {
    expect(getDancerX({ movement: 'enter', frame: 0, movementProgress: 0 })).toBe(ENTER_START_X);
    expect(getDancerX({ movement: 'enter', frame: 5, movementProgress: 1 })).toBe(DANCE_CENTER_X);
    expect(getDancerX({ movement: 'prisiadka', frame: 2, movementProgress: 0.3 })).toBe(
      DANCE_CENTER_X,
    );
    expect(getDancerX({ movement: 'jump', frame: 3, movementProgress: 0.5 })).toBe(DANCE_CENTER_X);
    expect(getDancerX({ movement: 'exit', frame: 5, movementProgress: 1 })).toBe(EXIT_END_X);
  });
});
