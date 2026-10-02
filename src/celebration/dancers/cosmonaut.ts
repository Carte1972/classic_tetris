import { fillPixelRect } from '../../scene/pixel_shapes';
import type { DancerDefinition } from './dancer_types';
import { bodyPoint, faceVisible, headPixel } from './features';

/** Colores del cosmonauta. */
const C = {
  suit: '#eef0f5',
  suitShade: '#b9bfcc',
  visor: '#26446e',
  visorShine: '#8fb6ea',
  ring: '#9aa1b3',
  glove: '#c9cdd8',
  boots: '#7d8496',
  pack: '#c9ced9',
  panel: '#5d6475',
  red: '#d94a5c',
  yellow: '#f2b134',
  blue: '#4a8adf',
} as const;

/** El cosmonauta: traje espacial blanco, escafandra con visor y mochila de soporte vital. Salta más alto (poca gravedad). */
export const COSMONAUT: DancerDefinition = {
  id: 'cosmonaut',
  name: 'EL COSMONAUTA',
  jumpScale: 1.5,
  body: {
    torso: 22,
    neck: 1,
    headRadius: 9,
    shoulderHalf: 9,
    hipHalf: 5,
    upperArm: 11,
    forearm: 10,
    thigh: 13,
    shin: 12,
  },
  outfit: {
    skin: C.glove,
    skinShade: C.suitShade,
    shirt: C.suit,
    shirtShade: C.suitShade,
    pants: C.suit,
    pantsShade: C.suitShade,
    boots: C.boots,
    armRadius: 4.4,
    legRadius: 4.6,
    waistHalf: 10,
    bootCover: 0.4,
  },
  behind: (skeleton) => ({
    shapes: [
      {
        kind: 'polygon',
        points: [
          bodyPoint(skeleton, skeleton.chest, { x: -11, y: -2 }),
          bodyPoint(skeleton, skeleton.chest, { x: 11, y: -2 }),
          bodyPoint(skeleton, skeleton.chest, { x: 10, y: 17 }),
          bodyPoint(skeleton, skeleton.chest, { x: -10, y: 17 }),
        ],
        color: C.pack,
      },
    ],
  }),
  head: (skeleton) => {
    const r = 9;
    const visible = faceVisible(skeleton);
    return {
      shapes: [
        {
          kind: 'ellipse',
          center: skeleton.head,
          rx: (r + 1) * Math.max(0.6, Math.abs(skeleton.spinScale)),
          ry: r + 1,
          color: C.suit,
          shade: C.suitShade,
        },
        ...(visible
          ? [
              {
                kind: 'ellipse' as const,
                center: bodyPoint(
                  skeleton,
                  skeleton.head,
                  { x: 0, y: 1 },
                  skeleton.lean + skeleton.headTilt,
                ),
                rx: (r - 2.5) * skeleton.spinScale,
                ry: r - 3.5,
                color: C.visor,
              },
            ]
          : []),
      ],
      details: (ctx) => {
        headPixel(ctx, skeleton, { x: -r, y: r - 1 }, r * 2 + 1, 2, C.ring);
        if (visible) {
          headPixel(ctx, skeleton, { x: -4, y: -3 }, 2, 1, C.visorShine);
          headPixel(ctx, skeleton, { x: -5, y: -2 }, 1, 2, C.visorShine);
        }
      },
    };
  },
  torso: (skeleton) => ({
    details: (ctx) => {
      if (!faceVisible(skeleton)) {
        return;
      }
      const panel = bodyPoint(skeleton, skeleton.chest, { x: -4, y: 5 });
      fillPixelRect(ctx, panel.x, panel.y, 8 * skeleton.spinScale, 6, C.panel);
      fillPixelRect(ctx, panel.x + 1, panel.y + 1, 2, 2, C.red);
      fillPixelRect(ctx, panel.x + 4, panel.y + 1, 2, 2, C.yellow);
      fillPixelRect(ctx, panel.x + 1, panel.y + 4, 5, 1, C.blue);
      const belt = bodyPoint(skeleton, skeleton.pelvis, { x: -9, y: -2 });
      fillPixelRect(ctx, belt.x, belt.y, 18 * skeleton.spinScale, 2, C.ring);
    },
  }),
};
