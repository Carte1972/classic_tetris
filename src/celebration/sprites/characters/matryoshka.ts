import type { CharacterDefinition } from '../sprite_types';

/** Matrioska pequeña que sale de dentro de la grande y sigue bailando. */
export const MATRYOSHKA_SMALL: CharacterDefinition = {
  id: 'matryoshkaSmall',
  colors: {
    H: '#3a6fd1',
    S: '#f6d2b0',
    K: '#1b1b22',
    A: '#f2b134',
    Y: '#d94a5c',
    T: '#3a6fd1',
    W: '#e9f3ff',
    R: '#3a6fd1',
    P: '#3a6fd1',
    B: '#1b1b22',
  },
  shoulderWidth: 6,
  head: ['..HHHH..', '.HHHHHH.', 'HHSSSSHH', 'HSKSSKSH', 'HSASSASH', '.HSKKSH.', '..HHHH..'],
  torso: [
    'HHHHHHHH',
    'TTTWWTTT',
    'TTWAAWTT',
    'TWAYYAWT',
    'TWAYYAWT',
    'TTWAAWTT',
    'TTTWWTTT',
    '.TTTTTT.',
  ],
};

/** Matrioska que se abre a mitad del baile. */
export const MATRYOSHKA: CharacterDefinition = {
  id: 'matryoshka',
  colors: {
    H: '#d9343f',
    S: '#f6d2b0',
    K: '#1b1b22',
    A: '#e8505b',
    Y: '#f2b134',
    X: '#3fa34d',
    T: '#d9343f',
    W: '#fbe7a1',
    R: '#d9343f',
    P: '#d9343f',
    B: '#1b1b22',
  },
  shoulderWidth: 8,
  head: [
    '...HHHH...',
    '.HHHHHHHH.',
    'HHHSSSSHHH',
    'HHSKSSKSHH',
    'HHSASSASHH',
    'HHHSKKSHHH',
    '.HHHSSHHH.',
    '..HHHHHH..',
  ],
  torso: [
    'HHHHHHHHHH',
    'TTTTWWTTTT',
    'TTTWWWWTTT',
    'TTWWAAWWTT',
    'TWWAYYAWWT',
    'TWWAYYAWWT',
    'TTWWAAWWTT',
    'TTWXWWXWTT',
    'TTTWWWWTTT',
    '.TTTTTTTT.',
  ],
  opensInto: MATRYOSHKA_SMALL,
};
