import { fillPixelRect } from '../../scene/pixel_shapes';
import { headPoints } from '../puppet/puppet_renderer';
import type { DancerDefinition } from './dancer_types';
import { bodyPoint, drawEyes, faceVisible, headPixel } from './features';

/** Colores del gran maestro. */
const C = {
  skin: '#f0c39a',
  skinShade: '#d29e76',
  suit: '#3d4152',
  suitShade: '#272a36',
  shirt: '#f0ece2',
  tie: '#c23b4a',
  hair: '#3a2a20',
  shoes: '#1b1b22',
  glasses: '#202028',
  ivory: '#f6f1e2',
  ivoryShade: '#cfc6ae',
  gold: '#e8b947',
  eye: '#1b1220',
  mouth: '#9a4a3a',
} as const;

/** El gran maestro de ajedrez: traje, corbata, gafas y una pieza de rey en la mano. */
export const CHESS_MASTER: DancerDefinition = {
  id: 'chessMaster',
  name: 'EL GRAN MAESTRO',
  body: {
    torso: 23,
    neck: 3,
    headRadius: 7,
    shoulderHalf: 8,
    hipHalf: 4.5,
    upperArm: 12,
    forearm: 11,
    thigh: 14,
    shin: 14,
  },
  outfit: {
    skin: C.skin,
    skinShade: C.skinShade,
    shirt: C.suit,
    shirtShade: C.suitShade,
    pants: C.suit,
    pantsShade: C.suitShade,
    boots: C.shoes,
    armRadius: 3,
    legRadius: 3.1,
    waistHalf: 7,
    bootCover: 0.18,
  },
  head: (skeleton) => {
    const r = 7;
    return {
      shapes: [
        {
          kind: 'polygon',
          points: headPoints(skeleton, [
            { x: -r - 1, y: 0 },
            { x: -r - 1, y: -r * 0.6 },
            { x: -r * 0.4, y: -r - 1.5 },
            { x: r * 0.7, y: -r - 1 },
            { x: r + 1, y: -r * 0.4 },
            { x: r + 1, y: 0 },
            { x: r - 1, y: -r * 0.5 },
            { x: -r + 1, y: -r * 0.5 },
          ]),
          color: C.hair,
        },
      ],
      details: (ctx) => {
        if (!faceVisible(skeleton)) {
          return;
        }
        drawEyes(ctx, skeleton, { spread: 2.5, y: -0.5, color: C.eye });
        headPixel(ctx, skeleton, { x: -4.5, y: -1.5 }, 4, 3, C.glasses);
        headPixel(ctx, skeleton, { x: 0.5, y: -1.5 }, 4, 3, C.glasses);
        headPixel(ctx, skeleton, { x: -3.5, y: -0.5 }, 2, 1, C.skin);
        headPixel(ctx, skeleton, { x: 1.5, y: -0.5 }, 2, 1, C.skin);
        headPixel(ctx, skeleton, { x: -1, y: 3 }, 3, 1, C.mouth);
      },
    };
  },
  torso: (skeleton) => ({
    details: (ctx) => {
      if (!faceVisible(skeleton)) {
        return;
      }
      const collar = bodyPoint(skeleton, skeleton.chest, { x: -2, y: 0 });
      fillPixelRect(ctx, collar.x, collar.y, 5 * skeleton.spinScale, 7, C.shirt);
      const tie = bodyPoint(skeleton, skeleton.chest, { x: -0.5, y: 1 });
      fillPixelRect(ctx, tie.x, tie.y, 2, 9, C.tie);
    },
  }),
  front: (skeleton) => {
    const hand = skeleton.armRight.end;
    return {
      shapes: [
        {
          kind: 'polygon',
          points: [
            { x: hand.x - 4, y: hand.y - 2 },
            { x: hand.x + 4, y: hand.y - 2 },
            { x: hand.x + 2.5, y: hand.y - 5 },
            { x: hand.x - 2.5, y: hand.y - 5 },
          ],
          color: C.ivory,
        },
        {
          kind: 'capsule',
          from: { x: hand.x, y: hand.y - 5 },
          to: { x: hand.x, y: hand.y - 11 },
          radius: 2,
          color: C.ivory,
          shade: C.ivoryShade,
        },
        {
          kind: 'ellipse',
          center: { x: hand.x, y: hand.y - 13 },
          rx: 3.5,
          ry: 2.5,
          color: C.ivory,
          shade: C.ivoryShade,
        },
      ],
      props: (ctx) => {
        fillPixelRect(ctx, hand.x, hand.y - 19, 1, 5, C.gold);
        fillPixelRect(ctx, hand.x - 2, hand.y - 18, 5, 1, C.gold);
      },
    };
  },
};
