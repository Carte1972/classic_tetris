import { describe, expect, it } from 'vitest';
import { PIECE_TYPES, SPAWN_COLUMN, SPAWN_ROW } from '../../../src/config/tetromino_config';
import {
  createSpawnPiece,
  getPieceCells,
  getPieceOffsets,
  getRotationCount,
  rotatePiece,
} from '../../../src/engine/tetrominoes';

describe('tetrominoes', () => {
  it('cada pieza tiene el número de orientaciones de NES', () => {
    expect(getRotationCount('O')).toBe(1);
    expect(getRotationCount('I')).toBe(2);
    expect(getRotationCount('S')).toBe(2);
    expect(getRotationCount('Z')).toBe(2);
    expect(getRotationCount('T')).toBe(4);
    expect(getRotationCount('J')).toBe(4);
    expect(getRotationCount('L')).toBe(4);
  });

  it.each(PIECE_TYPES)('todas las orientaciones de %s tienen 4 celdas distintas', (type) => {
    for (let rotation = 0; rotation < getRotationCount(type); rotation++) {
      const offsets = getPieceOffsets(type, rotation);
      expect(offsets).toHaveLength(4);
      expect(new Set(offsets.map((o) => `${o.x},${o.y}`)).size).toBe(4);
    }
  });

  it.each(PIECE_TYPES)('%s vuelve a su orientación tras una vuelta completa', (type) => {
    const spawn = createSpawnPiece(type);
    let piece = spawn;
    for (let i = 0; i < getRotationCount(type); i++) {
      piece = rotatePiece(piece, 1);
    }
    expect(piece).toEqual(spawn);
    expect(rotatePiece(rotatePiece(spawn, 1), -1)).toEqual(spawn);
  });

  it('las piezas aparecen en la columna y fila de spawn, en las filas ocultas', () => {
    for (const type of PIECE_TYPES) {
      const piece = createSpawnPiece(type);
      expect(piece).toEqual({ type, rotation: 0, x: SPAWN_COLUMN, y: SPAWN_ROW });
      for (const cell of getPieceCells(piece)) {
        expect(cell.y).toBeGreaterThanOrEqual(0);
        expect(cell.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('la T aparece apuntando hacia abajo y rota en sentido horario hacia la izquierda', () => {
    const spawn = createSpawnPiece('T');
    expect(getPieceCells(spawn)).toContainEqual({ x: SPAWN_COLUMN, y: SPAWN_ROW + 1 });
    expect(getPieceCells(rotatePiece(spawn, 1))).toContainEqual({
      x: SPAWN_COLUMN - 1,
      y: SPAWN_ROW,
    });
  });

  it('normaliza índices de orientación fuera de rango', () => {
    expect(getPieceOffsets('T', -1)).toEqual(getPieceOffsets('T', 3));
    expect(getPieceOffsets('I', 5)).toEqual(getPieceOffsets('I', 1));
  });
});
