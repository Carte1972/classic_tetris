import type { CharacterDefinition } from '../sprite_types';

/** Babushka con pañuelo de flores, chal y delantal. */
export const BABUSHKA: CharacterDefinition = {
  id: 'babushka',
  colors: {
    H: '#d94a5c',
    A: '#f2b134',
    S: '#f0c39a',
    K: '#1b1b22',
    M: '#c9c9d6',
    T: '#6a4c93',
    W: '#e9e4d4',
    R: '#6a4c93',
    P: '#3a3550',
    B: '#1b1b22',
  },
  shoulderWidth: 8,
  head: [
    '..HHHHHH..',
    '.HHAHHAHH.',
    'HHAHHHHAHH',
    'HHMMMMMMHH',
    'HHSSSSSSHH',
    'HSKSSSSKSH',
    'HSSSSSSSSH',
    'HHSSKKSSHH',
    '.HHSSSSHH.',
    '..HH..HH..',
  ],
  torso: [
    '..TTTTTTTT..',
    '.TTTTTTTTTT.',
    '.TATTTTTTAT.',
    '.TTTTTTTTTT.',
    '.PPWWWWWWPP.',
    'PPPWWWWWWPPP',
    'PPPWWAAWWPPP',
    'PPPWWWWWWPPP',
    'PPPPPPPPPPPP',
  ],
};
