import { TEXTS } from '../config/texts';
import type { RecordEntry } from '../storage/records_store';

/** Propiedades de la pantalla de récords. */
export interface RecordsScreenProps {
  readonly records: readonly RecordEntry[];
}

/**
 * Convierte una fecha AAAA-MM-DD en DD/MM/AAAA.
 * @param isoDate Fecha en formato ISO corto.
 * @returns Fecha en formato español.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day ?? ''}/${month ?? ''}/${year ?? ''}`;
}

/**
 * Pantalla con el top 10 de partidas.
 * @param props Propiedades de la pantalla.
 * @returns La pantalla.
 */
export function RecordsScreen(props: RecordsScreenProps): React.JSX.Element {
  const { records } = props;
  return (
    <section className="screen" aria-label={TEXTS.records.title}>
      <h2>{TEXTS.records.title}</h2>
      {records.length === 0 ? (
        <p className="panel">{TEXTS.records.empty}</p>
      ) : (
        <table className="panel table">
          <thead>
            <tr>
              <th scope="col">{TEXTS.records.rank}</th>
              <th scope="col">{TEXTS.records.score}</th>
              <th scope="col">{TEXTS.records.lines}</th>
              <th scope="col">{TEXTS.records.level}</th>
              <th scope="col">{TEXTS.records.date}</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={`${index}-${record.score}-${record.date}`}>
                <td className="accent">{index + 1}</td>
                <td>{record.score}</td>
                <td>{record.lines}</td>
                <td>{record.level}</td>
                <td>{formatDate(record.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="hint">{TEXTS.back}</p>
    </section>
  );
}
