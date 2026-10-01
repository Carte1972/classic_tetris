import { describe, expect, it, vi } from 'vitest';
import { createGameLoop, type FrameScheduler } from '../../../src/app/game_loop';
import { MAX_FRAME_DELTA_MS } from '../../../src/config/timing_config';

/** Planificador manual: los fotogramas se disparan con `fire(tiempo)`. */
function createManualScheduler() {
  let pending: ((timeMs: number) => void) | null = null;
  let nextId = 1;
  const scheduler: FrameScheduler = {
    request: (callback) => {
      pending = callback;
      return nextId++;
    },
    cancel: () => {
      pending = null;
    },
  };
  const fire = (timeMs: number) => {
    const callback = pending;
    pending = null;
    callback?.(timeMs);
  };
  return { scheduler, fire, hasPending: () => pending !== null };
}

describe('createGameLoop', () => {
  it('pasa el tiempo transcurrido entre fotogramas y dibuja después de actualizar', () => {
    const { scheduler, fire } = createManualScheduler();
    const order: string[] = [];
    const update = vi.fn((dt: number) => order.push(`update:${dt}`));
    const render = vi.fn(() => order.push('render'));
    const loop = createGameLoop({ update, render }, scheduler);
    loop.start();
    fire(1000);
    fire(1016);
    fire(1050);
    expect(order).toEqual(['update:0', 'render', 'update:16', 'render', 'update:34', 'render']);
  });

  it('limita los saltos de tiempo grandes', () => {
    const { scheduler, fire } = createManualScheduler();
    const update = vi.fn();
    const loop = createGameLoop({ update, render: vi.fn() }, scheduler);
    loop.start();
    fire(0);
    fire(10_000);
    expect(update).toHaveBeenLastCalledWith(MAX_FRAME_DELTA_MS);
  });

  it('se detiene y se puede reanudar sin acumular el tiempo parado', () => {
    const { scheduler, fire, hasPending } = createManualScheduler();
    const update = vi.fn();
    const loop = createGameLoop({ update, render: vi.fn() }, scheduler);
    loop.start();
    expect(loop.isRunning()).toBe(true);
    fire(0);
    loop.stop();
    expect(loop.isRunning()).toBe(false);
    expect(hasPending()).toBe(false);
    loop.start();
    loop.start();
    fire(5000);
    expect(update).toHaveBeenLastCalledWith(0);
    loop.stop();
    loop.stop();
    expect(loop.isRunning()).toBe(false);
  });
});
