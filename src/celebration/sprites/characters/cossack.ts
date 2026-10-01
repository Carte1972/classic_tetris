import type { CharacterDefinition } from '../sprite_types';

/** Cosaco bigotudo con gorro de astracán, chaqueta con cartucheras y botas rojas. */
export const COSSACK: CharacterDefinition = {
  id: 'cossack',
  colors: {
    H: '#2a2a33',
    h: '#5a5a6e',
    S: '#f0c39a',
    K: '#1b1b22',
    M: '#5a3418',
    T: '#2c4f8a',
    t: '#c9a227',
    A: '#e9e4d4',
    R: '#2c4f8a',
    P: '#1e2a44',
    B: '#d23a3a',
  },
  head: [
    '.HhHHhHHh.',
    'HHHHHHHHHH',
    'HhHHhHHhHH',
    'HHHHHHHHHH',
    '.SSSSSSSS.',
    '.SKSSSSKS.',
    '.SSSSSSSS.',
    'MMMMSSMMMM',
    'M.SMMMMS.M',
    '..SSSSSS..',
  ],
  torso: [
    'TTTTTTTTTT',
    'TATATTATAT',
    'TATATTATAT',
    'TTTTTTTTTT',
    'tttttttttt',
    'TTTTTTTTTT',
    'TTTTTTTTTT',
    'TTTTTTTTTT',
  ],
};
