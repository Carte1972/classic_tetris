import { useCallback, type CSSProperties } from 'react';
import type { RenderTargets } from '../app/game_renderer';
import { TEXTS } from '../config/texts';
import { getStageSize } from '../celebration/celebration_renderer';

/** Propiedades de la capa de celebración. */
export interface CelebrationOverlayProps {
  /** Nivel alcanzado. */
  readonly level: number;
  /** Registro donde se inscribe el escenario para que el bucle dibuje en él. */
  readonly targets: RenderTargets;
}

/**
 * Capa a pantalla completa con el escenario donde baila el personaje de la subida de
 * nivel.
 * @param props Propiedades de la capa.
 * @returns La capa.
 */
export function CelebrationOverlay(props: CelebrationOverlayProps): React.JSX.Element {
  const { level, targets } = props;
  const size = getStageSize();
  const registerStage = useCallback(
    (canvas: HTMLCanvasElement | null) => targets.registerStage(canvas?.getContext('2d') ?? null),
    [targets],
  );
  return (
    <div className="celebration" role="dialog" aria-label={TEXTS.celebration.levelUp(level)}>
      <h2 className="accent celebration-title">{TEXTS.celebration.levelUp(level)}</h2>
      <canvas
        ref={registerStage}
        className="pixel-canvas celebration-stage"
        width={size.width}
        height={size.height}
        style={
          {
            aspectRatio: `${size.width} / ${size.height}`,
            '--stage-ratio': size.width / size.height,
          } as CSSProperties
        }
        role="img"
        aria-label="Baile de celebración"
      />
      <p className="hint">{TEXTS.celebration.skip}</p>
    </div>
  );
}
