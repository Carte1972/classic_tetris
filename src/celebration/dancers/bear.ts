import { fillPixelRect } from '../../scene/pixel_shapes';
import { along, headPoints } from '../puppet/puppet_renderer';
import type { DancerDefinition } from './dancer_types';
import { bodyPoint, drawEyes, faceVisible, headPixel } from './features';

/** Colores del oso. */
const C = {
  fur: '#8a5a32',
  furShade: '#64401f',
  belly: '#d2a878',
  muzzle: '#dcb38a',
  nose: '#2a1712',
  hat: '#6b6f7d',
  hatShade: '#4d505c',
  hatBand: '#8d93a3',
  wood: '#d48a3a',
  woodDark: '#8c5420',
  string: '#f2e6c8',
  eye: '#1b1220',
} as const;

/** El oso pardo: robusto, con ushanka de orejeras y una balalaika colgada al pecho. */
export const BEAR: DancerDefinition = {
  id: 'bear',
  name: 'EL OSO PARDO',
  body: {
    torso: 24,
    neck: 1,
    headRadius: 9,
    shoulderHalf: 10,
    hipHalf: 6,
    upperArm: 12,
    forearm: 10,
    thigh: 12,
    shin: 11,
  },
  outfit: {
    skin: C.fur,
    skinShade: C.furShade,
    shirt: C.fur,
    shirtShade: C.furShade,
    pants: C.fur,
    pantsShade: C.furShade,
    boots: C.furShade,
    armRadius: 5,
    legRadius: 5.2,
    waistHalf: 12,
    bootCover: 0.35,
  },
  head: (skeleton) => {
    const r = 9;
    const muzzle = bodyPoint(
      skeleton,
      skeleton.head,
      { x: 0, y: 3.5 },
      skeleton.lean + skeleton.headTilt,
    );
    return {
      shapes: [
        // Ushanka con orejeras caídas.
        {
          kind: 'polygon',
          points: headPoints(skeleton, [
            { x: -r - 2, y: 5 },
            { x: -r - 2, y: -r * 0.4 },
            { x: -r * 0.7, y: -r - 3 },
            { x: r * 0.7, y: -r - 3 },
            { x: r + 2, y: -r * 0.4 },
            { x: r + 2, y: 5 },
            { x: r - 1, y: 5 },
            { x: r - 1, y: -r * 0.3 },
            { x: -r + 1, y: -r * 0.3 },
            { x: -r + 1, y: 5 },
          ]),
          color: C.hat,
        },
        {
          kind: 'ellipse',
          center: muzzle,
          rx: 4.5 * Math.max(0.5, Math.abs(skeleton.spinScale)),
          ry: 3.2,
          color: C.muzzle,
        },
      ],
      details: (ctx) => {
        headPixel(ctx, skeleton, { x: -r, y: -r * 0.55 }, r * 2 + 1, 2, C.hatBand);
        if (!faceVisible(skeleton)) {
          return;
        }
        drawEyes(ctx, skeleton, { spread: 3.5, y: -1.5, color: C.eye });
        headPixel(ctx, skeleton, { x: -1.5, y: 2 }, 4, 2, C.nose);
        headPixel(ctx, skeleton, { x: -1, y: 5 }, 3, 1, C.nose);
      },
    };
  },
  torso: (skeleton) => {
    const belly = bodyPoint(skeleton, skeleton.pelvis, { x: 0, y: -10 });
    const neck = bodyPoint(skeleton, skeleton.chest, { x: 7, y: -4 });
    const body = bodyPoint(skeleton, skeleton.pelvis, { x: -5, y: -6 });
    return {
      shapes: [
        {
          kind: 'ellipse',
          center: belly,
          rx: 8 * Math.max(0.5, Math.abs(skeleton.spinScale)),
          ry: 10,
          color: C.belly,
        },
        // Balalaika: mástil en diagonal y caja triangular.
        { kind: 'capsule', from: along(body, neck, 0.3), to: neck, radius: 1.2, color: C.woodDark },
        {
          kind: 'polygon',
          points: [
            { x: body.x - 6, y: body.y + 5 },
            { x: body.x + 6, y: body.y + 5 },
            { x: along(body, neck, 0.35).x, y: along(body, neck, 0.35).y },
          ],
          color: C.wood,
        },
      ],
      details: (ctx) => {
        fillPixelRect(ctx, body.x - 1, body.y + 1, 2, 2, C.woodDark);
        const top = along(body, neck, 0.9);
        fillPixelRect(ctx, top.x - 1, top.y - 1, 3, 2, C.string);
      },
    };
  },
};
