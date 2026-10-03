// Pulsaciones del extracto de controles (escena 4), en segundos desde el principio del
// extracto. Las comparten la grabación y el rótulo que resalta cada tecla, y están
// alineadas con la narración a 170 palabras por minuto, que empieza en el segundo 1:
// 4.1 «Las flechas mueven y bajan la pieza» (1,0–3,2 s), 4.2 «La flecha arriba y la zeta,
// la giran» (3,8–6,6 s), 4.3 «Y con la pe, pausas el juego» (7,2–9,2 s), 4.4 «Y bajo el
// marcador tienes el botón de piloto automático» (9,9–13,2 s) y 4.5 «Le da el control a
// una inteligencia artificial simbólica…» (13,7–19,5 s). El montaje comprueba que el clic
// del botón cae entre 4.4 y 4.5.

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
  { at: 9.6, key: 'KeyP' },
];

/** Desde cuándo se señala el botón del piloto automático (inicio de la frase 4.4, s). */
export const AUTOPILOT_POINT_AT = 9.9;

/** Instante del clic en el botón: al acabar la frase 4.4, justo antes de la 4.5 (s). */
export const AUTOPILOT_CLICK_AT = 13.4;

/** Desde cuándo se explica qué hace el piloto (inicio de la frase 4.5, s). */
export const AUTOPILOT_LABEL_AT = 13.7;

/** Duración del extracto de controles, con margen tras la frase 4.5 (s). */
export const CONTROLS_CLIP_SECONDS = 22;

/**
 * Recuadro del botón del piloto en los fotogramas de 1920 × 1080 (ventana de 1280 × 720 a
 * densidad 1,5). Lo usa el rótulo para señalarlo; la grabación comprueba que coincide.
 */
export const AUTOPILOT_BUTTON_BOX = { x: 343, y: 621, width: 358, height: 66 } as const;
