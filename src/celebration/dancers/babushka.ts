import { fillPixelRect } from '../../scene/pixel_shapes';
import { headPoints } from '../puppet/puppet_renderer';
import type { DancerDefinition } from './dancer_types';
import { bodyPoint, drawEyes, drawSmile, faceVisible, headPixel } from './features';

/** Colores de la babushka. */
const C = {
  skin: '#f0c7a6',
  skinShade: '#d6a682',
  scarf: '#d93b4a',
  scarfShade: '#a82634',
  flower: '#f5c542',
  flowerLeaf: '#2f8a46',
  shawl: '#6a4c93',
  shawlShade: '#4c3470',
  skirt: '#3a3550',
  skirtShade: '#28243a',
  apron: '#efe6d2',
  apronLine: '#d93b4a',
  boots: '#5b5b66',
  hair: '#d6d6e0',
  eye: '#1b1220',
  mouth: '#a8404a',
  glasses: '#3a3a44',
} as const;

/** La babushka: pañuelo de flores anudado bajo la barbilla, chal, falda larga y delantal. */
export const BABUSHKA: DancerDefinition = {
  id: 'babushka',
  name: 'LA BABUSHKA',
  body: {
    torso: 21,
    neck: 2,
    headRadius: 7,
    shoulderHalf: 8,
    hipHalf: 4,
    upperArm: 11,
    forearm: 10,
    thigh: 13,
    shin: 12,
  },
  outfit: {
    skin: C.skin,
    skinShade: C.skinShade,
    shirt: C.shawl,
    shirtShade: C.shawlShade,
    pants: C.skirt,
    pantsShade: C.skirtShade,
    boots: C.boots,
    armRadius: 3,
    legRadius: 2.8,
    waistHalf: 9,
    bootCover: 0.55,
    skirt: { color: C.skirt, shade: C.skirtShade, length: 18, hemHalf: 13 },
  },
  head: (skeleton) => {
    const r = 7;
    return {
      shapes: [
        {
          kind: 'polygon',
          points: headPoints(skeleton, [
            { x: -r - 1.5, y: r * 0.7 },
            { x: -r - 1.5, y: -r * 0.4 },
            { x: -r * 0.6, y: -r - 1.5 },
            { x: r * 0.6, y: -r - 1.5 },
            { x: r + 1.5, y: -r * 0.4 },
            { x: r + 1.5, y: r * 0.7 },
            { x: 2, y: r + 3 },
            { x: -2, y: r + 3 },
          ]),
          color: C.scarf,
        },
        {
          kind: 'ellipse',
          center: skeleton.head,
          rx: (r - 2) * Math.max(0.55, Math.abs(skeleton.spinScale)),
          ry: r - 1.5,
          color: C.skin,
          shade: C.skinShade,
        },
      ],
      details: (ctx) => {
        for (const [x, y] of [
          [-6, -4],
          [-2, -7],
          [3, -6],
          [6, -2],
          [-7, 2],
          [6, 3],
        ] as const) {
          headPixel(ctx, skeleton, { x, y }, 2, 2, C.flower);
          headPixel(ctx, skeleton, { x: x + 1, y: y + 2 }, 1, 1, C.flowerLeaf);
        }
        if (!faceVisible(skeleton)) {
          return;
        }
        headPixel(ctx, skeleton, { x: -4, y: -4 }, 8, 1, C.hair);
        drawEyes(ctx, skeleton, { spread: 2.5, y: -1, color: C.eye });
        headPixel(ctx, skeleton, { x: -4, y: -2 }, 3, 1, C.glasses);
        headPixel(ctx, skeleton, { x: 1, y: -2 }, 3, 1, C.glasses);
        drawSmile(ctx, skeleton, 2.5, C.mouth);
        headPixel(ctx, skeleton, { x: -1, y: r + 1 }, 2, 2, C.scarfShade);
      },
    };
  },
  torso: (skeleton) => ({
    details: (ctx) => {
      if (!faceVisible(skeleton)) {
        return;
      }
      const top = bodyPoint(skeleton, skeleton.pelvis, { x: -5, y: -2 });
      const width = 10 * skeleton.spinScale;
      fillPixelRect(ctx, top.x, top.y, width, 16, C.apron);
      fillPixelRect(ctx, top.x, top.y + 13, width, 1, C.apronLine);
      fillPixelRect(ctx, top.x, top.y + 10, width, 1, C.apronLine);
    },
  }),
};
