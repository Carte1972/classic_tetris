import { describe, expect, it } from 'vitest';
import { PLAZA_EVENT_KINDS, type PlazaEventKind } from '../../../src/config/plaza_events_config';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../../../src/config/scene_config';
import type { EventFrame } from '../../../src/scene/events/event_types';
import { PLAZA_EVENTS } from '../../../src/scene/events/plaza_events';
import { createFakeContext, type FillCall } from '../render/fake_context';

/** Duración de referencia de un evento en los tests (ms). */
const DURATION_MS = 80_000;

/**
 * Fotograma de un evento.
 * @param elapsedMs Tiempo desde que empezó.
 * @param night Nivel de noche.
 */
function frameAt(elapsedMs: number, night = 0): EventFrame {
  return { elapsedMs, durationMs: DURATION_MS, presence: 1, timeMs: 100_000 + elapsedMs, night };
}

/**
 * Dibuja todo lo que aporta un evento en un fotograma.
 * @param kind Evento.
 * @param frame Fotograma.
 */
function drawEvent(kind: PlazaEventKind, frame: EventFrame): FillCall[] {
  const event = PLAZA_EVENTS[kind];
  const { ctx, calls } = createFakeContext();
  event.drawSky?.(ctx, frame);
  event.drawBackDecor?.(ctx, frame);
  event.actors(frame).forEach((actor) => actor.draw(ctx));
  event.drawFrontDecor?.(ctx, frame);
  return calls;
}

/** Columnas de los dibujos de figurantes de un tipo de ropa, para seguirlos. */
function columnsOf(calls: readonly FillCall[], color: string): number[] {
  return calls.filter((c) => c.fillStyle === color).map((c) => c.x);
}

describe('eventos de la plaza', () => {
  it.each(PLAZA_EVENT_KINDS)('%s dibuja decorados y figurantes con valores válidos', (kind) => {
    const event = PLAZA_EVENTS[kind];
    expect(event.kind).toBe(kind);
    const frame = frameAt(30_000, 0.8);
    expect(event.actors(frame).length).toBeGreaterThanOrEqual(5);
    const calls = drawEvent(kind, frame);
    expect(calls.length).toBeGreaterThan(200);
    for (const call of calls) {
      expect(Number.isFinite(call.x + call.y + call.width + call.height)).toBe(true);
      expect(call.x).toBeLessThan(SCENE_WIDTH + 200);
      expect(call.y).toBeLessThan(SCENE_HEIGHT + 50);
    }
    const light = event.illumination?.(frame) ?? { back: 0, front: 0 };
    for (const value of [light.back, light.front]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('el desfile saca cada vez más unidades y los aviones pasan por el cielo', () => {
    const early = PLAZA_EVENTS.parade.actors(frameAt(5_000)).length;
    const later = PLAZA_EVENTS.parade.actors(frameAt(40_000)).length;
    expect(later).toBeGreaterThan(early);
    const sky = createFakeContext();
    PLAZA_EVENTS.parade.drawSky?.(sky.ctx, frameAt(DURATION_MS * 0.32 + 2_000));
    expect(sky.calls.length).toBeGreaterThan(10);
    const quiet = createFakeContext();
    PLAZA_EVENTS.parade.drawSky?.(quiet.ctx, frameAt(1_000));
    expect(quiet.calls).toHaveLength(0);
  });

  it('la procesión de Pascua avanza hacia la izquierda', () => {
    const gold = '#e8c45a';
    const before = Math.min(...columnsOf(drawEvent('easter', frameAt(10_000)), gold));
    const after = Math.min(...columnsOf(drawEvent('easter', frameAt(40_000)), gold));
    expect(after).toBeLessThan(before);
  });

  it('el muñeco de Maslenitsa arde al final del evento', () => {
    const flame = (calls: readonly FillCall[]) =>
      calls.filter((c) => c.fillStyle.startsWith('rgba(255, 138, 26')).length;
    expect(flame(drawEvent('maslenitsa', frameAt(10_000)))).toBe(0);
    expect(flame(drawEvent('maslenitsa', frameAt(DURATION_MS * 0.62 + 8_000)))).toBeGreaterThan(0);
  });

  it('los fuegos artificiales iluminan la plaza en los estallidos', () => {
    const values = Array.from({ length: 40 }, (_, i) => {
      const light = PLAZA_EVENTS.fireworks.illumination?.(frameAt(20_000 + i * 50));
      return light?.back ?? 0;
    });
    expect(Math.max(...values)).toBeGreaterThan(Math.min(...values));
  });

  it('las luces de Navidad parpadean', () => {
    const a = drawEvent('christmas', frameAt(10_000));
    const b = drawEvent('christmas', frameAt(10_450));
    expect(a.map((c) => c.fillStyle)).not.toEqual(b.map((c) => c.fillStyle));
  });
});
