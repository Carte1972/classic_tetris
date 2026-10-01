/** Acciones que el jugador puede realizar con el teclado. */
export type GameAction =
  | 'moveLeft'
  | 'moveRight'
  | 'softDrop'
  | 'rotateClockwise'
  | 'rotateCounterClockwise'
  | 'menuUp'
  | 'menuDown'
  | 'confirm'
  | 'back'
  | 'pause'
  | 'mute'
  | 'skip';

/**
 * Teclas asociadas a cada acción, por `KeyboardEvent.code` (posición física de la tecla).
 * Una misma tecla puede servir para varias acciones según la pantalla.
 */
export const KEY_BINDINGS: Readonly<Record<GameAction, readonly string[]>> = {
  moveLeft: ['ArrowLeft'],
  moveRight: ['ArrowRight'],
  softDrop: ['ArrowDown'],
  rotateClockwise: ['ArrowUp'],
  rotateCounterClockwise: ['KeyZ'],
  menuUp: ['ArrowUp'],
  menuDown: ['ArrowDown'],
  confirm: ['Enter', 'NumpadEnter'],
  back: ['Escape'],
  pause: ['KeyP'],
  mute: ['KeyM'],
  skip: ['Enter', 'NumpadEnter', 'Space'],
};

/** Frames que hay que mantener una dirección antes de que empiece la autorrepetición (DAS). */
export const DAS_INITIAL_DELAY_FRAMES = 16;

/** Frames entre desplazamientos durante la autorrepetición (DAS). */
export const DAS_REPEAT_FRAMES = 6;
