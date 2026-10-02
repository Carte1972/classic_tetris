import { describe, expect, it } from 'vitest';
import { PERFORMERS } from '../../../src/celebration/characters';
import {
  drawCelebration,
  getStageSize,
  MATRYOSHKA_OPEN_AT_MS,
} from '../../../src/celebration/celebration_renderer';
import { seekCelebration, startCelebration } from '../../../src/celebration/celebration_state';
import { MATRYOSHKA_SMALL } from '../../../src/celebration/dancers/matryoshka';
import { drawOlympicRings } from '../../../src/celebration/stages/arena_1980';
import { LAUNCHPAD } from '../../../src/celebration/stages/launchpad';
import { drawPixelText, pixelTextWidth } from '../../../src/celebration/stages/pixel_text';
import { STAGE_SIZE } from '../../../src/celebration/stages/stage_types';
import { createFakeContext } from '../render/fake_context';

/** Margen fuera del escenario que se tolera (px). */
const OFFSCREEN_MARGIN = 16;

describe('escenarios', () => {
  it.each(PERFORMERS.map((p) => [p.stage.place, p.stage] as const))(
    '%s se dibuja (con sus elementos animados) dentro del escenario',
    (_, stage) => {
      for (const time of [0, 2500, 7000]) {
        const { ctx, calls } = createFakeContext();
        stage.draw(ctx, time);
        stage.drawFront?.(ctx, time);
        expect(calls.length).toBeGreaterThan(50);
        // Lo que sobresale un poco del borde lo recorta el canvas; no debe dibujarse lejos.
        for (const call of calls) {
          expect(call.x + call.width).toBeGreaterThan(-OFFSCREEN_MARGIN);
          expect(call.x).toBeLessThan(STAGE_SIZE.width + OFFSCREEN_MARGIN);
          expect(call.y).toBeLessThan(STAGE_SIZE.height + OFFSCREEN_MARGIN);
        }
      }
    },
  );

  it('el cohete despega a mitad del baile', () => {
    const rocketTop = (time: number) => {
      const { ctx, calls } = createFakeContext();
      LAUNCHPAD.draw(ctx, time);
      return Math.min(...calls.filter((c) => c.fillStyle === '#e8e8ee').map((c) => c.y));
    };
    expect(rocketTop(1000)).toBe(rocketTop(2000));
    expect(rocketTop(8000)).toBeLessThan(rocketTop(2000) - 20);
  });

  it('los aros olímpicos usan sus cinco colores', () => {
    const { ctx, calls } = createFakeContext();
    drawOlympicRings(ctx, 50, 50, 5, '#ffffff');
    const colors = new Set(calls.map((c) => c.fillStyle));
    for (const color of ['#0a7ac2', '#1b1b22', '#e0243a', '#f2b134', '#1a9a4a']) {
      expect(colors).toContain(color);
    }
  });

  it('los rótulos de píxeles escriben letras cirílicas y números', () => {
    const { ctx, calls } = createFakeContext();
    drawPixelText(ctx, 'МОСКВА-80', 0, 0, 2, '#d23a3a');
    expect(calls.length).toBeGreaterThan(40);
    expect(pixelTextWidth('МОСКВА-80', 2)).toBe((9 * 4 - 1) * 2);
    const unknown = createFakeContext();
    drawPixelText(unknown.ctx, '?', 0, 0, 1, '#000');
    expect(unknown.calls).toHaveLength(0);
  });
});

describe('drawCelebration', () => {
  /** Colores usados en un fotograma de una celebración. */
  function colorsAt(levelsCompleted: number, elapsedMs: number): Set<string> {
    const { ctx, calls } = createFakeContext();
    const state = seekCelebration(
      startCelebration({ level: 1, levelsCompleted, dance: true }),
      elapsedMs,
    );
    drawCelebration(ctx, state);
    return new Set(calls.map((c) => c.fillStyle));
  }

  it('el escenario mide 320 × 180 (16:9)', () => {
    expect(getStageSize()).toEqual({ width: 320, height: 180 });
  });

  it('sin baile solo borra el escenario', () => {
    const { ctx, calls } = createFakeContext();
    drawCelebration(ctx, startCelebration({ level: 1, levelsCompleted: 1, dance: false }));
    expect(calls).toHaveLength(0);
  });

  it('la matrioska grande se abre al empezar el giro y sigue bailando la pequeña', () => {
    // Los colores de sombra de cada muñeca solo los usan ellas.
    const small = MATRYOSHKA_SMALL.outfit.shirtShade;
    const big = PERFORMERS[1]?.dancer.outfit.shirtShade ?? '';
    const before = colorsAt(2, MATRYOSHKA_OPEN_AT_MS - 50);
    expect(before.has(small)).toBe(false);
    expect(before.has(big)).toBe(true);
    const opening = colorsAt(2, MATRYOSHKA_OPEN_AT_MS + 300);
    expect(opening.has(small)).toBe(true);
    expect(opening.has(big)).toBe(true);
    const after = colorsAt(2, MATRYOSHKA_OPEN_AT_MS + 2000);
    expect(after.has(small)).toBe(true);
    expect(after.has(big)).toBe(false);
  });
});
