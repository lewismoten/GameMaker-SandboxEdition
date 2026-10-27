// The heroes' character files, by the name a level gives its hero: Teddy's and Gwinn's
// from the sequel, Doc Leo's and THE CHEZ's new for the finale, and Teddy hopping on the spot
// for the dream run (runner.chr).
import type { Block } from '../../../web/src/formats/blocks';
import type { Character } from '../../../web/src/formats/character';
import type { Hero } from './levels/level';
import { buildCharacter, CB } from './characters/character';
import { buildGwinn, GB } from './characters/gwinnChar';
import { buildLeo, LB } from './characters/leoChar';
import { buildChez, ZB } from './characters/chezChar';
import { buildRunner, RB } from './characters/runnerChar';

export const HEROES: Record<Hero, { chr: Character; cbl: Block[] }> = {
  teddy: { chr: buildCharacter(), cbl: CB.build() },
  gwinn: { chr: buildGwinn(), cbl: GB.build() },
  leo: { chr: buildLeo(), cbl: LB.build() },
  chez: { chr: buildChez(), cbl: ZB.build() },
  runner: { chr: buildRunner(), cbl: RB.build() },
};
