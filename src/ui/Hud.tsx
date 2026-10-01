import { TEXTS } from '../config/texts';
import type { HudData } from '../app/app_controller';

/** Propiedades del marcador. */
export interface HudProps {
  readonly hud: HudData;
  readonly muted: boolean;
}

/**
 * Marcador de la partida: puntuación, récord, líneas y nivel.
 * @param props Propiedades del marcador.
 * @returns El marcador.
 */
export function Hud(props: HudProps): React.JSX.Element {
  const { hud, muted } = props;
  const stats: readonly [string, number, string][] = [
    [TEXTS.hud.score, hud.score, 'score'],
    [TEXTS.hud.best, hud.best, 'best'],
    [TEXTS.hud.lines, hud.lines, 'lines'],
    [TEXTS.hud.level, hud.level, 'level'],
  ];
  return (
    <dl className="panel hud">
      {stats.map(([label, value, id]) => (
        <div key={id} className="stat">
          <dt>{label}</dt>
          <dd data-testid={`hud-${id}`}>{value}</dd>
        </div>
      ))}
      {muted && <p className="muted">{TEXTS.hud.muted}</p>}
    </dl>
  );
}
