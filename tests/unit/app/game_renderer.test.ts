import { describe, expect, it } from 'vitest';
import { createRenderTargets, renderGame } from '../../../src/app/game_renderer';
import { startCelebration } from '../../../src/celebration/celebration_state';
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

  it('dibuja la celebración en el escenario registrado', () => {
    const targets = createRenderTargets();
    let clears = 0;
    const stage = {
      ...createFakeContext().ctx,
      clearRect: () => {
        clears++;
      },
    };
    targets.registerStage(stage);
    expect(targets.getStage()).toBe(stage);
    renderGame(
      targets,
      'celebrating',
      game,
      startCelebration({ level: 1, levelsCompleted: 1, dance: true }),
    );
    expect(clears).toBe(1);
    targets.registerStage(null);
    renderGame(
      targets,
      'celebrating',
      game,
      startCelebration({ level: 1, levelsCompleted: 1, dance: true }),
    );
    expect(clears).toBe(1);
  });

  it('en niveles altos el recuadro de la siguiente pieza queda vacío', () => {
    const targets = createRenderTargets();
    const preview = createFakeContext();
    targets.register('preview', preview.ctx);
    renderGame(targets, 'playing', { ...game, level: 15 });
    expect(preview.calls).toHaveLength(1);
  });
});
