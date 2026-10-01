/** Frecuencia de referencia del La4 (Hz). */
export const A4_FREQUENCY_HZ = 440;

/** Número MIDI del La4. */
export const A4_MIDI_NUMBER = 69;

/** Semitonos por octava. */
export const SEMITONES_PER_OCTAVE = 12;

/** Fracción de la duración de cada nota que suena (el resto separa notas repetidas). */
export const NOTE_GATE = 0.85;

/** Tiempo de ataque de las notas y efectos (s). */
export const ENVELOPE_ATTACK_S = 0.005;

/** Tiempo de caída final de las notas y efectos (s). */
export const ENVELOPE_RELEASE_S = 0.03;

/** Cada cuánto revisa el secuenciador qué notas programar (ms). */
export const SCHEDULER_INTERVAL_MS = 25;

/** Cuánto tiempo por delante programa notas el secuenciador (s). */
export const SCHEDULER_LOOKAHEAD_S = 0.12;

/** Volumen general. */
export const MASTER_VOLUME = 0.5;

/** Volumen de la música (relativo al general). */
export const MUSIC_VOLUME = 0.55;

/** Volumen de los efectos (relativo al general). */
export const SFX_VOLUME = 0.8;

/** Multiplicador de tempo de la música cuando el tablero está casi lleno. */
export const DANGER_TEMPO_MULTIPLIER = 1.15;

/** Filas visibles superiores que, si tienen algún bloque, indican tablero casi lleno. */
export const DANGER_ROWS = 5;
