import type { CharacterDefinition } from '../sprite_types';

/** Gran maestro de ajedrez con traje, gafas y una pieza de rey en la mano. */
export const CHESS_MASTER: CharacterDefinition = {
  id: 'chessMaster',
  colors: {
    M: '#3a2a20',
    S: '#f0c39a',
    K: '#1b1b22',
    T: '#3d4152',
    W: '#e9e4d4',
    A: '#c23b4a',
    R: '#3d4152',
    P: '#3d4152',
    B: '#1b1b22',
    X: '#f4f1e6',
    Y: '#c9a227',
  },
  head: [
    '..MMMMMM..',
    '.MMMMMMMM.',
    '.MSSSSSSM.',
    'MSSSSSSSSM',
    '.SKKSSKKS.',
    '.SKKKKKKS.',
    '.SSSSSSSS.',
    '..SSKKSS..',
    '...SSSS...',
  ],
  torso: [
    'TTTWWWWTTT',
    'TTTWAAWTTT',
    'TTTTAATTTT',
    'TTTTAATTTT',
    'TTTTAATTTT',
    'TTTTTTTTTT',
    'TTTTKTTTTT',
    'TTTTTTTTTT',
  ],
  heldProp: ['..Y..', '.YYY.', '..Y..', '.XXX.', '..X..', '.XXX.', 'XXXXX', 'XXXXX'],
};
