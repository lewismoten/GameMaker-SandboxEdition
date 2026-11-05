// DON'T GET SEEN's monsters. The kit's gumdrop 0, buzzer 1 and shelly 2 stay in the file (unused), then:
//   a lamp and four pieces of cone for each of the three sweeps (see lampOf): a light is five monsters in a column
// A light is a column of monsters that all walk the same path at the same speed, so they stay one
// above the other. The light does not look for Mara: it only walks back and forth. A monster picture takes
// hit points from Mara while he overlaps it (the picture's own rules), whether it is solid or not, so any
// piece of the column that touches him counts as being seen.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';
import { CONE, drawCone, drawLamp } from './lightArt';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const LAMP = 3;
/** Hit points the light takes off Mara for each moment he overlaps it. */
export const SEEN = 1;
/** How far a light walks (blocks to the right and back) and how fast (the engine's speed number), by level. */
export const SWEEP = [
  { run: 10, speed: 1 },
  { run: 8, speed: 1 },
  { run: 9, speed: 2 },
] as const;

/** The monster pictures: the kit's, then the lamp's two looks and the cone's four pieces in two frames each. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  // a light is not solid: Mara walks into it and is seen, he is not stopped by it
  const rules = { hp: -SEEN };
  for (const f of [0, 1] as const) mb.add(`lamp${f}`, drawLamp(pal, f), rules);
  for (let i = 0; i < CONE; i++) for (const f of [0, 1] as const) mb.add(`cone${i}_${f}`, drawCone(pal, i, f), rules);
  return mb;
}

/** The finished .MBL: the kit's own three monsters are made harmless and not solid. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1']) {
    blocks[mb.n(n)].solid = 0;
    blocks[mb.n(n)].chHitPt = 0;
  }
  return blocks;
}

/** The .MON: the kit's three, then for each of the three sweeps a lamp and its four pieces of cone (so each sweep has its own run and speed). */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb);
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  SWEEP.forEach(({ run, speed }, s) => {
    const first = lampOf(s);
    set[first] = mon(anim('lamp', 12), { power: 150, thru: 1 }, pace(run, speed));
    for (let i = 0; i < CONE; i++) set[first + 1 + i] = mon(anim(`cone${i}_`, 5), { power: 150, thru: 1 }, pace(run, speed));
  });
  return set;
}

/** The monster number of sweep `s`'s lamp; its cone pieces follow it. */
export const lampOf = (s: number): number => LAMP + s * (1 + CONE);
