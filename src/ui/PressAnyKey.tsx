import { TEXTS } from '../config/texts';
import { TitleLogo } from './TitleLogo';

/**
 * Pantalla inicial que espera una pulsación para poder activar el audio.
 * @returns La pantalla.
 */
export function PressAnyKey(): React.JSX.Element {
  return (
    <section className="screen" aria-label={TEXTS.title}>
      <TitleLogo />
      <p className="blink">{TEXTS.pressAnyKey}</p>
    </section>
  );
}
