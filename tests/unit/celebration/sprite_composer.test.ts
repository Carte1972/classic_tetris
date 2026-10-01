import { describe, expect, it } from 'vitest';
import { DANCERS } from '../../../src/celebration/characters';
import {
  colorizeMatrix,
  composeFigure,
  crossedArms,
  type PixelGrid,
} from '../../../src/celebration/sprite_composer';
import { MATRYOSHKA_SMALL } from '../../../src/celebration/sprites/characters/matryoshka';
import {
  LOWER_BODY_FRAMES,
  ARMS_FRAMES,
  mirrorMatrix,
} from '../../../src/celebration/sprites/poses';
import type { CharacterDefinition } from '../../../src/celebration/sprites/sprite_types';
import {
  FIGURE_HEIGHT,
  FIGURE_WIDTH,
  FRAMES_PER_MOVEMENT,
  type DanceMovement,
} from '../../../src/config/celebration_config';

const MOVEMENTS: readonly DanceMovement[] = ['enter', 'prisiadka', 'jump', 'exit'];
const ALL_CHARACTERS: readonly CharacterDefinition[] = [...DANCERS, MATRYOSHKA_SMALL];

/** Filas ocupadas (con algún píxel) de un fotograma. */
function occupiedRows(grid: PixelGrid): number[] {
  return grid.flatMap((row, y) => (row.some((pixel) => pixel !== null) ? [y] : []));
}

/** Serializa un fotograma para compararlo. */
function serialize(grid: PixelGrid): string {
  return grid.map((row) => row.map((pixel) => pixel ?? '.').join(',')).join('\n');
}

describe('poses compartidas', () => {
  it.each(MOVEMENTS)('%s tiene 6 fotogramas de piernas y brazos', (movement) => {
    expect(LOWER_BODY_FRAMES[movement]).toHaveLength(FRAMES_PER_MOVEMENT);
    expect(ARMS_FRAMES[movement]).toHaveLength(FRAMES_PER_MOVEMENT);
  });

  it('todas las matrices son rectangulares', () => {
    for (const movement of MOVEMENTS) {
      for (const pose of LOWER_BODY_FRAMES[movement]) {
        expect(new Set(pose.rows.map((row) => row.length)).size).toBe(1);
      }
    }
  });

  it('la prisiadka alterna patadas a derecha e izquierda (reflejadas)', () => {
    const [, , kickRight, , , kickLeft] = LOWER_BODY_FRAMES.prisiadka;
    expect(kickLeft?.rows).toEqual(mirrorMatrix(kickRight?.rows ?? []));
  });

  it('los brazos cruzados se adaptan al ancho de los hombros', () => {
    expect(crossedArms(6)[0]).toHaveLength(10);
    expect(crossedArms(10).every((row) => row.length === 14)).toBe(true);
  });
});

describe('personajes', () => {
  it.each(ALL_CHARACTERS.map((c) => [c.id, c] as const))(
    '%s: sus matrices son rectangulares y todos sus colores están definidos',
    (_, character) => {
      for (const part of [character.head, character.torso]) {
        expect(new Set(part.map((row) => row.length)).size).toBe(1);
      }
      for (const movement of MOVEMENTS) {
        for (let frame = 0; frame < FRAMES_PER_MOVEMENT; frame++) {
          expect(() => composeFigure(character, movement, frame)).not.toThrow();
        }
      }
    },
  );

  it.each(ALL_CHARACTERS.map((c) => [c.id, c] as const))(
    '%s: cada movimiento tiene 6 fotogramas distintos que caben en la figura',
    (_, character) => {
      for (const movement of MOVEMENTS) {
        const frames = Array.from({ length: FRAMES_PER_MOVEMENT }, (_, frame) =>
          composeFigure(character, movement, frame),
        );
        expect(new Set(frames.map((f) => serialize(f.grid))).size).toBeGreaterThanOrEqual(4);
        for (const figure of frames) {
          expect(figure.grid).toHaveLength(FIGURE_HEIGHT);
          expect(figure.grid[0]).toHaveLength(FIGURE_WIDTH);
          expect(occupiedRows(figure.grid)[0]).toBeGreaterThan(0);
        }
      }
    },
  );

  it('los pies quedan en la última fila de la figura', () => {
    const figure = composeFigure(DANCERS[0] ?? MATRYOSHKA_SMALL, 'enter', 0);
    expect(occupiedRows(figure.grid).at(-1)).toBe(figure.bottomY);
  });

  it('el gigante del baloncesto es mucho más alto que los demás', () => {
    const height = (character: CharacterDefinition) => {
      const rows = occupiedRows(composeFigure(character, 'exit', 0).grid);
      return (rows.at(-1) ?? 0) - (rows[0] ?? 0);
    };
    const giant = DANCERS.find((c) => c.id === 'basketballGiant');
    const others = DANCERS.filter((c) => c.id !== 'basketballGiant');
    expect(giant).toBeDefined();
    const giantHeight = height(giant ?? MATRYOSHKA_SMALL);
    for (const other of others) {
      expect(giantHeight).toBeGreaterThan(height(other) + 8);
    }
  });

  it('la matrioska grande se abre en una pequeña', () => {
    const big = DANCERS.find((c) => c.id === 'matryoshka');
    expect(big?.opensInto?.id).toBe('matryoshkaSmall');
  });

  it('el ajedrecista lleva la pieza de rey en la mano', () => {
    const master = DANCERS.find((c) => c.id === 'chessMaster');
    const ivory = master?.colors['X'];
    const figure = composeFigure(master ?? MATRYOSHKA_SMALL, 'exit', 0);
    expect(figure.grid.some((row) => row.includes(ivory ?? ''))).toBe(true);
  });

  it('detecta papeles de color sin definir', () => {
    const broken: CharacterDefinition = { ...MATRYOSHKA_SMALL, head: ['Q'] };
    expect(() => composeFigure(broken, 'enter', 0)).toThrow(/Papel de color/);
  });

  it('rechaza fotogramas inexistentes', () => {
    expect(() => composeFigure(MATRYOSHKA_SMALL, 'enter', 6)).toThrow(RangeError);
  });

  it('colorea matrices sueltas como el balón', () => {
    expect(colorizeMatrix(['.X'], { X: '#123456' })).toEqual([[null, '#123456']]);
  });
});
