import { describe, expect, it } from 'vitest';
import { createRenderTargets, renderGame } from '../../../src/app/game_renderer';
import { PREVIEW_BACKGROUND_COLOR } from '../../../src/config/palette';
import { createInitialState } from '../../../src/engine/game_state';
import { createFakeContext } from '../render/fake_context';

const game = createInitialState({ seed: 1, startLevel: 0 });

describe('renderGame', () => {
  it('dibuja tablero y siguiente pieza en los canvas registrados', () => {
    const targets = createRenderTargets();
    const board = createFakeContext();
    const preview = createFakeContext();
    targets.register('board', board.ctx);
    targets.register('preview', preview.ctx);
    renderGame(targets, 'playing', game);
    expect(board.calls.length).toBeGreaterThan(1);
    expect(preview.calls[0]?.fillStyle).toBe(PREVIEW_BACKGROUND_COLOR);
  });

  it('en pausa oculta el tablero', () => {
    const targets = createRenderTargets();
    const board = createFakeContext();
    targets.register('board', board.ctx);
    renderGame(targets, 'paused', game);
    expect(board.calls).toHaveLength(1);
  });

  it('no dibuja nada sin partida ni en canvas eliminados', () => {
    const targets = createRenderTargets();
    const board = createFakeContext();
    targets.register('board', board.ctx);
    renderGame(targets, 'menu', null);
    targets.register('board', null);
    renderGame(targets, 'playing', game);
    expect(board.calls).toHaveLength(0);
    expect(targets.get('board')).toBeNull();
  });
});
