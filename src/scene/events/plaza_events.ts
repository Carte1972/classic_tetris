import type { PlazaEventKind } from '../../config/plaza_events_config';
import { CHRISTMAS } from './christmas';
import { EASTER } from './easter';
import type { PlazaEvent } from './event_types';
import { FIREWORKS } from './fireworks';
import { MASLENITSA } from './maslenitsa';
import { OLYMPICS } from './olympics';
import { PARADE } from './parade';

/** Eventos de la plaza por tipo. */
export const PLAZA_EVENTS: Readonly<Record<PlazaEventKind, PlazaEvent>> = {
  parade: PARADE,
  easter: EASTER,
  christmas: CHRISTMAS,
  fireworks: FIREWORKS,
  maslenitsa: MASLENITSA,
  olympics: OLYMPICS,
};
