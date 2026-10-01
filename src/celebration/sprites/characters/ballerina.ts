import type { CharacterDefinition } from '../sprite_types';

/** Bailarina de ballet con tutú que intenta (con poco equilibrio) la prisiadka. */
export const BALLERINA: CharacterDefinition = {
  id: 'ballerina',
  colors: {
    M: '#3b2418',
    S: '#f3cfb3',
    K: '#1b1b22',
    A: '#e88aa0',
    T: '#f4a6c0',
    W: '#ffe3ef',
    t: '#e88aa0',
    R: '#f3cfb3',
    P: '#f7d6e0',
    B: '#f4a6c0',
  },
  shoulderWidth: 6,
  wobbles: true,
  head: [
    '..MMMM..',
    '..MMMM..',
    '.MMMMMM.',
    'MMSSSSMM',
    'MSKSSKSM',
    'MSASSASM',
    '.SSKKSS.',
    '..SSSS..',
    '...SS...',
  ],
  torso: [
    '....TTTTTT....',
    '....TTTTTT....',
    '....TTTTTT....',
    '....TTTTTT....',
    'WWWWWWWWWWWWWW',
    'tWtWtWtWtWtWtW',
    '.WWWWWWWWWWWW.',
  ],
};
