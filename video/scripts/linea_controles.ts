// Pulsaciones del extracto de controles (escena 4), en segundos desde el principio del
// extracto. Las comparten la grabación y el rótulo que resalta cada tecla, y están
// alineadas con la narración (4.1 «Las flechas mueven y bajan la pieza», 4.2 «La flecha
// arriba y la Z la giran», 4.3 «Y con la P… ¡pausa!», que empieza en el segundo 1).

/** Una pulsación: instante, tecla y, si se mantiene, durante cuánto tiempo (s). */
export interface ControlStep {
  readonly at: number;
  readonly key: 'ArrowLeft' | 'ArrowRight' | 'ArrowDown' | 'ArrowUp' | 'KeyZ' | 'KeyP';
  readonly hold?: number;
}

/** Pulsaciones del extracto de controles. */
export const CONTROL_STEPS: readonly ControlStep[] = [
  { at: 1.1, key: 'ArrowLeft' },
  { at: 1.4, key: 'ArrowLeft' },
  { at: 1.8, key: 'ArrowRight' },
  { at: 2.1, key: 'ArrowRight' },
  { at: 2.4, key: 'ArrowDown', hold: 0.5 },
  { at: 3.3, key: 'ArrowUp' },
  { at: 3.8, key: 'ArrowUp' },
  { at: 4.4, key: 'KeyZ' },
  { at: 4.9, key: 'KeyZ' },
  { at: 6.4, key: 'KeyP' },
  { at: 8.8, key: 'KeyP' },
  { at: 9.6, key: 'ArrowLeft' },
  { at: 10.2, key: 'ArrowRight' },
  { at: 10.8, key: 'ArrowUp' },
  { at: 11.4, key: 'KeyZ' },
  { at: 12.0, key: 'ArrowDown', hold: 1.0 },
];
