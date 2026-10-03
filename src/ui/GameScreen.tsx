import { useCallback, type CSSProperties } from 'react';
import type { AppSnapshot, HudData } from '../app/app_controller';
import type { RenderTargets } from '../app/game_renderer';
import { RENDER_SCALE } from '../config/render_config';
import { TEXTS } from '../config/texts';
import { getBoardCanvasSize, getPreviewCanvasSize } from '../render/layout';
import { AutopilotButton } from './AutopilotButton';
import { CelebrationOverlay } from './CelebrationOverlay';
import { Hud } from './Hud';
import { NameEntry } from './NameEntry';
import { PixelCanvas } from './PixelCanvas';
import { useRenderScale } from './use_render_scale';

/** Propiedades de la pantalla de partida. */
export interface GameScreenProps {
  readonly snapshot: AppSnapshot;
  readonly hud: HudData;
  readonly targets: RenderTargets;
  /** Activa o desactiva el piloto automático. */
  readonly onToggleAutopilot: () => void;
  /** Guarda en el ranking la partida terminada con el nombre escrito. */
  readonly onSubmitRecordName: (name: string) => void;
}

/**
 * Pantalla de partida: marcador con el botón del piloto automático debajo, pozo y siguiente
 * pieza, con las capas de pausa, de nombre para el ranking y de fin de partida encima del
 * pozo y la de celebración a pantalla completa (el botón queda por encima de ella).
 * @param props Propiedades de la pantalla.
 * @returns La pantalla.
 */
export function GameScreen(props: GameScreenProps): React.JSX.Element {
  const { snapshot, hud, targets, onToggleAutopilot, onSubmitRecordName } = props;
  const registerBoard = useCallback(
    (canvas: HTMLCanvasElement | null) =>
      targets.register('board', canvas?.getContext('2d') ?? null),
    [targets],
  );
  const registerPreview = useCallback(
    (canvas: HTMLCanvasElement | null) =>
      targets.register('preview', canvas?.getContext('2d') ?? null),
    [targets],
  );
  const result = snapshot.lastResult;
  const scale = useRenderScale();
  // Los tamaños del CSS están pensados para la escala de referencia y se multiplican por esto.
  const style = { '--ui-scale': scale / RENDER_SCALE } as CSSProperties;

  return (
    <section className="game" aria-label="Partida" style={style}>
      <div className="side">
        <Hud hud={hud} muted={snapshot.preferences.muted} />
        <AutopilotButton enabled={snapshot.autopilotEnabled} onToggle={onToggleAutopilot} />
      </div>
      <div className="board-frame">
        <PixelCanvas
          size={getBoardCanvasSize()}
          scale={scale}
          label="Tablero"
          canvasRef={registerBoard}
        />
        {snapshot.screen === 'paused' && (
          <div className="overlay" role="dialog" aria-label={TEXTS.pause.title}>
            <h2 className="blink">{TEXTS.pause.title}</h2>
            <p className="hint">{TEXTS.pause.hint}</p>
          </div>
        )}
        {snapshot.screen === 'nameEntry' && result !== null && result.rank !== null && (
          <NameEntry rank={result.rank} score={result.score} onSubmit={onSubmitRecordName} />
        )}
        {snapshot.screen === 'gameOver' && result !== null && (
          <div className="overlay" role="dialog" aria-label={TEXTS.gameOver.title}>
            <h2 className="danger">{TEXTS.gameOver.title}</h2>
            <dl className="result">
              <dt>{TEXTS.hud.score}</dt>
              <dd data-testid="result-score">{result.score}</dd>
              <dt>{TEXTS.hud.lines}</dt>
              <dd>{result.lines}</dd>
              <dt>{TEXTS.hud.level}</dt>
              <dd>{result.level}</dd>
            </dl>
            {result.autopilotUsed && <p className="accent">{TEXTS.gameOver.autopilotUsed}</p>}
            {result.rank === 0 && <p className="accent blink">{TEXTS.gameOver.newRecord}</p>}
            {result.rank !== null && result.rank > 0 && (
              <p className="accent">{TEXTS.gameOver.ranked}</p>
            )}
            <p className="hint">
              {TEXTS.gameOver.hintRestart}
              <br />
              {TEXTS.gameOver.hintMenu}
            </p>
          </div>
        )}
      </div>
      <div className="panel next">
        <h2 className="panel-title">{TEXTS.hud.next}</h2>
        {!hud.nextVisible && <p className="hint next-hidden">{TEXTS.hud.nextHidden}</p>}
        <PixelCanvas
          size={getPreviewCanvasSize()}
          scale={scale}
          label={TEXTS.hud.next}
          canvasRef={registerPreview}
        />
      </div>
      {snapshot.screen === 'celebrating' && snapshot.celebrationLevel !== null && (
        <CelebrationOverlay
          level={snapshot.celebrationLevel}
          caption={snapshot.celebrationCaption}
          targets={targets}
        />
      )}
    </section>
  );
}
