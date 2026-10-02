import { fillPixelRect } from '../../scene/pixel_shapes';
import { headPoints } from '../puppet/puppet_renderer';
import type { DancerDefinition } from './dancer_types';
import { bodyPoint, drawEyes, faceVisible, headPixel } from './features';

/** Colores de Rasputín. */
const C = {
  skin: '#e9c09c',
  skinShade: '#c99b76',
  robe: '#1e1a24',
  robeShade: '#110e15',
  belt: '#8a6a3a',
  pants: '#2a2530',
  pantsShade: '#1a161e',
  boots: '#120e10',
  hair: '#2e1d14',
  hairLight: '#4a3020',
  eyeWhite: '#f2ecdc',
  eye: '#0e0a10',
  gold: '#e8b947',
} as const;

/** Rasputín (caricatura): melena y barba enormes, mirada intensa, sotana negra y cruz dorada. */
export const RASPUTIN: DancerDefinition = {
  id: 'rasputin',
  name: 'RASPUTÍN',
  body: {
    torso: 24,
    neck: 2,
    headRadius: 7,
    shoulderHalf: 8.5,
    hipHalf: 4.5,
    upperArm: 13,
    forearm: 12,
    thigh: 14,
    shin: 14,
  },
  outfit: {
    skin: C.skin,
    skinShade: C.skinShade,
    shirt: C.robe,
    shirtShade: C.robeShade,
    pants: C.pants,
    pantsShade: C.pantsShade,
    boots: C.boots,
    armRadius: 3.4,
    legRadius: 3.2,
    waistHalf: 8,
    bootCover: 0.7,
    skirt: { color: C.robe, shade: C.robeShade, length: 22, hemHalf: 12 },
  },
  behind: (skeleton) => ({
    shapes: [
      // Melena larga que cae hasta los hombros.
      {
        kind: 'polygon',
        points: headPoints(skeleton, [
          { x: -9, y: 10 },
          { x: -9.5, y: -3 },
          { x: -6, y: -9.5 },
          { x: 6, y: -9.5 },
          { x: 9.5, y: -3 },
          { x: 9, y: 10 },
        ]),
        color: C.hair,
      },
    ],
  }),
  head: (skeleton) => ({
    shapes: [
      // Barba enorme hasta el pecho.
      {
        kind: 'polygon',
        points: headPoints(skeleton, [
          { x: -6.5, y: 1 },
          { x: 6.5, y: 1 },
          { x: 5, y: 10 },
          { x: 1.5, y: 17 },
          { x: -1.5, y: 17 },
          { x: -5, y: 10 },
        ]),
        color: C.hair,
      },
      {
        kind: 'polygon',
        points: headPoints(skeleton, [
          { x: -7, y: -3 },
          { x: -5, y: -8 },
          { x: 5, y: -8 },
          { x: 7, y: -3 },
          { x: 2, y: -5.5 },
          { x: -2, y: -5.5 },
        ]),
        color: C.hair,
      },
    ],
    details: (ctx) => {
      headPixel(ctx, skeleton, { x: -3, y: 6 }, 1, 6, C.hairLight);
      headPixel(ctx, skeleton, { x: 2, y: 5 }, 1, 7, C.hairLight);
      if (!faceVisible(skeleton)) {
        return;
      }
      // Mirada intensa: ojos grandes, cejas pobladas y fruncidas.
      drawEyes(ctx, skeleton, { spread: 2.8, y: -1.5, color: C.eye, white: C.eyeWhite });
      headPixel(ctx, skeleton, { x: -5, y: -4 }, 4, 1, C.hair);
      headPixel(ctx, skeleton, { x: 1, y: -4 }, 4, 1, C.hair);
      headPixel(ctx, skeleton, { x: -2, y: -3 }, 1, 1, C.hair);
      headPixel(ctx, skeleton, { x: 1, y: -3 }, 1, 1, C.hair);
    },
  }),
  torso: (skeleton) => ({
    details: (ctx) => {
      const belt = bodyPoint(skeleton, skeleton.pelvis, { x: -8, y: -2 });
      fillPixelRect(ctx, belt.x, belt.y, 16 * skeleton.spinScale, 2, C.belt);
      if (!faceVisible(skeleton)) {
        return;
      }
      const cross = bodyPoint(skeleton, skeleton.chest, { x: 0, y: 10 });
      fillPixelRect(ctx, cross.x, cross.y, 1, 6, C.gold);
      fillPixelRect(ctx, cross.x - 2, cross.y + 2, 5, 1, C.gold);
    },
  }),
};
