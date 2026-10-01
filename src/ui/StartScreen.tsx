import { TEXTS } from '../config/texts';
import type { Preferences } from '../storage/preferences_store';
import { Menu } from './Menu';
import { TitleLogo } from './TitleLogo';

/** Propiedades de la pantalla de inicio. */
export interface StartScreenProps {
  readonly menuIndex: number;
  readonly preferences: Preferences;
}

/**
 * Pantalla de inicio: título y menú principal.
 * @param props Propiedades de la pantalla.
 * @returns La pantalla.
 */
export function StartScreen(props: StartScreenProps): React.JSX.Element {
  const { menuIndex, preferences } = props;
  return (
    <section className="screen" aria-label={TEXTS.title}>
      <TitleLogo />
      <Menu selected={menuIndex} preferences={preferences} />
      <p className="hint">{TEXTS.menu.hint}</p>
    </section>
  );
}
