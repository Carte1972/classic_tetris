import { describe, expect, it } from 'vitest';
import { DAS_INITIAL_DELAY_FRAMES, DAS_REPEAT_FRAMES } from '../../../src/config/input_config';
import {
  INITIAL_DAS_STATE,
  updateDas,
  type DasConfig,
  type DasState,
  type HorizontalDirection,
} from '../../../src/input/das';

/** Simula `frames` frames con las teclas indicadas y devuelve los frames (1..n) con desplazamiento. */
function shiftsWhileHolding(
  frames: number,
  left: boolean,
  right: boolean,
  config?: DasConfig,
): { frame: number; shift: HorizontalDirection }[] {
  let state: DasState = INITIAL_DAS_STATE;
  const shifts: { frame: number; shift: HorizontalDirection }[] = [];
  for (let frame = 1; frame <= frames; frame++) {
    const result = updateDas(state, left, right, config);
    state = result.state;
    if (result.shift !== 0) {
      shifts.push({ frame, shift: result.shift });
    }
  }
  return shifts;
}

describe('updateDas', () => {
  it('usa los tiempos de NES por defecto (16 y 6 frames)', () => {
    expect(DAS_INITIAL_DELAY_FRAMES).toBe(16);
    expect(DAS_REPEAT_FRAMES).toBe(6);
  });

  it('desplaza en el acto al pulsar y después a los 16 frames y cada 6', () => {
    const frames = shiftsWhileHolding(1 + 16 + 6 + 6, false, true).map((s) => s.frame);
    expect(frames).toEqual([1, 17, 23, 29]);
  });

  it('desplaza hacia la izquierda con la flecha izquierda', () => {
    expect(shiftsWhileHolding(1, true, false)).toEqual([{ frame: 1, shift: -1 }]);
  });

  it('no desplaza si se pulsan ambas direcciones o ninguna', () => {
    expect(shiftsWhileHolding(40, true, true)).toEqual([]);
    expect(shiftsWhileHolding(40, false, false)).toEqual([]);
  });

  it('cambiar de dirección desplaza en el acto y reinicia la carga', () => {
    const charged = updateDas({ direction: 1, chargeFrames: 15 }, true, false);
    expect(charged.shift).toBe(-1);
    expect(charged.state).toEqual({ direction: -1, chargeFrames: 0 });
  });

  it('soltar la tecla reinicia el DAS', () => {
    expect(updateDas({ direction: 1, chargeFrames: 12 }, false, false).state).toEqual(
      INITIAL_DAS_STATE,
    );
  });

  it('acepta tiempos configurables', () => {
    const frames = shiftsWhileHolding(12, false, true, {
      initialDelayFrames: 4,
      repeatFrames: 2,
    }).map((s) => s.frame);
    expect(frames).toEqual([1, 5, 7, 9, 11]);
  });
});
