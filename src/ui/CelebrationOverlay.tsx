import { useCallback } from 'react';
import type { RenderTargets } from '../app/game_renderer';
import { TEXTS } from '../config/texts';
import { getStageSize } from '../celebration/celebration_renderer';

/** Propiedades de la capa de celebración. */
export interface CelebrationOverlayProps {
  /** Nivel alcanzado. */
  readonly level: number;
  /** Bailarín y lugar; `null` si no hay baile (solo el rótulo del nivel). */
  readonly caption: string | null;
  /** Registro donde se inscribe el escenario para que el bucle dibuje en él. */
  readonly targets: RenderTargets;
}

/**
 * Capa a pantalla completa con el rótulo del nivel alcanzado y, si las celebraciones
 * están activadas, el escenario donde baila el personaje.
 * @param props Propiedades de la capa.
 * @returns La capa.
 */
export function CelebrationOverlay(props: CelebrationOverlayProps): React.JSX.Element {
  const { level, caption, targets } = props;
  const dance = caption !== null;
  const size = getStageSize();
  const registerStage = useCallback(
    (canvas: HTMLCanvasElement | null) => targets.registerStage(canvas?.getContext('2d') ?? null),
    [targets],
  );
  return (
    <div className="celebration" role="dialog" aria-label={TEXTS.celebration.levelUp(level)}>
      <div className="celebration-heading">
        <h2 className="accent celebration-title">{TEXTS.celebration.levelUp(level)}</h2>
        {dance && <p className="celebration-caption">{caption}</p>}
      </div>
      {dance && (
        <canvas
          ref={registerStage}
          className="pixel-canvas celebration-stage"
          width={size.width}
          height={size.height}
          role="img"
          aria-label="Baile de celebración"
        />
      )}
      {dance && <p className="hint">{TEXTS.celebration.skip}</p>}
    </div>
  );
}
