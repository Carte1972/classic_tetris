import { fillEllipse, fillPixelRect } from '../../scene/pixel_shapes';
import { headPoints } from '../puppet/puppet_renderer';
import type { Skeleton } from '../puppet/skeleton';
import type { DancerDefinition, DancerParts } from './dancer_types';
import { bodyPoint, drawEyes, drawSmile, faceVisible, headPixel } from './features';

/** Colores de una matrioska. */
interface DollColors {
  readonly body: string;
  readonly bodyShade: string;
  readonly scarf: string;
  readonly apron: string;
  readonly flower: string;
  readonly flowerCenter: string;
  readonly leaf: string;
}

/** Colores comunes de la cara. */
const FACE = {
  skin: '#f8d8bc',
  skinShade: '#e2b898',
  cheek: '#ec6a72',
  eye: '#1b1220',
  mouth: '#c2283a',
  hair: '#5a3418',
} as const;

/**
 * Pañuelo que envuelve la cabeza dejando ver la cara.
 * @param skeleton Esqueleto.
 * @param r Radio de la cabeza.
 * @param colors Colores de la muñeca.
 * @returns Partes del pañuelo y la cara.
 */
function dollHead(skeleton: Skeleton, r: number, colors: DollColors): DancerParts {
  return {
    shapes: [
      {
        kind: 'polygon',
        points: headPoints(skeleton, [
          { x: -r - 2, y: r + 2 },
          { x: -r - 1.5, y: -r * 0.6 },
          { x: -r * 0.6, y: -r - 1.5 },
          { x: r * 0.6, y: -r - 1.5 },
          { x: r + 1.5, y: -r * 0.6 },
          { x: r + 2, y: r + 2 },
        ]),
        color: colors.scarf,
      },
      {
        kind: 'ellipse',
        center: skeleton.head,
        rx: (r - 1.5) * Math.max(0.55, Math.abs(skeleton.spinScale)),
        ry: r - 1,
        color: FACE.skin,
        shade: FACE.skinShade,
      },
    ],
    details: (ctx) => {
      if (!faceVisible(skeleton)) {
        return;
      }
      headPixel(ctx, skeleton, { x: -r + 2, y: -r + 2 }, r * 2 - 3, 2, FACE.hair);
      drawEyes(ctx, skeleton, { spread: 2.5, y: -1, color: FACE.eye });
      headPixel(ctx, skeleton, { x: -4.5, y: 1.5 }, 2, 2, FACE.cheek);
      headPixel(ctx, skeleton, { x: 3.5, y: 1.5 }, 2, 2, FACE.cheek);
      drawSmile(ctx, skeleton, 3, FACE.mouth);
      for (let i = 0; i < 5; i++) {
        headPixel(ctx, skeleton, { x: -r + 1 + i * 3, y: r + 1 }, 1, 1, colors.flower);
      }
    },
  };
}

/**
 * Delantal con un ramo de flores pintado.
 * @param skeleton Esqueleto.
 * @param colors Colores de la muñeca.
 * @returns Partes del delantal.
 */
function dollApron(skeleton: Skeleton, colors: DollColors): DancerParts {
  return {
    details: (ctx) => {
      if (!faceVisible(skeleton)) {
        return;
      }
      const center = bodyPoint(skeleton, skeleton.pelvis, { x: 0, y: -3 });
      fillEllipse(ctx, center.x, center.y, 6 * skeleton.spinScale, 8, colors.apron);
      fillEllipse(ctx, center.x, center.y - 1, 2.5 * skeleton.spinScale, 2.5, colors.flower);
      fillPixelRect(ctx, center.x, center.y - 2, 1, 1, colors.flowerCenter);
      fillEllipse(ctx, center.x - 3 * skeleton.spinScale, center.y + 3, 1.5, 1.5, colors.flower);
      fillEllipse(ctx, center.x + 3 * skeleton.spinScale, center.y + 3, 1.5, 1.5, colors.flower);
      fillPixelRect(ctx, center.x - 1, center.y + 2, 1, 4, colors.leaf);
    },
  };
}

/**
 * Crea una matrioska con sus colores y tamaño.
 * @param id Identificador.
 * @param scale Escala respecto a la grande.
 * @param colors Colores.
 * @returns La definición de la muñeca.
 */
function createDoll(id: string, scale: number, colors: DollColors): DancerDefinition {
  const r = Math.round(9 * scale);
  return {
    id,
    name: 'LA MATRIOSKA',
    body: {
      torso: 20 * scale,
      neck: 1,
      headRadius: r,
      shoulderHalf: 7 * scale,
      hipHalf: 3 * scale,
      upperArm: 9 * scale,
      forearm: 8 * scale,
      thigh: 7 * scale,
      shin: 7 * scale,
    },
    outfit: {
      skin: FACE.skin,
      skinShade: FACE.skinShade,
      shirt: colors.body,
      shirtShade: colors.bodyShade,
      pants: colors.bodyShade,
      pantsShade: colors.bodyShade,
      boots: '#2a1a20',
      armRadius: 2.6 * scale,
      legRadius: 2.4 * scale,
      waistHalf: 11 * scale,
      bootCover: 0.6,
      skirt: {
        color: colors.body,
        shade: colors.bodyShade,
        length: 10 * scale,
        hemHalf: 12 * scale,
      },
    },
    head: (skeleton) => dollHead(skeleton, r, colors),
    torso: (skeleton) => dollApron(skeleton, colors),
  };
}

/** Matrioska pequeña que sale de dentro de la grande. */
export const MATRYOSHKA_SMALL = createDoll('matryoshkaSmall', 0.72, {
  body: '#2f62c8',
  bodyShade: '#1f4492',
  scarf: '#2f62c8',
  apron: '#fbe7a1',
  flower: '#e2463e',
  flowerCenter: '#f2c23a',
  leaf: '#2f8a46',
});

/** Matrioska grande: se abre a mitad del baile y sale la pequeña. */
export const MATRYOSHKA: DancerDefinition = {
  ...createDoll('matryoshka', 1, {
    body: '#d6303c',
    bodyShade: '#9e1f2a',
    scarf: '#d6303c',
    apron: '#fbe7a1',
    flower: '#2f62c8',
    flowerCenter: '#f2c23a',
    leaf: '#2f8a46',
  }),
};
