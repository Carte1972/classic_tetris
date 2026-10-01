import { useEffect, useRef, type CSSProperties } from 'react';
import { createGameLoop } from '../app/game_loop';
import { createGameSession } from '../app/game_session';
import { createRandomSeed } from '../app/seed';
import { RENDER_SCALE } from '../config/render_config';
import { attachKeyboard } from '../input/keyboard_listener';
import { createKeyboardState } from '../input/keyboard_state';
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
 * Vista de la partida: pozo y siguiente pieza, animados por el bucle de juego y
 * controlados con el teclado.
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
    const keyboard = createKeyboardState();
    const detachKeyboard = attachKeyboard(window, keyboard);
    const session = createGameSession({ seed: createRandomSeed(), startLevel: 0 }, keyboard);
    const loop = createGameLoop({
      update: (dtMs) => {
        session.advance(dtMs);
      },
      render: () => {
        const state = session.getState();
        drawBoard(boardContext, state, { hidden: false });
        drawNextPiece(previewContext, state.nextPiece);
      },
    });
    loop.start();
    return () => {
      loop.stop();
      detachKeyboard();
    };
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
