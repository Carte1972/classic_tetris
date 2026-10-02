import { describe, expect, it } from 'vitest';
import { PERFORMERS } from '../../../src/celebration/characters';
import { placeDancer } from '../../../src/celebration/dancer_renderer';
import { BASKETBALL_GIANT } from '../../../src/celebration/dancers/basketball_giant';
import { CHESS_MASTER } from '../../../src/celebration/dancers/chess_master';
import { buildHumanoid } from '../../../src/celebration/dancers/humanoid';
import { MATRYOSHKA_SMALL } from '../../../src/celebration/dancers/matryoshka';
import { DANCE_DURATION_MS, DANCE_SEGMENTS } from '../../../src/celebration/puppet/choreography';
import { drawBody } from '../../../src/celebration/puppet/puppet_renderer';
import {
  STAGE_CENTER_X,
  STAGE_GROUND_Y,
  STAGE_SIZE,
} from '../../../src/celebration/stages/stage_types';
import { createFakeContext } from '../render/fake_context';

const DANCERS = [...PERFORMERS.map((p) => p.dancer), MATRYOSHKA_SMALL];

/** Instantes de muestra repartidos por toda la coreografía. */
const SAMPLES = Array.from({ length: 41 }, (_, i) => (i * DANCE_DURATION_MS) / 40);

/** Instante central de cada movimiento. */
const MOVE_MIDDLES = (() => {
  let start = 0;
  return DANCE_SEGMENTS.map((segment) => {
    const middle = start + segment.durationMs / 2;
    start += segment.durationMs;
    return { move: segment.move, at: middle };
  });
})();

describe('bailarines', () => {
  it.each(DANCERS.map((d) => [d.id, d] as const))(
    '%s se dibuja en toda la coreografía sin salirse del escenario mientras baila en el centro',
    (_, dancer) => {
      for (const time of SAMPLES) {
        const { skeleton, frame } = placeDancer(dancer, time, STAGE_CENTER_X, STAGE_GROUND_Y);
        const { ctx, calls } = createFakeContext();
        drawBody(ctx, buildHumanoid(dancer, skeleton, frame));
        expect(calls.length).toBeGreaterThan(30);
        if (frame.move !== 'enter' && frame.move !== 'exit') {
          for (const call of calls) {
            expect(call.y).toBeGreaterThanOrEqual(0);
            expect(call.y).toBeLessThanOrEqual(STAGE_SIZE.height);
          }
        }
      }
    },
  );

  it('todos tienen nombre y los nombres no se repiten', () => {
    const names = PERFORMERS.map((p) => p.dancer.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain('RASPUTÍN');
    expect(names).toContain('EL GIGANTE DEL BALONCESTO');
  });

  it('el gigante es mucho más alto que el cosaco', () => {
    const heightOf = (index: number) => {
      const dancer = PERFORMERS[index]?.dancer;
      if (dancer === undefined) {
        throw new Error('Falta el bailarín');
      }
      const { skeleton } = placeDancer(
        dancer,
        1500 + 2600 + 1000 + 1100 + 1900 + 900 + 10,
        STAGE_CENTER_X,
        STAGE_GROUND_Y,
      );
      return STAGE_GROUND_Y - skeleton.head.y;
    };
    expect(heightOf(6)).toBeGreaterThan(heightOf(0) * 1.3);
  });

  it('el balón del gigante cambia de sitio en cada movimiento: bota, gira, sube para el mate', () => {
    const ballColor = '#e8792b';
    const positions = MOVE_MIDDLES.map(({ move, at }) => {
      const { skeleton, frame } = placeDancer(BASKETBALL_GIANT, at, STAGE_CENTER_X, STAGE_GROUND_Y);
      const { ctx, calls } = createFakeContext();
      drawBody(ctx, buildHumanoid(BASKETBALL_GIANT, skeleton, frame));
      const ball = calls.filter((c) => c.fillStyle === ballColor);
      expect(ball.length).toBeGreaterThan(0);
      return { move, top: Math.min(...ball.map((c) => c.y)), head: skeleton.head.y };
    });
    const jump = positions.find((p) => p.move === 'jump');
    expect(jump !== undefined && jump.top < jump.head).toBe(true);
  });

  it('el gran maestro lleva la pieza de rey en la mano', () => {
    const { skeleton, frame } = placeDancer(CHESS_MASTER, 500, STAGE_CENTER_X, STAGE_GROUND_Y);
    const { ctx, calls } = createFakeContext();
    drawBody(ctx, buildHumanoid(CHESS_MASTER, skeleton, frame));
    expect(calls.some((c) => c.fillStyle === '#f6f1e2')).toBe(true);
  });

  it('la mitad de arriba y la de abajo separan torso y piernas', () => {
    const dancer = PERFORMERS[1]?.dancer;
    if (dancer === undefined) {
      throw new Error('Falta la matrioska');
    }
    const { skeleton, frame } = placeDancer(dancer, 4000, STAGE_CENTER_X, STAGE_GROUND_Y);
    const whole = buildHumanoid(dancer, skeleton, frame).shapes.length;
    const upper = buildHumanoid(dancer, skeleton, frame, 'upper').shapes.length;
    const lower = buildHumanoid(dancer, skeleton, frame, 'lower').shapes.length;
    expect(upper + lower).toBeLessThanOrEqual(whole);
    expect(upper).toBeGreaterThan(0);
    expect(lower).toBeGreaterThan(0);
  });
});
