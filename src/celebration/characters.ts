import { BABUSHKA } from './dancers/babushka';
import { BALLERINA } from './dancers/ballerina';
import { BASKETBALL_GIANT } from './dancers/basketball_giant';
import { BEAR } from './dancers/bear';
import { CHESS_MASTER } from './dancers/chess_master';
import { COSMONAUT } from './dancers/cosmonaut';
import { COSSACK } from './dancers/cossack';
import type { DancerDefinition } from './dancers/dancer_types';
import { MATRYOSHKA, MATRYOSHKA_SMALL } from './dancers/matryoshka';
import { RASPUTIN } from './dancers/rasputin';
import { ARENA_1980 } from './stages/arena_1980';
import { BOLSHOI } from './stages/bolshoi';
import { HALL_OF_COLUMNS } from './stages/hall_of_columns';
import { KITCHEN } from './stages/kitchen';
import { KREMLIN_HALL } from './stages/kremlin_hall';
import { LAUNCHPAD } from './stages/launchpad';
import { STEPPE } from './stages/steppe';
import type { Stage } from './stages/stage_types';
import { TAIGA } from './stages/taiga';
import { WORKSHOP } from './stages/workshop';

/** Bailarín con su escenario. */
export interface Performer {
  readonly dancer: DancerDefinition;
  readonly stage: Stage;
  /** Personaje que sale de dentro al abrirse (la matrioska pequeña). */
  readonly opensInto?: DancerDefinition;
}

/** Bailarines en el orden en que aparecen al superar niveles (el primero, en el primer nivel). */
export const PERFORMERS: readonly Performer[] = [
  { dancer: COSSACK, stage: STEPPE },
  { dancer: MATRYOSHKA, stage: WORKSHOP, opensInto: MATRYOSHKA_SMALL },
  { dancer: BEAR, stage: TAIGA },
  { dancer: BABUSHKA, stage: KITCHEN },
  { dancer: COSMONAUT, stage: LAUNCHPAD },
  { dancer: CHESS_MASTER, stage: HALL_OF_COLUMNS },
  { dancer: BASKETBALL_GIANT, stage: ARENA_1980 },
  { dancer: BALLERINA, stage: BOLSHOI },
  { dancer: RASPUTIN, stage: KREMLIN_HALL },
];
