import { useEffect, useState } from 'react';
import { getViewportRenderScale } from '../render/viewport_scale';

/**
 * Escala de la zona de juego según el tamaño de la ventana; se recalcula al cambiarlo.
 * @returns Escala entera actual.
 */
export function useRenderScale(): number {
  const [scale, setScale] = useState(() =>
    getViewportRenderScale(window.innerWidth, window.innerHeight),
  );
  useEffect(() => {
    /** Recalcula la escala con el tamaño actual de la ventana. */
    const update = (): void => {
      setScale(getViewportRenderScale(window.innerWidth, window.innerHeight));
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return scale;
}
