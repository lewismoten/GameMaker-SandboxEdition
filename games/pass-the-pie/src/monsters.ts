// PASS THE PIE's monsters (.MBL, .MON), every picture drawn for this game (art.ts). No monster here is a person or
// an animal anyone fights: Mr. Plume kicks gadgets and vinyl.
//   SQUIRREL     street 1: friendly; touch one and it hops away (power 1, so a touch is enough)
//   LITTLE       street 1: little Mr. Plume, before the hat, following Rory about
//   WHAP         the kick: born in front of Mr. Plume by the kick's middle frame (plumeChar.ts), power 200, a short
//                reach (it flies KICK_SPEED pixels a tick for KICK_LIFE ticks)
//   INFLATABLE   a lawn turkey of vinyl: solid, harmless, in the way; one kick and it becomes FLAT
//   FLAT         the inflatable going down, "pff", gone in a moment
//   VAC_*        robot vacuums pacing a stretch of floor: they sting a little (Rory hops them, Mr. Plume kicks them)
//   DUMMY        a tackling dummy: two kicks (DUMMY, then DUMMY_HIT)
//   BLOWER       Big Gobble's blower: five kicks, a light of its gauge going out each time (BLOWER + 0 is full)
//   PUFF         what a kicked gadget leaves
// A thing that takes several kicks is a chain of monsters: each one "becomes" the next when the kick kills it.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { Book } from '../../kit/starter/book';
import * as art from './art';

export const MONS = {
  squirrel: 0,
  little: 1,
  whap: 2,
  inflatable: 3,
  flat: 4,
  vacShort: 5,
  vacLong: 6,
  puff: 7,
  dummy: 8,
  dummyHit: 9,
  blower: 10,
} as const;
/** Kicks Big Gobble's blower takes. */
export const BLOWER_HITS = 5;
/** Points: popping a squirrel, and each kick that lands. */
export const POP_POINTS = 50;
export const KICK_POINTS = 25;
/** The kick's reach: pixels a tick and ticks (about a block and a half past the beak). */
export const KICK_SPEED = 6;
export const KICK_LIFE = 7;
/** What a vacuum takes off the hero's hit points each tick he touches it. */
export const STING = 2;

const SOLID_ALL = SOLBOT | SOLLEF | SOLRIG | SOLTOP;

/** The monster pictures. */
export function monsterPictures(pal: Pal): Book {
  const mb = new Book('mbl', 100);
  const two = (name: string, a: ReturnType<typeof art.squirrel>, b: ReturnType<typeof art.squirrel>, rules = {}) => {
    mb.add(`${name}0`, a, rules);
    mb.add(`${name}1`, b, rules);
  };
  two('squirrel', art.squirrel(pal, false), art.squirrel(pal, true), { score: POP_POINTS });
  two('little', art.littlePlume(pal, false), art.littlePlume(pal, true));
  two('whap', art.whap(pal, false), art.whap(pal, true));
  two('inflatable', art.inflatable(pal, false), art.inflatable(pal, true), { solid: SOLID_ALL });
  two('flat', art.deflated(pal, false), art.deflated(pal, true));
  two('vac', art.vacuum(pal, false, true), art.vacuum(pal, true, true), { hp: -STING });
  two('puff', art.puff(pal, false), art.puff(pal, true));
  two('dummy', art.dummy(pal, false, false), art.dummy(pal, false, true), { solid: SOLID_ALL });
  two('dummyHit', art.dummy(pal, true, false), art.dummy(pal, true, true), { solid: SOLID_ALL });
  for (let lit = BLOWER_HITS; lit >= 1; lit--) two(`blower${lit}_`, art.blower(pal, lit, false), art.blower(pal, lit, true), { solid: SOLID_ALL });
  return mb;
}

export const finishMonsterPictures = (mb: Book): Block[] => mb.finish();

/** The .MON file. */
export function monsterSet(mb: Book): Monster[] {
  const set = newMonsterSet();
  const anim = (n: string, t: number): [number, number][] => [
    [mb.n(`${n}0`), t],
    [mb.n(`${n}1`), t],
  ];
  set[MONS.squirrel] = mon(anim('squirrel', 4), { power: 1, thru: 1 }, pace(4, 2));
  // little Mr. Plume follows Rory, slowly (towards: his speed straight at the hero), and never dies
  set[MONS.little] = mon(anim('little', 5), { power: 150, thru: 1, end: -2, towards: 1 });
  set[MONS.whap] = mon(anim('whap', 1), { power: 200, thru: 1, towards: KICK_SPEED, end: KICK_LIFE });
  set[MONS.inflatable] = mon(anim('inflatable', 9), { power: 150, thru: 1, newmon: MONS.flat, upscore: KICK_POINTS });
  set[MONS.flat] = mon(anim('flat', 6), { power: 150, thru: 1, end: 14 });
  set[MONS.vacShort] = mon(anim('vac', 2), { power: 150, thru: 1, newmon: MONS.puff, upscore: KICK_POINTS }, pace(3, 2));
  set[MONS.vacLong] = mon(anim('vac', 2), { power: 150, thru: 1, newmon: MONS.puff, upscore: KICK_POINTS }, pace(6, 3));
  set[MONS.puff] = mon(anim('puff', 5), { power: 150, thru: 1, end: 12 });
  set[MONS.dummy] = mon(anim('dummy', 12), { power: 150, thru: 1, newmon: MONS.dummyHit, upscore: KICK_POINTS });
  set[MONS.dummyHit] = mon(anim('dummyHit', 4), { power: 150, thru: 1, newmon: MONS.puff, upscore: KICK_POINTS });
  for (let i = 0; i < BLOWER_HITS; i++)
    set[MONS.blower + i] = mon(anim(`blower${BLOWER_HITS - i}_`, 3), {
      power: 150,
      thru: 1,
      newmon: i + 1 < BLOWER_HITS ? MONS.blower + i + 1 : MONS.puff,
      upscore: KICK_POINTS * 2,
    });
  return set;
}
