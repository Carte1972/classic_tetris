import type { CharacterDefinition } from '../sprite_types';

/** Cosmonauta con escafandra y traje espacial. */
export const COSMONAUT: CharacterDefinition = {
  id: 'cosmonaut',
  colors: {
    W: '#eef0f5',
    A: '#2b4c7e',
    h: '#8fb3e8',
    K: '#5d6475',
    X: '#d94a5c',
    Y: '#f2b134',
    T: '#eef0f5',
    t: '#9aa1b3',
    R: '#eef0f5',
    S: '#c9cdd8',
    P: '#eef0f5',
    B: '#7d8496',
  },
  head: [
    '...WWWWWW...',
    '.WWWWWWWWWW.',
    'WWWAAAAAAWWW',
    'WWAhAAAAAAWW',
    'WWAAhAAAAAWW',
    'WWAAAAAAAAWW',
    'WWWAAAAAAWWW',
    '.WWWWWWWWWW.',
    '..KWWWWWWK..',
    '...KKKKKK...',
  ],
  torso: [
    'WWWWWWWWWWWW',
    'WWWWWWWWWWWW',
    'WWWKKKKKKWWW',
    'WWWKXKYKKWWW',
    'WWWKKKKKKWWW',
    'WWWWWWWWWWWW',
    'tttttttttttt',
    'WWWWWWWWWWWW',
  ],
};
