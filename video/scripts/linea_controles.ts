// Pulsaciones del extracto de controles (escena 4), en segundos desde el principio del
// extracto. Las comparten la grabación y el rótulo que resalta cada tecla, y están
// alineadas con la narración a 170 palabras por minuto, que empieza en el segundo 1:
// 4.1 «Las flechas mueven y bajan la pieza» (1,0–3,2 s), 4.2 «La flecha arriba y la Z la
// giran» (3,8–6,6 s) y 4.3 «Y con la P… ¡pausa!» (7,2–8,7 s).

/** Una pulsación: instante, tecla y, si se mantiene, durante cuánto tiempo (s). */
export interface ControlStep {
  readonly at: number;
  readonly key: 'ArrowLeft' | 'ArrowRight' | 'ArrowDown' | 'ArrowUp' | 'KeyZ' | 'KeyP';
  readonly hold?: number;
}

/** Pulsaciones del extracto de controles. */
export const CONTROL_STEPS: readonly ControlStep[] = [
  { at: 1.2, key: 'ArrowLeft' },
  { at: 1.5, key: 'ArrowLeft' },
  { at: 1.9, key: 'ArrowRight' },
  { at: 2.2, key: 'ArrowRight' },
  { at: 2.6, key: 'ArrowDown', hold: 0.5 },
  { at: 3.9, key: 'ArrowUp' },
  { at: 4.4, key: 'ArrowUp' },
  { at: 5.2, key: 'KeyZ' },
  { at: 5.7, key: 'KeyZ' },
  { at: 8.2, key: 'KeyP' },
  { at: 10.6, key: 'KeyP' },
  { at: 11.4, key: 'ArrowLeft' },
  { at: 12.0, key: 'ArrowRight' },
  { at: 12.6, key: 'ArrowUp' },
  { at: 13.2, key: 'KeyZ' },
  { at: 13.8, key: 'ArrowDown', hold: 1.0 },
];
