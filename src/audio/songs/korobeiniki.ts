import { parseTrack, type Song } from '../song';

/**
 * Melodía de "Korobeiniki" (canción popular rusa del siglo XIX, dominio público).
 * Un paso = una corchea; cada compás de 4/4 son 8 pasos.
 */
const MELODY = `
  E5:2 B4:1 C5:1 D5:2 C5:1 B4:1 | A4:2 A4:1 C5:1 E5:2 D5:1 C5:1 |
  B4:3 C5:1 D5:2 E5:2 | C5:2 A4:2 A4:2 -:2 |
  -:1 D5:2 F5:1 A5:2 G5:1 F5:1 | E5:3 C5:1 E5:2 D5:1 C5:1 |
  B4:2 B4:1 C5:1 D5:2 E5:2 | C5:2 A4:2 A4:2 -:2 |
`;

/** Segunda voz propia, en terceras y sextas por debajo de la melodía. */
const HARMONY = `
  G#4:2 G#4:1 A4:1 B4:2 A4:1 G#4:1 | E4:2 E4:1 A4:1 C5:2 B4:1 A4:1 |
  G#4:3 A4:1 B4:2 B4:2 | A4:2 E4:2 E4:2 -:2 |
  -:1 A4:2 D5:1 F5:2 E5:1 D5:1 | C5:3 A4:1 C5:2 B4:1 A4:1 |
  G#4:2 G#4:1 A4:1 B4:2 B4:2 | A4:2 E4:2 E4:2 -:2 |
`;

/** Bajo propio: arpegios raíz-quinta-octava sobre Mi, Lam, Rem y Do. */
const BASS_FIRST_PASS = `
  E2:1 B2:1 E3:1 B2:1 E2:1 B2:1 E3:1 B2:1 | A2:1 E3:1 A3:1 E3:1 A2:1 E3:1 A3:1 E3:1 |
  E2:1 B2:1 E3:1 B2:1 E2:1 B2:1 E3:1 B2:1 | A2:1 E3:1 A3:1 E3:1 A2:2 A2:2 |
  D3:1 A3:1 D4:1 A3:1 D3:1 A3:1 D4:1 A3:1 | C3:1 G3:1 C4:1 G3:1 C3:1 G3:1 C4:1 G3:1 |
  E2:1 B2:1 E3:1 B2:1 E2:1 B2:1 E3:1 B2:1 | A2:1 E3:1 A3:1 E3:1 A2:2 A2:2 |
`;

/** Segunda vuelta del bajo, con un paso de enlace hacia el inicio del bucle. */
const BASS_SECOND_PASS = `
  E2:1 B2:1 E3:1 B2:1 E2:1 B2:1 E3:1 B2:1 | A2:1 E3:1 A3:1 E3:1 A2:1 E3:1 A3:1 E3:1 |
  E2:1 B2:1 E3:1 B2:1 E2:1 B2:1 E3:1 B2:1 | A2:1 E3:1 A3:1 E3:1 A2:2 A2:2 |
  D3:1 A3:1 D4:1 A3:1 D3:1 A3:1 D4:1 A3:1 | C3:1 G3:1 C4:1 G3:1 C3:1 G3:1 C4:1 G3:1 |
  E2:1 B2:1 E3:1 B2:1 E2:1 B2:1 E3:1 B2:1 | A2:2 E3:2 A2:2 G#2:1 B2:1 |
`;

/** Silencio de 8 compases para la segunda voz durante la primera vuelta. */
const EIGHT_BARS_REST = '-:64';

/**
 * "Korobeiniki" con arreglo chiptune propio del proyecto: primera vuelta con la
 * melodía sola y segunda vuelta con segunda voz, sobre un bajo de onda triangular.
 */
export const KOROBEINIKI: Song = {
  bpm: 144,
  stepsPerBeat: 2,
  tracks: [
    { waveform: 'square', volume: 0.2, notes: parseTrack(MELODY + MELODY) },
    { waveform: 'square', volume: 0.1, notes: parseTrack(EIGHT_BARS_REST + HARMONY) },
    {
      waveform: 'triangle',
      volume: 0.45,
      notes: parseTrack(BASS_FIRST_PASS + BASS_SECOND_PASS),
    },
  ],
};
