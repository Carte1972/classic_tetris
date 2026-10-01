import { BABUSHKA } from './sprites/characters/babushka';
import { BALLERINA } from './sprites/characters/ballerina';
import { BASKETBALL_GIANT } from './sprites/characters/basketball_giant';
import { BEAR } from './sprites/characters/bear';
import { CHESS_MASTER } from './sprites/characters/chess_master';
import { COSMONAUT } from './sprites/characters/cosmonaut';
import { COSSACK } from './sprites/characters/cossack';
import { MATRYOSHKA } from './sprites/characters/matryoshka';
import type { CharacterDefinition } from './sprites/sprite_types';

/** Bailarines en el orden en que aparecen al subir de nivel (el primero en el nivel 1). */
export const DANCERS: readonly CharacterDefinition[] = [
  COSSACK,
  MATRYOSHKA,
  BEAR,
  BABUSHKA,
  COSMONAUT,
  CHESS_MASTER,
  BASKETBALL_GIANT,
  BALLERINA,
];
