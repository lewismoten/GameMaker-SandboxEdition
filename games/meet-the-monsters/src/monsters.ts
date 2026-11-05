// MEET THE MONSTERS' monsters. The kit's gumdrop 0, buzzer 1 and shelly 2, then this game's own:
//   pop    a mint-green gumdrop that is harmless: touch it and it is gone (and 50 points)
//   dazed  the snail after it hurts: it flickers, can't hurt, and turns back after a moment
//   grump  a purple gumdrop that hurts a little (level 2), and its dazed twin
// What the engine does when a monster is touched (code/GM/PLAYGAME.C, the monster loop): on EVERY
// monster tick the two overlap, the monster block's effects are applied to the hero (hit points,
// score, a counter), and a monster whose "power" is under 100 then dies, or becomes the monster
// named in "Newmon". It does not matter which side was touched. So a monster that hurts must not
// stay a monster that hurts: power 1 and a Newmon of its dazed twin makes one touch cost one hit.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import type { Pal } from '../../kit/starter/palette';

/** The monster numbers this game adds after the kit's gumdrop 0, buzzer 1 and shelly 2. */
export const POP = 3;
export const SHELLY_DAZED = 4;
export const GRUMP = 5;
export const GRUMP_DAZED = 6;

/** Hit points one bump takes, and the hero's own (so five separate bumps cost a life). */
export const HURT = -10;
export const HERO_HIT_POINTS = 50;
/** How many ticks a monster stays dazed (about three seconds) before it can hurt again. */
const DAZE = 54;

const T = 255;

/** The gumdrop's picture with its purple turned mint green. */
function mint(pal: Pal, pic: Pixels): Pixels {
  const purple = pal.r('purple');
  const teal = pal.r('teal');
  return pic.crop(0, 0, 20, 20).map((_x, _y, c) => {
    const k = purple.indexOf(c);
    return k < 0 ? c : teal[k];
  });
}

/** The monster pictures: the kit's, then pop, the dazed twins and the purple gumdrop that hurts. */
export function monsterPictures(pal: Pal): Book {
  const mb = buildMonsterBlocks(pal);
  const g0 = mb.pics.get('gumdrop0')!;
  const g1 = mb.pics.get('gumdrop1')!;
  const s0 = mb.pics.get('shelly0')!;
  // harmless: no hit points taken, 50 points for the pop
  mb.add('pop0', mint(pal, g0), { score: 50 });
  mb.add('pop1', mint(pal, mb.pics.get('gumdrop1')!), { score: 50 });
  // the purple gumdrop of level 2 hurts; the dazed twins are the same pictures that don't, flickering
  mb.add('grump0', g0, { hp: HURT });
  mb.add('grump1', g1, { hp: HURT });
  mb.add('dazed.shelly', s0, {});
  mb.add('dazed.grump', g0, {});
  mb.add('dazed.gone', new Pixels(20, 20, T), {});
  return mb;
}

/** The finished .MBL: the kit's gumdrop is harmless (level 1's first meeting); the snail's hurt is HURT and not solid. */
export function finishMonsterPictures(mb: Book): Block[] {
  const blocks = mb.finish();
  for (const n of ['gumdrop0', 'gumdrop1', 'buzzer0', 'buzzer1', 'shelly0', 'shelly1', 'grump0', 'grump1']) {
    const b = blocks[mb.n(n)];
    b.solid = 0; // the hero passes through: nothing holds their while it hurts
    if (n.startsWith('gumdrop')) b.chHitPt = 0;
    else b.chHitPt = HURT;
  }
  return blocks;
}

/** The .MON: the kit's three, pop (power 1: gone when touched), the dazed twins and the grump. */
export function monsterSet(mb: Book): Monster[] {
  const set = buildMonsters(mb, { gumdrop: 4, shelly: 2 });
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  const flicker = (name: string): [number, number][] => [
    [mb.n(name), 2],
    [mb.n('dazed.gone'), 2],
  ];
  // touched, a hurting monster turns into its dazed twin (power under 100), and the twin turns back after DAZE ticks (end)
  set[2] = { ...set[2], power: 1, newmon: SHELLY_DAZED };
  set[SHELLY_DAZED] = mon(flicker('dazed.shelly'), { power: 150, thru: 1, newmon: 2, end: DAZE }, pace(2, 1));
  set[POP] = mon(anim('pop', 4), { power: 1, thru: 1 });
  set[GRUMP] = mon(anim('grump', 4), { power: 1, thru: 1, newmon: GRUMP_DAZED }, pace(4, 2));
  set[GRUMP_DAZED] = mon(flicker('dazed.grump'), { power: 150, thru: 1, newmon: GRUMP, end: DAZE }, pace(4, 2));
  return set;
}
