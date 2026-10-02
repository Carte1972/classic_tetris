import { TEXTS } from '../config/texts';
import type { HudData } from '../app/app_controller';

/** Propiedades del marcador. */
export interface HudProps {
  readonly hud: HudData;
  readonly muted: boolean;
}

/**
 * Marcador de la partida: puntuación, récord, nivel, objetivo del nivel y líneas totales.
 * @param props Propiedades del marcador.
 * @returns El marcador.
 */
export function Hud(props: HudProps): React.JSX.Element {
  const { hud, muted } = props;
  const stats: readonly [string, string, string][] = [
    [TEXTS.hud.score, String(hud.score), 'score'],
    [TEXTS.hud.best, String(hud.best), 'best'],
    [TEXTS.hud.level, String(hud.level), 'level'],
    [TEXTS.hud.goal, `${hud.levelLines} / ${hud.levelGoal}`, 'goal'],
    [TEXTS.hud.lines, String(hud.lines), 'lines'],
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
