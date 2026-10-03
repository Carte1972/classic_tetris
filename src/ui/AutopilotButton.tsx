import type { MouseEvent } from 'react';
import { TEXTS } from '../config/texts';

/** Propiedades del botón del piloto automático. */
export interface AutopilotButtonProps {
  /** Si el piloto está activo. */
  readonly enabled: boolean;
  /** Acción al pulsarlo (`controller.toggleAutopilot`). */
  readonly onToggle: () => void;
}

/**
 * Evita que el botón se quede con el foco al pulsarlo con el ratón: el juego usa ENTER y
 * ESPACIO, y un botón enfocado se activaría con ellas.
 * @param event Evento del ratón.
 */
function keepFocusAway(event: MouseEvent<HTMLButtonElement>): void {
  event.preventDefault();
}

/**
 * Botón que activa y desactiva el piloto automático. Es la única forma de hacerlo.
 * @param props Propiedades del botón.
 * @returns El botón.
 */
export function AutopilotButton(props: AutopilotButtonProps): React.JSX.Element {
  const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
    // Si llegó a enfocarse (por ejemplo, con el tabulador), se suelta tras pulsarlo.
    event.currentTarget.blur();
    props.onToggle();
  };
  return (
    <button
      type="button"
      className={props.enabled ? 'autopilot-button active' : 'autopilot-button'}
      aria-pressed={props.enabled}
      onMouseDown={keepFocusAway}
      onClick={handleClick}
    >
      {props.enabled ? TEXTS.autopilot.on : TEXTS.autopilot.off}
    </button>
  );
}
