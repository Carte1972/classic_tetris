import { useCallback } from 'react';
import type { RenderTargets } from '../app/game_renderer';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config/scene_config';

/** Propiedades del fondo animado. */
export interface BackgroundCanvasProps {
  /** Registro donde se inscribe el canvas para que el bucle dibuje en él. */
  readonly targets: RenderTargets;
}

/**
 * Fondo animado a pantalla completa (la Plaza Roja) detrás de todas las pantallas.
 * @param props Propiedades del fondo.
 * @returns El canvas del fondo.
 */
export function BackgroundCanvas(props: BackgroundCanvasProps): React.JSX.Element {
  const { targets } = props;
  const register = useCallback(
    (canvas: HTMLCanvasElement | null) =>
      targets.registerBackground(canvas?.getContext('2d') ?? null),
    [targets],
  );
  return (
    <canvas
      ref={register}
      className="pixel-canvas background"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      aria-hidden="true"
    />
  );
}
