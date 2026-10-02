import { fillPixelRect, mixColors } from '../../scene/pixel_shapes';
import { headPoints, rotateAround } from '../puppet/puppet_renderer';
import type { DancerDefinition } from './dancer_types';

/** Colores del cosaco. */
const C = {
  skin: '#f0c39a',
  skinShade: '#d39c74',
  coat: '#2c4f8a',
  coatShade: '#1d3766',
  gazyri: '#efe6d2',
  belt: '#c9a227',
  pants: '#1d2436',
  pantsShade: '#121725',
  boots: '#cf2f2f',
  hat: '#2a2a33',
  hatLight: '#55556a',
  mustache: '#4e2c16',
  eye: '#1b1220',
  dagger: '#b8b8c8',
} as const;

/**
 * El cosaco: papaja de astracán, gran bigote, cherkeska azul con cartucheras blancas,
 * cinturón dorado con daga y botas rojas.
 */
export const COSSACK: DancerDefinition = {
  id: 'cossack',
  name: 'EL COSACO',
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
    shirt: C.coat,
    shirtShade: C.coatShade,
    pants: C.pants,
    pantsShade: C.pantsShade,
    boots: C.boots,
    armRadius: 3,
    legRadius: 3.2,
    waistHalf: 7,
    bootCover: 0.75,
    skirt: { color: C.coat, shade: C.coatShade, length: 9, hemHalf: 9 },
  },
  head: (skeleton) => {
    const r = 7;
    const front = skeleton.spinScale > 0.2;
    return {
      shapes: [
        // Papaja: gorro alto de piel, un poco más ancho arriba.
        {
          kind: 'polygon',
          points: headPoints(skeleton, [
            { x: -r - 1, y: -r * 0.35 },
            { x: -r - 2, y: -r * 1.9 },
            { x: r + 2, y: -r * 1.9 },
            { x: r + 1, y: -r * 0.35 },
          ]),
          color: C.hat,
        },
      ],
      details: (ctx) => {
        // Textura rizada del astracán.
        for (let i = 0; i < 9; i++) {
          const p = rotateAround(
            {
              x: -r + (i % 5) * 3.5 + (Math.floor(i / 5) % 2) * 1.5,
              y: -r * 1.75 + Math.floor(i / 5) * 4,
            },
            skeleton.head,
            skeleton.lean + skeleton.headTilt,
            skeleton.spinScale,
          );
          fillPixelRect(ctx, p.x, p.y, 2, 1, C.hatLight);
        }
        if (!front) {
          return;
        }
        const [eyeL, eyeR, mustacheL, mustacheC, mustacheR, browL, browR] = headPoints(skeleton, [
          { x: -2.5, y: -0.5 },
          { x: 2.5, y: -0.5 },
          { x: -4.5, y: 3.2 },
          { x: 0, y: 2.6 },
          { x: 4.5, y: 3.2 },
          { x: -3.5, y: -2.5 },
          { x: 3.5, y: -2.5 },
        ]);
        if (!eyeL || !eyeR || !mustacheL || !mustacheC || !mustacheR || !browL || !browR) {
          return;
        }
        fillPixelRect(ctx, eyeL.x, eyeL.y, 1, 2, C.eye);
        fillPixelRect(ctx, eyeR.x, eyeR.y, 1, 2, C.eye);
        fillPixelRect(ctx, browL.x - 1, browL.y, 3, 1, C.mustache);
        fillPixelRect(ctx, browR.x - 1, browR.y, 3, 1, C.mustache);
        // Bigote poblado con las puntas hacia abajo.
        fillPixelRect(ctx, mustacheC.x - 4, mustacheC.y, 9, 2, C.mustache);
        fillPixelRect(ctx, mustacheL.x - 1, mustacheL.y, 2, 3, C.mustache);
        fillPixelRect(ctx, mustacheR.x, mustacheR.y, 2, 3, C.mustache);
        fillPixelRect(
          ctx,
          mustacheC.x - 1,
          mustacheC.y + 3,
          3,
          1,
          mixColors(C.skin, '#a0503a', 0.6),
        );
      },
    };
  },
  torso: (skeleton) => ({
    details: (ctx) => {
      if (skeleton.spinScale <= 0.2) {
        return;
      }
      // Cartucheras (gazyri) en el pecho y cinturón dorado con daga.
      for (const side of [-1, 1] as const) {
        for (let i = 0; i < 4; i++) {
          const p = rotateAround(
            { x: side * 4.5, y: 4 + i * 2.5 },
            skeleton.chest,
            skeleton.lean,
            skeleton.spinScale,
          );
          fillPixelRect(ctx, p.x - 1, p.y, 3, 1, C.gazyri);
        }
      }
      const belt = rotateAround(
        { x: -7, y: -1 },
        skeleton.pelvis,
        skeleton.lean,
        skeleton.spinScale,
      );
      fillPixelRect(ctx, belt.x, belt.y, 15 * Math.abs(skeleton.spinScale), 2, C.belt);
      const dagger = rotateAround(
        { x: 1, y: 1 },
        skeleton.pelvis,
        skeleton.lean,
        skeleton.spinScale,
      );
      fillPixelRect(ctx, dagger.x, dagger.y, 2, 6, C.dagger);
    },
  }),
};
