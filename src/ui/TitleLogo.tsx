import { useCallback } from 'react';
import { TEXTS } from '../config/texts';
import { TITLE_SCALE } from '../config/title_config';
import { drawTitle, getTitleCanvasSize } from '../render/title_renderer';
import { PixelCanvas } from './PixelCanvas';

/**
 * Título "ТЕТРИС" dibujado con bloques del juego.
 * @returns El título.
 */
export function TitleLogo(): React.JSX.Element {
  const draw = useCallback((canvas: HTMLCanvasElement | null) => {
    const context = canvas?.getContext('2d');
    if (context) {
      drawTitle(context);
    }
  }, []);
  return (
    <h1 className="title">
      <PixelCanvas
        size={getTitleCanvasSize()}
        scale={TITLE_SCALE}
        label={TEXTS.title}
        canvasRef={draw}
      />
    </h1>
  );
}
