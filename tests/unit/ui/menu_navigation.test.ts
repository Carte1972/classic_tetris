import { describe, expect, it } from 'vitest';
import { MENU_ITEMS } from '../../../src/config/menu_config';
import { cycleStartLevel, navigateMenu } from '../../../src/ui/menu_navigation';

const indexOf = (id: (typeof MENU_ITEMS)[number]) => MENU_ITEMS.indexOf(id);

describe('navigateMenu', () => {
  it('↑ y ↓ mueven la selección y dan la vuelta en los extremos', () => {
    expect(navigateMenu(0, 'down').selected).toBe(1);
    expect(navigateMenu(1, 'up').selected).toBe(0);
    expect(navigateMenu(0, 'up').selected).toBe(MENU_ITEMS.length - 1);
    expect(navigateMenu(MENU_ITEMS.length - 1, 'down').selected).toBe(0);
    expect(navigateMenu(0, 'down').command).toEqual({ type: 'none' });
  });

  it('Enter en INICIAR JUEGO empieza la partida', () => {
    expect(navigateMenu(indexOf('start'), 'confirm').command).toEqual({ type: 'startGame' });
    expect(navigateMenu(indexOf('start'), 'right').command).toEqual({ type: 'none' });
  });

  it('← → cambian el nivel inicial y Enter lo sube', () => {
    const level = indexOf('startLevel');
    expect(navigateMenu(level, 'left').command).toEqual({ type: 'changeStartLevel', delta: -1 });
    expect(navigateMenu(level, 'right').command).toEqual({ type: 'changeStartLevel', delta: 1 });
    expect(navigateMenu(level, 'confirm').command).toEqual({ type: 'changeStartLevel', delta: 1 });
  });

  it('MÚSICA y CELEBRACIONES se activan o desactivan con Enter o con ← →', () => {
    for (const input of ['left', 'right', 'confirm'] as const) {
      expect(navigateMenu(indexOf('music'), input).command).toEqual({ type: 'toggleMusic' });
      expect(navigateMenu(indexOf('celebrations'), input).command).toEqual({
        type: 'toggleCelebrations',
      });
    }
  });

  it('Enter en CONTROLES y RÉCORDS abre su pantalla', () => {
    expect(navigateMenu(indexOf('controls'), 'confirm').command).toEqual({
      type: 'openControls',
    });
    expect(navigateMenu(indexOf('records'), 'confirm').command).toEqual({ type: 'openRecords' });
    expect(navigateMenu(indexOf('controls'), 'left').command).toEqual({ type: 'none' });
    expect(navigateMenu(indexOf('records'), 'right').command).toEqual({ type: 'none' });
  });

  it('se recupera de una selección fuera de rango', () => {
    expect(navigateMenu(99, 'confirm')).toEqual({ selected: 0, command: { type: 'none' } });
  });

  it('el menú no tiene opción SALIR', () => {
    expect(MENU_ITEMS).toEqual([
      'start',
      'startLevel',
      'music',
      'celebrations',
      'controls',
      'records',
    ]);
  });
});

describe('cycleStartLevel', () => {
  it('recorre los niveles 0–9 dando la vuelta', () => {
    expect(cycleStartLevel(0, 1)).toBe(1);
    expect(cycleStartLevel(9, 1)).toBe(0);
    expect(cycleStartLevel(0, -1)).toBe(9);
    expect(cycleStartLevel(5, -1)).toBe(4);
  });
});
