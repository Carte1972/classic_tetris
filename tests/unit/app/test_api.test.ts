import { describe, expect, it, vi } from 'vitest';
import type { AppController } from '../../../src/app/app_controller';
import { INTERFACE_HIDDEN_CLASS, createTestApi } from '../../../src/app/test_api';
import type { BackgroundScene } from '../../../src/scene/red_square_scene';

/** Lista de clases falsa con el comportamiento de `toggle(clase, forzar)`. */
function createClassList() {
  const classes = new Set<string>();
  return {
    classes,
    classList: {
      toggle: (name: string, force?: boolean) => {
        const add = force ?? !classes.has(name);
        if (add) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
        return add;
      },
    } as unknown as DOMTokenList,
  };
}

describe('createTestApi', () => {
  const controller = {
    getSnapshot: vi.fn(),
    getGameState: vi.fn(),
    patchGame: vi.fn(),
    freezeCelebration: vi.fn(),
  } as unknown as AppController;
  const scene = { setConditions: vi.fn() } as unknown as BackgroundScene;

  it('expone el controlador y la escena', () => {
    const { classList } = createClassList();
    const api = createTestApi(controller, scene, { classList });
    expect(api.getSnapshot).toBe(controller.getSnapshot);
    expect(api.patchGame).toBe(controller.patchGame);
    expect(api.setScene).toBe(scene.setConditions);
  });

  it('oculta y vuelve a mostrar la interfaz marcando la raíz del documento', () => {
    const { classes, classList } = createClassList();
    const api = createTestApi(controller, scene, { classList });
    api.setInterfaceHidden(true);
    expect(classes.has(INTERFACE_HIDDEN_CLASS)).toBe(true);
    api.setInterfaceHidden(true);
    expect(classes.has(INTERFACE_HIDDEN_CLASS)).toBe(true);
    api.setInterfaceHidden(false);
    expect(classes.has(INTERFACE_HIDDEN_CLASS)).toBe(false);
  });
});
