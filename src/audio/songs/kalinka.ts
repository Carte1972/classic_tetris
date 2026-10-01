import { parseTrack, type Song } from '../song';

/**
 * Estribillo de "Kalinka" (canción popular rusa de 1860, dominio público), una octava
 * por encima del original. Un paso = una semicorchea; cada compás de 2/4 son 8 pasos.
 * Empieza con la anacrusa ("Ka-") y el último compás la completa al repetirse.
 */
const MELODY = `
  A5:4 |
  G5:4 E5:2 F5:2 | G5:4 E5:2 F5:2 | G5:4 F5:2 E5:2 | D5:4 A5:2 A5:2 |
  G5:3 F5:1 E5:2 F5:2 | G5:4 E5:2 F5:2 | G5:4 F5:2 E5:2 | D5:4
`;

/** Bajo propio "um-pa" sobre Rem y La7. */
const BASS = `
  D3:2 A3:2 |
  A2:2 E3:2 A2:2 C#3:2 | A2:2 E3:2 A2:2 C#3:2 | A2:2 E3:2 A2:2 G3:2 | D3:2 A3:2 D3:2 F3:2 |
  A2:2 E3:2 A2:2 C#3:2 | A2:2 E3:2 A2:2 C#3:2 | A2:2 E3:2 A2:2 G3:2 | D3:2 A3:2
`;

/** Rasgueos propios a contratiempo, al estilo de una balalaica. */
const STRUMS = `
  -:2 F4:2 |
  -:2 G4:2 -:2 G4:2 | -:2 C#5:2 -:2 G4:2 | -:2 G4:2 -:2 C#5:2 | -:2 F4:2 -:2 A4:2 |
  -:2 G4:2 -:2 G4:2 | -:2 C#5:2 -:2 G4:2 | -:2 G4:2 -:2 C#5:2 | -:2 F4:2
`;

/**
 * Fragmento acelerado de "Kalinka" con arreglo chiptune propio del proyecto, para las
 * celebraciones de subida de nivel. A 240 negras por minuto dura 4 segundos.
 */
export const KALINKA: Song = {
  bpm: 240,
  stepsPerBeat: 4,
  tracks: [
    { waveform: 'square', volume: 0.2, notes: parseTrack(MELODY) },
    { waveform: 'square', volume: 0.08, notes: parseTrack(STRUMS) },
    { waveform: 'triangle', volume: 0.45, notes: parseTrack(BASS) },
  ],
};
