import type { PlazaEventKind } from '../../config/plaza_events_config';
import type { RenderContext } from '../../render/render_context';
import type { SceneActor } from '../actors';

/** Datos de un fotograma de un evento. */
export interface EventFrame {
  /** Tiempo desde que empezó el evento (ms). */
  readonly elapsedMs: number;
  /** Duración total prevista del evento (ms). */
  readonly durationMs: number;
  /** Presencia del evento (0–1): sube al empezar y baja al acabar. */
  readonly presence: number;
  /** Tiempo de la escena (ms), para las animaciones continuas. */
  readonly timeMs: number;
  /** Nivel de noche (0 de día, 1 de noche). */
  readonly night: number;
}

/** Luz extra que un evento da a los edificios de noche (focos, destellos). */
export interface EventIllumination {
  /** Edificios del fondo (Kremlin, GUM, museo). */
  readonly back: number;
  /** San Basilio. */
  readonly front: number;
}

/** Evento de la plaza: qué añade al cielo, a los edificios y al suelo. */
export interface PlazaEvent {
  readonly kind: PlazaEventKind;
  /** Dibujos en el cielo, por detrás de los edificios (fuegos, aviones). */
  readonly drawSky?: (ctx: RenderContext, frame: EventFrame) => void;
  /** Adornos sobre los edificios del fondo (guirnaldas, banderas). */
  readonly drawBackDecor?: (ctx: RenderContext, frame: EventFrame) => void;
  /** Adornos sobre San Basilio. */
  readonly drawFrontDecor?: (ctx: RenderContext, frame: EventFrame) => void;
  /** Decorados y figurantes del suelo, que se ordenan por profundidad con la gente. */
  readonly actors: (frame: EventFrame) => readonly SceneActor[];
  /** Luz sobre los edificios de noche, de 0 a 1. */
  readonly illumination?: (frame: EventFrame) => EventIllumination;
}
