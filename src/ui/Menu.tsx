import { MENU_ITEMS, type MenuItemId } from '../config/menu_config';
import { TEXTS } from '../config/texts';
import type { Preferences } from '../storage/preferences_store';

/** Propiedades del menú principal. */
export interface MenuProps {
  /** Índice de la opción seleccionada. */
  readonly selected: number;
  readonly preferences: Preferences;
}

/**
 * Texto de una opción del menú y su valor actual, si tiene.
 * @param item Opción.
 * @param preferences Preferencias actuales.
 * @returns Etiqueta y valor.
 */
function describeItem(item: MenuItemId, preferences: Preferences): [string, string | null] {
  switch (item) {
    case 'start':
      return [TEXTS.menu.start, null];
    case 'startLevel':
      return [TEXTS.menu.startLevel, String(preferences.startLevel)];
    case 'music':
      return [TEXTS.menu.music, preferences.musicEnabled ? TEXTS.menu.on : TEXTS.menu.off];
    case 'celebrations':
      return [
        TEXTS.menu.celebrations,
        preferences.celebrationsEnabled ? TEXTS.menu.onPlural : TEXTS.menu.offPlural,
      ];
    case 'controls':
      return [TEXTS.menu.controls, null];
    case 'records':
      return [TEXTS.menu.records, null];
  }
}

/**
 * Menú principal navegable con el teclado; la opción seleccionada lleva un cursor que
 * parpadea.
 * @param props Propiedades del menú.
 * @returns La lista de opciones.
 */
export function Menu(props: MenuProps): React.JSX.Element {
  const { selected, preferences } = props;
  return (
    <ul className="menu" role="menu">
      {MENU_ITEMS.map((item, index) => {
        const [label, value] = describeItem(item, preferences);
        const isSelected = index === selected;
        return (
          <li
            key={item}
            role="menuitem"
            aria-current={isSelected ? 'true' : undefined}
            className={isSelected ? 'menu-item selected' : 'menu-item'}
          >
            <span className="cursor" aria-hidden="true">
              {isSelected ? '▶' : ''}
            </span>
            <span className="menu-label">{label}</span>
            {value !== null && <span className="menu-value">{value}</span>}
          </li>
        );
      })}
    </ul>
  );
}
