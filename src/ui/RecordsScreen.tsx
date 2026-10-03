import { MAX_RECORDS, UNNAMED_RECORD } from '../config/storage_config';
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
 * Pantalla con el ranking: siempre 10 posiciones; las que aún no tienen partida valen 0.
 * @param props Propiedades de la pantalla.
 * @returns La pantalla.
 */
export function RecordsScreen(props: RecordsScreenProps): React.JSX.Element {
  const positions = Array.from({ length: MAX_RECORDS }, (_, index) => props.records[index]);
  return (
    <section className="screen" aria-label={TEXTS.records.title}>
      <h2>{TEXTS.records.title}</h2>
      <table className="panel table">
        <thead>
          <tr>
            <th scope="col">{TEXTS.records.rank}</th>
            <th scope="col">{TEXTS.records.name}</th>
            <th scope="col">{TEXTS.records.score}</th>
            <th scope="col">{TEXTS.records.lines}</th>
            <th scope="col">{TEXTS.records.level}</th>
            <th scope="col">{TEXTS.records.date}</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((record, index) => (
            <tr key={index} className={record === undefined ? 'empty-record' : undefined}>
              <td className="accent">{index + 1}</td>
              <td>{record?.name ?? UNNAMED_RECORD}</td>
              <td>{record?.score ?? 0}</td>
              <td>{record?.lines ?? 0}</td>
              <td>{record?.level ?? 0}</td>
              <td>{record === undefined ? TEXTS.records.emptyDate : formatDate(record.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">{TEXTS.back}</p>
    </section>
  );
}
