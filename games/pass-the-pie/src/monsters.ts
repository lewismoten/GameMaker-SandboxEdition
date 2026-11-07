// PASS THE PIE's monsters (.MBL, .MON). One squirrel is friendly (popped for 50 points when touched); the rest are
// hazards that take 5 hit points a bump and go on: robot vacuums, bobbing footballs, rolling cranberries and parade
// floats. Nothing here is a foe: none of them chases you.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import * as art from './art';

/** Monster numbers (the map's `mon`). */
export const MONS = { squirrel: 0, football: 1, vacuum: 2, berry: 3, float: 4 } as const;
/** Points for popping a squirrel. */
export const POP_POINTS = 50;
/** Hit points a bump costs (the kit's monster blocks). */
export const BUMP = -5;

/** The monster pictures: the kit's, then ours (each two frames). */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  const hurt = { ...mb.rulesOf('gumdrop0'), hp: BUMP };
  mb.add('squirrel0', art.squirrel(pal, false), { score: POP_POINTS });
  mb.add('squirrel1', art.squirrel(pal, true), { score: POP_POINTS });
  for (const [n, f] of [['football', art.football], ['vacuum', art.vacuum], ['berry', art.berry], ['float', art.floatCar]] as const) {
    mb.add(`${n}0`, f(pal, false), hurt);
    mb.add(`${n}1`, f(pal, true), hurt);
  }
  return mb;
}

export const finishMonsterPictures = (mb: Book): Block[] => mb.finish();

/** The .MON file. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (n: string, t: number): [number, number][] => [
    [mb.n(`${n}0`), t],
    [mb.n(`${n}1`), t],
  ];
  set[MONS.squirrel] = mon(anim('squirrel', 4), { power: 1, thru: 1 }, pace(4, 2));
  set[MONS.football] = mon(anim('football', 3), { power: 150, thru: 0 }, [corner(0, 0, 2), corner(0, 2, 2), corner(0, 0, 2)]);
  set[MONS.vacuum] = mon(anim('vacuum', 6), { power: 150, thru: 1 }, pace(5, 2));
  set[MONS.berry] = mon(anim('berry', 3), { power: 150, thru: 1 }, pace(6, 3));
  set[MONS.float] = mon(anim('float', 6), { power: 150, thru: 1 }, pace(6, 2));
  return set;
}
