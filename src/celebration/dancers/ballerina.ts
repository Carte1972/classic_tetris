import { fillPixelRect } from '../../scene/pixel_shapes';
import type { DancerDefinition } from './dancer_types';
import { bodyPoint, drawEyes, drawSmile, faceVisible, headPixel } from './features';

/** Colores de la bailarina. */
const C = {
  skin: '#f6d3b8',
  skinShade: '#e0b294',
  leotard: '#f29ab8',
  leotardShade: '#d0708f',
  tutu: '#ffe6ef',
  tutuShade: '#f2bcd0',
  tights: '#f9dbe4',
  tightsShade: '#e6bccb',
  shoes: '#f29ab8',
  hair: '#4a2c1a',
  ribbon: '#f29ab8',
  eye: '#1b1220',
  cheek: '#f08aa0',
  mouth: '#c2405a',
} as const;

/** La bailarina de ballet: tutú, moño y zapatillas de punta; intenta la prisiadka con poco equilibrio. */
export const BALLERINA: DancerDefinition = {
  id: 'ballerina',
  name: 'LA BAILARINA',
  wobbles: true,
  body: {
    torso: 21,
    neck: 4,
    headRadius: 6.5,
    shoulderHalf: 6.5,
    hipHalf: 3.5,
    upperArm: 12,
    forearm: 11,
    thigh: 15,
    shin: 15,
  },
  outfit: {
    skin: C.skin,
    skinShade: C.skinShade,
    shirt: C.leotard,
    shirtShade: C.leotardShade,
    sleeve: C.skin,
    pants: C.tights,
    pantsShade: C.tightsShade,
    boots: C.shoes,
    armRadius: 2,
    legRadius: 2.3,
    waistHalf: 4.5,
    bootCover: 0.15,
    skirt: { color: C.tutu, shade: C.tutuShade, length: 4, hemHalf: 16 },
  },
  head: (skeleton) => ({
    shapes: [
      {
        kind: 'ellipse',
        center: bodyPoint(
          skeleton,
          skeleton.head,
          { x: 0, y: -8 },
          skeleton.lean + skeleton.headTilt,
        ),
        rx: 3.5,
        ry: 3,
        color: C.hair,
      },
    ],
    details: (ctx) => {
      headPixel(ctx, skeleton, { x: -6, y: -6 }, 13, 3, C.hair);
      headPixel(ctx, skeleton, { x: -6, y: -3 }, 2, 4, C.hair);
      headPixel(ctx, skeleton, { x: 5, y: -3 }, 2, 4, C.hair);
      headPixel(ctx, skeleton, { x: -1, y: -11 }, 3, 1, C.ribbon);
      if (!faceVisible(skeleton)) {
        return;
      }
      drawEyes(ctx, skeleton, { spread: 2.5, y: -1, color: C.eye });
      headPixel(ctx, skeleton, { x: -4, y: 1 }, 2, 1, C.cheek);
      headPixel(ctx, skeleton, { x: 3, y: 1 }, 2, 1, C.cheek);
      drawSmile(ctx, skeleton, 2.5, C.mouth);
    },
  }),
  torso: (skeleton) => ({
    details: (ctx) => {
      // Capas de volantes del tutú.
      const hem = bodyPoint(skeleton, skeleton.pelvis, { x: -15, y: 3 });
      for (let i = 0; i < 8; i++) {
        fillPixelRect(ctx, hem.x + i * 4 * skeleton.spinScale, hem.y, 2, 1, C.tutuShade);
      }
    },
  }),
};
