import { fillPixelRect, type Point } from '../../scene/pixel_shapes';
import { headPoints } from '../puppet/puppet_renderer';
import type { Skeleton } from '../puppet/skeleton';
import type { DancerDefinition, DancerFrame } from './dancer_types';
import { bodyPoint, drawEyes, faceVisible, headPixel } from './features';

/** Colores del gigante del baloncesto. */
const C = {
  skin: '#e8b48a',
  skinShade: '#c88e66',
  jersey: '#d23a3a',
  jerseyShade: '#9e2424',
  trim: '#f4f1e6',
  shorts: '#d23a3a',
  shortsShade: '#9e2424',
  socks: '#f4f1e6',
  hair: '#2b1c12',
  ball: '#e8792b',
  ballShade: '#b65516',
  seam: '#4a2410',
  eye: '#1b1220',
} as const;

/** Radio del balón (px). */
const BALL_RADIUS = 5;

/** Altura máxima del bote del balón (px). */
const BOUNCE_HEIGHT = 22;

/**
 * Posición del balón según el movimiento: bajo el brazo al entrar y salir, botando
 * durante las patadas, girando en un dedo al dar la vuelta y por encima de la cabeza
 * en el salto, hasta el mate.
 * @param skeleton Esqueleto.
 * @param frame Momento de la coreografía.
 * @returns Centro del balón.
 */
function ballPosition(skeleton: Skeleton, frame: DancerFrame): Point {
  const ground = Math.max(skeleton.legLeft.end.y, skeleton.legRight.end.y) + 1;
  switch (frame.move) {
    case 'prisiadka':
    case 'kicks': {
      const bounce = Math.abs(Math.sin(frame.moveElapsedMs / 180));
      return { x: skeleton.pelvis.x + 26, y: ground - BALL_RADIUS - bounce * BOUNCE_HEIGHT };
    }
    case 'spin':
      return { x: skeleton.armRight.end.x, y: skeleton.armRight.end.y - BALL_RADIUS - 2 };
    case 'jump': {
      const top = skeleton.head.y - 18;
      if (frame.moveProgress < 0.65) {
        return { x: skeleton.head.x + 4, y: top };
      }
      const slam = (frame.moveProgress - 0.65) / 0.35;
      return {
        x: skeleton.head.x + 8,
        y: top + (ground - BALL_RADIUS - top) * Math.min(1, slam * 1.4),
      };
    }
    case 'enter':
    case 'bow':
    case 'exit':
      return { x: skeleton.pelvis.x - 11 * skeleton.spinScale, y: skeleton.pelvis.y - 8 };
  }
}

/**
 * El gigante del baloncesto: personaje inventado, un pívot altísimo con gran bigote,
 * camiseta roja de tirantes con un número genérico, que bota el balón en la prisiadka
 * y hace un mate en el salto.
 */
export const BASKETBALL_GIANT: DancerDefinition = {
  id: 'basketballGiant',
  name: 'EL GIGANTE DEL BALONCESTO',
  body: {
    torso: 31,
    neck: 4,
    headRadius: 7.5,
    shoulderHalf: 10,
    hipHalf: 5.5,
    upperArm: 17,
    forearm: 16,
    thigh: 20,
    shin: 20,
  },
  outfit: {
    skin: C.skin,
    skinShade: C.skinShade,
    shirt: C.jersey,
    shirtShade: C.jerseyShade,
    sleeve: C.skin,
    pants: C.skin,
    pantsShade: C.skinShade,
    boots: C.socks,
    armRadius: 2.8,
    legRadius: 3,
    waistHalf: 8,
    bootCover: 0.3,
    skirt: { color: C.shorts, shade: C.shortsShade, length: 9, hemHalf: 9 },
  },
  head: (skeleton) => {
    const r = 7.5;
    return {
      shapes: [
        {
          kind: 'polygon',
          points: headPoints(skeleton, [
            { x: -r - 0.5, y: -1 },
            { x: -r, y: -r * 0.7 },
            { x: -r * 0.3, y: -r - 1.5 },
            { x: r * 0.5, y: -r - 1.5 },
            { x: r, y: -r * 0.7 },
            { x: r + 0.5, y: -1 },
            { x: r - 1, y: -r * 0.55 },
            { x: -r + 1, y: -r * 0.55 },
          ]),
          color: C.hair,
        },
      ],
      details: (ctx) => {
        if (!faceVisible(skeleton)) {
          return;
        }
        drawEyes(ctx, skeleton, { spread: 2.5, y: -1, color: C.eye });
        // Bigote enorme que tapa la boca.
        headPixel(ctx, skeleton, { x: -5, y: 2 }, 11, 3, C.hair);
        headPixel(ctx, skeleton, { x: -6, y: 4 }, 2, 2, C.hair);
        headPixel(ctx, skeleton, { x: 5, y: 4 }, 2, 2, C.hair);
      },
    };
  },
  torso: (skeleton) => ({
    details: (ctx) => {
      const scale = skeleton.spinScale;
      const neck = bodyPoint(skeleton, skeleton.chest, { x: -3, y: -1 });
      fillPixelRect(ctx, neck.x, neck.y, 6 * scale, 2, C.skin);
      if (!faceVisible(skeleton)) {
        return;
      }
      // Número 3 genérico, en blanco.
      const n = bodyPoint(skeleton, skeleton.chest, { x: -2.5, y: 8 });
      fillPixelRect(ctx, n.x, n.y, 5, 1, C.trim);
      fillPixelRect(ctx, n.x + 4, n.y, 1, 9, C.trim);
      fillPixelRect(ctx, n.x + 1, n.y + 4, 4, 1, C.trim);
      fillPixelRect(ctx, n.x, n.y + 8, 5, 1, C.trim);
      const hem = bodyPoint(skeleton, skeleton.pelvis, { x: -8, y: -1 });
      fillPixelRect(ctx, hem.x, hem.y, 16 * scale, 1, C.trim);
    },
  }),
  front: (skeleton, frame) => {
    const ball = ballPosition(skeleton, frame);
    return {
      shapes: [
        {
          kind: 'ellipse',
          center: ball,
          rx: BALL_RADIUS,
          ry: BALL_RADIUS,
          color: C.ball,
          shade: C.ballShade,
        },
      ],
      props: (ctx) => {
        fillPixelRect(ctx, ball.x - BALL_RADIUS + 1, ball.y, BALL_RADIUS * 2 - 1, 1, C.seam);
        fillPixelRect(ctx, ball.x, ball.y - BALL_RADIUS + 1, 1, BALL_RADIUS * 2 - 1, C.seam);
      },
    };
  },
};
