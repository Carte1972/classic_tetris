import type { CanvasSize } from '../render/render_context';

/** Propiedades de un canvas pixel-art. */
export interface PixelCanvasProps {
  /** Tamaño lógico del canvas. */
  readonly size: CanvasSize;
  /** Factor de escalado entero en pantalla. */
  readonly scale: number;
  /** Nombre accesible del canvas. */
  readonly label: string;
  /** Recibe el elemento al montarse y `null` al desmontarse. */
  readonly canvasRef: (canvas: HTMLCanvasElement | null) => void;
}

/**
 * Canvas con resolución lógica baja escalado sin suavizado.
 * @param props Propiedades del canvas.
 * @returns El elemento canvas.
 */
export function PixelCanvas(props: PixelCanvasProps): React.JSX.Element {
  const { size, scale, label, canvasRef } = props;
  return (
    <canvas
      ref={canvasRef}
      className="pixel-canvas"
      width={size.width}
      height={size.height}
      style={{ width: size.width * scale, height: size.height * scale }}
      role="img"
      aria-label={label}
    />
  );
}
