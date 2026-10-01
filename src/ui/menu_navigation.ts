import { MENU_ITEMS, type MenuItemId } from '../config/menu_config';
import { MAX_START_LEVEL, MIN_START_LEVEL } from '../config/scoring_config';

/** Entradas que entiende el menú. */
export type MenuInput = 'up' | 'down' | 'left' | 'right' | 'confirm';

/** Acción que pide el menú tras una entrada. */
export type MenuCommand =
  | { readonly type: 'none' }
  | { readonly type: 'startGame' }
  | { readonly type: 'changeStartLevel'; readonly delta: 1 | -1 }
  | { readonly type: 'toggleMusic' }
  | { readonly type: 'toggleCelebrations' }
  | { readonly type: 'openControls' }
  | { readonly type: 'openRecords' };

/** Resultado de procesar una entrada del menú. */
export interface MenuNavigation {
  /** Índice de la opción seleccionada. */
  readonly selected: number;
  readonly command: MenuCommand;
}

/** Comando que no hace nada. */
const NONE: MenuCommand = { type: 'none' };

/**
 * Procesa una entrada en el menú principal: ↑ ↓ mueven la selección (dando la vuelta),
 * ← → cambian el valor de la opción y Enter la ejecuta.
 * @param selected Índice seleccionado.
 * @param input Entrada.
 * @param items Opciones del menú.
 * @returns Nueva selección y acción pedida.
 */
export function navigateMenu(
  selected: number,
  input: MenuInput,
  items: readonly MenuItemId[] = MENU_ITEMS,
): MenuNavigation {
  const count = items.length;
  if (input === 'up') {
    return { selected: (selected - 1 + count) % count, command: NONE };
  }
  if (input === 'down') {
    return { selected: (selected + 1) % count, command: NONE };
  }
  const item = items[selected];
  if (item === undefined) {
    return { selected: 0, command: NONE };
  }
  return { selected, command: commandFor(item, input) };
}

/**
 * Cambia el nivel inicial dando la vuelta en el rango 0–9.
 * @param level Nivel actual.
 * @param delta +1 o -1.
 * @returns Nuevo nivel.
 */
export function cycleStartLevel(level: number, delta: 1 | -1): number {
  const range = MAX_START_LEVEL - MIN_START_LEVEL + 1;
  return ((level - MIN_START_LEVEL + delta + range) % range) + MIN_START_LEVEL;
}

/**
 * Acción de una opción para una entrada lateral o de confirmación.
 * @param item Opción seleccionada.
 * @param input Entrada `left`, `right` o `confirm`.
 * @returns La acción.
 */
function commandFor(item: MenuItemId, input: Exclude<MenuInput, 'up' | 'down'>): MenuCommand {
  switch (item) {
    case 'start':
      return input === 'confirm' ? { type: 'startGame' } : NONE;
    case 'startLevel':
      return { type: 'changeStartLevel', delta: input === 'left' ? -1 : 1 };
    case 'music':
      return { type: 'toggleMusic' };
    case 'celebrations':
      return { type: 'toggleCelebrations' };
    case 'controls':
      return input === 'confirm' ? { type: 'openControls' } : NONE;
    case 'records':
      return input === 'confirm' ? { type: 'openRecords' } : NONE;
  }
}
