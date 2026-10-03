import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { MAX_NAME_LENGTH } from '../config/storage_config';
import { TEXTS } from '../config/texts';

/** Propiedades del formulario del nombre. */
export interface NameEntryProps {
  /** Posición obtenida en el ranking (0 = la mejor). */
  readonly rank: number;
  /** Puntuación de la partida. */
  readonly score: number;
  /** Guarda el récord con el nombre escrito. */
  readonly onSubmit: (name: string) => void;
}

/**
 * Capa sobre el pozo que pide el nombre al entrar en el ranking. El campo de texto recibe
 * el foco al aparecer y se acepta con ENTER; mientras tanto el teclado del juego no actúa.
 * @param props Propiedades del formulario.
 * @returns La capa.
 */
export function NameEntry(props: NameEntryProps): React.JSX.Element {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setName(event.target.value);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    props.onSubmit(name);
  };
  return (
    <div className="overlay" role="dialog" aria-label={TEXTS.nameEntry.title}>
      <h2 className="accent">{TEXTS.nameEntry.title}</h2>
      <p>
        {TEXTS.nameEntry.position(props.rank + 1)}
        <br />
        {TEXTS.nameEntry.points(props.score)}
      </p>
      <form className="name-form" onSubmit={handleSubmit}>
        <label htmlFor="record-name" className="hint">
          {TEXTS.nameEntry.label}
        </label>
        <input
          id="record-name"
          ref={inputRef}
          className="name-input"
          type="text"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="off"
          spellCheck={false}
          onChange={handleChange}
        />
      </form>
      <p className="hint">{TEXTS.nameEntry.hint}</p>
    </div>
  );
}
