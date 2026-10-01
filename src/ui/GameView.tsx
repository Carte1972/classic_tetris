import { useEffect, useRef, type CSSProperties } from 'react';
import { createGameLoop } from '../app/game_loop';
import { createRandomSeed } from '../app/seed';
import { RENDER_SCALE } from '../config/render_config';
import { createInitialState } from '../engine/game_state';
import { EMPTY_INPUT, step } from '../engine/step';
import { drawBoard } from '../render/board_renderer';
import { getBoardCanvasSize, getPreviewCanvasSize } from '../render/layout';
import { drawNextPiece } from '../render/next_piece_renderer';
import type { CanvasSize } from '../render/render_context';

/**
 * Estilo que escala un canvas pixel-art sin suavizado.
 * @param size Tamaño lógico del canvas.
 * @returns Estilo CSS con el tamaño en pantalla.
 */
function pixelCanvasStyle(size: CanvasSize): CSSProperties {
  return {
    width: size.width * RENDER_SCALE,
    height: size.height * RENDER_SCALE,
    imageRendering: 'pixelated',
  };
}

/**
 * Vista de la partida: pozo y siguiente pieza, animados por el bucle de juego.
 * @returns Los canvas del juego.
 */
export function GameView(): React.JSX.Element {
  const boardRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const boardSize = getBoardCanvasSize();
  const previewSize = getPreviewCanvasSize();

  useEffect(() => {
    const boardContext = boardRef.current?.getContext('2d');
    const previewContext = previewRef.current?.getContext('2d');
    if (!boardContext || !previewContext) {
      return undefined;
    }
    let state = createInitialState({ seed: createRandomSeed(), startLevel: 0 });
    const loop = createGameLoop({
      update: (dtMs) => {
        state = step(state, EMPTY_INPUT, dtMs).state;
      },
      render: () => {
        drawBoard(boardContext, state, { hidden: false });
        drawNextPiece(previewContext, state.nextPiece);
      },
    });
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
      <canvas
        ref={boardRef}
        width={boardSize.width}
        height={boardSize.height}
        style={pixelCanvasStyle(boardSize)}
        aria-label="Tablero"
      />
      <canvas
        ref={previewRef}
        width={previewSize.width}
        height={previewSize.height}
        style={pixelCanvasStyle(previewSize)}
        aria-label="Siguiente pieza"
      />
    </div>
  );
}
