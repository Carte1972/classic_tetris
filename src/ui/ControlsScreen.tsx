import { TEXTS } from '../config/texts';

/**
 * Pantalla con la tabla de teclas.
 * @returns La pantalla.
 */
export function ControlsScreen(): React.JSX.Element {
  return (
    <section className="screen" aria-label={TEXTS.controls.title}>
      <h2>{TEXTS.controls.title}</h2>
      <table className="panel table">
        <tbody>
          {TEXTS.controls.rows.map(([keys, action]) => (
            <tr key={action}>
              <th scope="row" className="accent">
                {keys}
              </th>
              <td>{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">{TEXTS.back}</p>
    </section>
  );
}
