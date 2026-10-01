import { DANGER_ROWS, DANGER_TEMPO_MULTIPLIER } from '../config/audio_config';
import { VISIBLE_ROWS } from '../config/board_config';
import type { SfxName } from '../config/sfx_config';
import type { GameEvent } from '../engine/types';

/** Líneas limpiadas a la vez que cuentan como "4 líneas" para el sonido especial. */
const TETRIS_LINE_COUNT = 4;

/**
 * Efectos de sonido que corresponden a los eventos de un frame. Si en el mismo frame se
 * limpian líneas, el sonido de limpieza sustituye al de fijar la pieza.
 * @param events Eventos del motor.
 * @returns Efectos a reproducir, sin repetidos.
 */
export function getSfxForEvents(events: readonly GameEvent[]): readonly SfxName[] {
  const sounds = new Set<SfxName>();
  for (const event of events) {
    switch (event.type) {
      case 'pieceMoved':
        sounds.add('move');
        break;
      case 'pieceRotated':
        sounds.add('rotate');
        break;
      case 'pieceLocked':
        sounds.add('lock');
        break;
      case 'linesCleared':
        sounds.add(event.count >= TETRIS_LINE_COUNT ? 'tetris' : 'lineClear');
        break;
      case 'levelUp':
        sounds.add('levelUp');
        break;
      case 'gameOver':
        sounds.add('gameOver');
        break;
    }
  }
  if (sounds.has('lineClear') || sounds.has('tetris')) {
    sounds.delete('lock');
  }
  return [...sounds];
}

/**
 * Velocidad de la música según la altura de la pila: se acelera cuando hay algún bloque
 * en las filas visibles superiores.
 * @param stackHeight Altura de la pila en filas visibles.
 * @returns Multiplicador de tempo.
 */
export function getMusicTempoMultiplier(stackHeight: number): number {
  return stackHeight > VISIBLE_ROWS - DANGER_ROWS ? DANGER_TEMPO_MULTIPLIER : 1;
}
