import type { RenderContext } from '../../render/render_context';
import type { Point } from '../../scene/pixel_shapes';
import { along, type BodyDrawing, type BodyShape } from '../puppet/puppet_renderer';
import type { LimbJoints, Skeleton } from '../puppet/skeleton';
import type { DancerDefinition, DancerFrame, DancerParts } from './dancer_types';

/** Parte del cuerpo que se dibuja. */
export type BodyPart = 'whole' | 'upper' | 'lower';

/**
 * Formas de una pierna: muslo, espinilla, bota y pie.
 * @param leg Articulaciones de la pierna.
 * @param def Bailarín.
 * @returns Formas de la pierna.
 */
function legShapes(leg: LimbJoints, def: DancerDefinition): BodyShape[] {
  const { outfit } = def;
  const bootTop = along(leg.end, leg.middle, outfit.bootCover);
  const dx = leg.end.x - leg.middle.x;
  const side = Math.sign(leg.end.x - leg.root.x) || 1;
  const foot: Point = {
    x: leg.end.x + side * outfit.legRadius * 0.7 + dx * 0.05,
    y: leg.end.y + 1,
  };
  return [
    {
      kind: 'capsule',
      from: leg.root,
      to: leg.middle,
      radius: outfit.legRadius + 0.5,
      color: outfit.pants,
      shade: outfit.pantsShade,
    },
    {
      kind: 'capsule',
      from: leg.middle,
      to: bootTop,
      radius: outfit.legRadius,
      color: outfit.pants,
      shade: outfit.pantsShade,
    },
    {
      kind: 'capsule',
      from: bootTop,
      to: leg.end,
      radius: outfit.legRadius + 0.3,
      color: outfit.boots,
    },
    {
      kind: 'capsule',
      from: leg.end,
      to: foot,
      radius: outfit.legRadius * 0.75,
      color: outfit.boots,
    },
  ];
}

/**
 * Formas de un brazo: manga, antebrazo y mano.
 * @param arm Articulaciones del brazo.
 * @param def Bailarín.
 * @returns Formas del brazo.
 */
function armShapes(arm: LimbJoints, def: DancerDefinition): BodyShape[] {
  const { outfit } = def;
  const sleeve = outfit.sleeve ?? outfit.shirt;
  return [
    {
      kind: 'capsule',
      from: arm.root,
      to: arm.middle,
      radius: outfit.armRadius,
      color: sleeve,
      shade: outfit.shirtShade,
    },
    {
      kind: 'capsule',
      from: arm.middle,
      to: along(arm.middle, arm.end, 0.85),
      radius: outfit.armRadius - 0.3,
      color: sleeve,
      shade: outfit.shirtShade,
    },
    {
      kind: 'ellipse',
      center: arm.end,
      rx: outfit.armRadius * 0.85,
      ry: outfit.armRadius * 0.85,
      color: outfit.skin,
    },
  ];
}

/**
 * Torso como trapecio de los hombros a la cintura, siguiendo la inclinación y el giro.
 * @param skeleton Esqueleto.
 * @param def Bailarín.
 * @returns Vértices del torso.
 */
function torsoPoints(skeleton: Skeleton, def: DancerDefinition): Point[] {
  const across = { x: Math.cos(skeleton.lean) * skeleton.spinScale, y: Math.sin(skeleton.lean) };
  const shoulder = def.body.shoulderHalf + def.outfit.armRadius * 0.6;
  const waist = def.outfit.waistHalf;
  const at = (center: Point, half: number, side: number): Point => ({
    x: center.x + across.x * half * side,
    y: center.y + across.y * half * side,
  });
  return [
    at(skeleton.chest, shoulder, -1),
    at(skeleton.chest, shoulder, 1),
    at(skeleton.pelvis, waist, 1),
    at(skeleton.pelvis, waist, -1),
  ];
}

/**
 * Abrigo o falda desde la cintura, con vuelo hacia el bajo.
 * @param skeleton Esqueleto.
 * @param def Bailarín.
 * @returns Vértices de la falda.
 */
function skirtPoints(skeleton: Skeleton, def: DancerDefinition): Point[] {
  const skirt = def.outfit.skirt;
  if (skirt === undefined) {
    return [];
  }
  const scale = skeleton.spinScale;
  const down = { x: -Math.sin(skeleton.lean), y: Math.cos(skeleton.lean) };
  const hem = {
    x: skeleton.pelvis.x + down.x * skirt.length,
    y: skeleton.pelvis.y + down.y * skirt.length,
  };
  const spread = Math.max(
    Math.abs(skeleton.legLeft.middle.x - skeleton.legRight.middle.x) / 2 + def.outfit.legRadius,
    skirt.hemHalf,
  );
  return [
    { x: skeleton.pelvis.x - def.outfit.waistHalf * scale, y: skeleton.pelvis.y - 2 },
    { x: skeleton.pelvis.x + def.outfit.waistHalf * scale, y: skeleton.pelvis.y - 2 },
    { x: hem.x + spread * scale, y: hem.y },
    { x: hem.x - spread * scale, y: hem.y },
  ];
}

/**
 * Polígono de cuatro vértices con su mitad derecha en sombra (da volumen a torso y falda).
 * @param points Vértices: arriba-izquierda, arriba-derecha, abajo-derecha, abajo-izquierda.
 * @param color Color de la parte iluminada.
 * @param shade Color de la parte en sombra.
 * @returns El polígono y su sombra.
 */
function withShade(points: readonly Point[], color: string, shade: string): BodyShape[] {
  const [topLeft, topRight, bottomRight, bottomLeft] = points;
  if (!topLeft || !topRight || !bottomRight || !bottomLeft) {
    return [];
  }
  const topMid = along(topLeft, topRight, 0.62);
  const bottomMid = along(bottomLeft, bottomRight, 0.62);
  return [
    { kind: 'polygon', points, color },
    { kind: 'polygon', points: [topMid, topRight, bottomRight, bottomMid], color: shade },
  ];
}

/**
 * Junta varias partes en una.
 * @param parts Partes (pueden faltar).
 * @returns Formas, detalles y objetos combinados.
 */
function combine(parts: readonly (DancerParts | undefined)[]): Required<DancerParts> {
  const present = parts.filter((p): p is DancerParts => p !== undefined);
  return {
    shapes: present.flatMap((p) => p.shapes ?? []),
    details: (ctx: RenderContext) => present.forEach((p) => p.details?.(ctx)),
    props: (ctx: RenderContext) => present.forEach((p) => p.props?.(ctx)),
  };
}

/**
 * Construye el dibujo de un bailarín humanoide en un fotograma.
 * @param def Bailarín.
 * @param skeleton Esqueleto colocado.
 * @param frame Momento de la coreografía.
 * @param part Cuerpo entero o solo la mitad de arriba (torso, cabeza y brazos) o la de
 *   abajo (piernas y falda); se usa al abrirse la matrioska.
 * @returns Formas, detalles y objetos para `drawBody`.
 */
export function buildHumanoid(
  def: DancerDefinition,
  skeleton: Skeleton,
  frame: DancerFrame,
  part: BodyPart = 'whole',
): BodyDrawing {
  const { outfit } = def;
  const behind = def.behind?.(skeleton, frame);
  const torso = def.torso?.(skeleton, frame);
  const head = def.head(skeleton, frame);
  const front = def.front?.(skeleton, frame);
  const skirt = skirtPoints(skeleton, def);
  const lower: BodyShape[] = [
    ...legShapes(skeleton.legLeft, def),
    ...legShapes(skeleton.legRight, def),
    ...(skirt.length > 0 && outfit.skirt !== undefined
      ? withShade(skirt, outfit.skirt.color, outfit.skirt.shade)
      : []),
  ];
  if (part === 'lower') {
    return { shapes: lower };
  }
  const upper: BodyShape[] = [
    ...withShade(torsoPoints(skeleton, def), outfit.shirt, outfit.shirtShade),
    {
      kind: 'capsule',
      from: skeleton.chest,
      to: along(skeleton.chest, skeleton.head, 0.55),
      radius: 2.2,
      color: outfit.skin,
    },
    ...(torso?.shapes ?? []),
    {
      kind: 'ellipse',
      center: skeleton.head,
      rx: def.body.headRadius * Math.max(0.55, Math.abs(skeleton.spinScale)),
      ry: def.body.headRadius,
      color: outfit.skin,
      shade: outfit.skinShade,
    },
    ...(head.shapes ?? []),
    ...armShapes(skeleton.armLeft, def),
    ...armShapes(skeleton.armRight, def),
  ];
  if (part === 'upper') {
    const extras = combine([torso, head]);
    return { shapes: upper, details: extras.details };
  }
  const shapes: BodyShape[] = [
    ...(behind?.shapes ?? []),
    ...lower,
    ...upper,
    ...(front?.shapes ?? []),
  ];
  const extras = combine([behind, torso, head, front]);
  return { shapes, details: extras.details, props: extras.props };
}
