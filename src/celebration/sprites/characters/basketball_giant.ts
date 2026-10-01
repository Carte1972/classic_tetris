import type { CharacterDefinition } from '../sprite_types';

/**
 * Gigante del baloncesto: personaje inventado, un pívot mucho más alto que los demás,
 * con un gran bigote y camiseta roja de tirantes con un número genérico. Bota un balón
 * durante la prisiadka y hace un mate en el salto final.
 */
export const BASKETBALL_GIANT: CharacterDefinition = {
  id: 'basketballGiant',
  colors: {
    M: '#2b1c12',
    S: '#e8b48a',
    K: '#1b1b22',
    T: '#d23a3a',
    A: '#f4f1e6',
    t: '#f4f1e6',
    R: '#e8b48a',
    P: '#e8b48a',
    B: '#f4f1e6',
    X: '#e8792b',
    Y: '#5a2a10',
  },
  shoulderWidth: 8,
  legStretch: 5,
  head: [
    '..MMMMMM..',
    '.MMMMMMMM.',
    '.MSSSSSSM.',
    '.SSSSSSSS.',
    '.SKSSSSKS.',
    '.SSSSSSSS.',
    'MMMMSSMMMM',
    'MMMMMMMMMM',
    '.SSMMMMSS.',
    '..SSSSSS..',
    '....SS....',
  ],
  torso: [
    '.TTSSSSTT.',
    '.TTTSSTTT.',
    '.TTTTTTTT.',
    '.TTAAAATT.',
    '.TTTTTATT.',
    '.TTTAAATT.',
    '.TTTTTATT.',
    '.TTAAAATT.',
    '.TTTTTTTT.',
    '.TTTTTTTT.',
    '.tttttttt.',
    '.TTTTTTTT.',
    '.TTTTTTTT.',
    '.TTT..TTT.',
  ],
  ball: ['.XXXX.', 'XXXYXX', 'XYYYYX', 'XXXYXX', '.XXXX.'],
};
