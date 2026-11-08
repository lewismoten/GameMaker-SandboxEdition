// PASS THE PIE's monsters (.MBL, .MON), every picture drawn for this game (art.ts, art3.ts). Nothing here is a
// person, and nothing anyone fights is alive: Mr. Plume kicks gadgets and vinyl, Rory outsmarts them.
//   SQUIRREL     friendly; catches a tossed roll (or a touch) and scampers off, for points
//   LITTLE       street 1: little Mr. Plume, before the hat, following Rory about
//   WHAP, POW    Mr. Plume's kick: each press is a three-hit combo (WHAP, WHAP, then the bigger POW that reaches
//                further), born in front of him by the kick's frames (plumeChar.ts)
//   ROLL         Rory's toss: a dinner roll that flies a few blocks
//   INFLATABLE   a lawn turkey of vinyl: solid, harmless, in the way; one hit and it goes FLAT
//   VAC_*        robot vacuums pacing a stretch of floor; they bump. A roll in the mouth makes one a FED_VAC: stalled,
//                solid, and a step to stand on. Mr. Plume just kicks them.
//   MOWER        Dale's robot mower, quicker; fed, it is a FED_MOWER (a step too)
//   DRONE_*      leaf-blower drones: a patrol in the air, or a swoop (down and back up) that is read and ducked
//   BAG          a canvas kick bag on a stand: three hits (BAG, BAG_1, BAG_2), so one full combo
//   BLOWER       Big Gobble's blower: nine hits (three combos), a light of its gauge going out every hit or so
//   STAKE        Big Gobble's tether stakes: three hits each
//   GOBBLET      a little balloon turkey Big Gobble's beak puffs out; it drifts toward Mr. Plume
//   CHASER_*     Big Gobble loose on Main Street: four pieces of one face rolling right along the same path
//   PUFF         what a kicked gadget leaves
// A thing that takes several hits is a chain of monsters: each one "becomes" the next when a hit kills it.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { Book } from '../../kit/starter/book';
import * as art from './art';
import * as art3 from './art3';

export const MONS = {
  squirrel: 0,
  little: 1,
  whap: 2,
  inflatable: 3,
  flat: 4,
  vacShort: 5,
  vacLong: 6,
  puff: 7,
  bag: 8, // 8, 9, 10
  blower: 11, // 11 .. 19
  roll: 20,
  fedVac: 21,
  drone: 22,
  droneSwoop: 23,
  mower: 24,
  fedMower: 25,
  gobblet: 26,
  stake: 27, // 27, 28, 29
  chaser: 30, // 30 .. 33: TL, TR, BL, BR
  pow: 34,
  vacQuick: 35,
  droneHigh: 36,
} as const;
/** Hits a kick bag, the blower and a stake take. */
export const BAG_HITS = 3;
export const BLOWER_HITS = 9;
export const STAKE_HITS = 3;
/** Points: a squirrel's catch, each hit that lands, a vacuum fed. */
export const POP_POINTS = 50;
export const KICK_POINTS = 25;
export const FEED_POINTS = 40;
/** The kick's reach: pixels a tick and ticks; the POW goes further. */
export const KICK_SPEED = 6;
export const KICK_LIFE = 6;
export const POW_LIFE = 9;
/** A roll's flight: pixels a tick and ticks (about six blocks). */
export const ROLL_SPEED = 6;
export const ROLL_LIFE = 22;
/** What a vacuum or drone takes off the hero's hit points each tick he touches it. */
export const STING = 2;
/** What the loose Big Gobble takes each tick it rolls over Mr. Plume. */
export const SQUASH = 6;
/** The chase: how far Big Gobble rolls (blocks) and how fast (pixels a tick). */
export const CHASE_RUN = 96;
export const CHASE_SPEED = 2;

const SOLID_ALL = SOLBOT | SOLLEF | SOLRIG | SOLTOP;

/** The monster pictures. */
export function monsterPictures(pal: Pal): Book {
  const mb = new Book('mbl', 100);
  type P = ReturnType<typeof art.squirrel>;
  const two = (name: string, a: P, b: P, rules = {}) => {
    mb.add(`${name}0`, a, rules);
    mb.add(`${name}1`, b, rules);
  };
  const sting = { hp: -STING };
  two('squirrel', art.squirrel(pal, false), art.squirrel(pal, true), { score: POP_POINTS });
  two('little', art.littlePlume(pal, false), art.littlePlume(pal, true));
  two('whap', art.whap(pal, false), art.whap(pal, true));
  two('pow', art.whap(pal, true), art.pow(pal));
  two('inflatable', art.inflatable(pal, false), art.inflatable(pal, true), { solid: SOLID_ALL });
  two('flat', art.deflated(pal, false), art.deflated(pal, true));
  two('vac', art.vacuum(pal, false, true), art.vacuum(pal, true, true), sting);
  two('puff', art.puff(pal, false), art.puff(pal, true));
  for (let h = 0; h < BAG_HITS; h++) two(`bag${h}_`, art3.bag(pal, h, false), art3.bag(pal, h, true), { solid: SOLID_ALL });
  for (let lit = 5; lit >= 1; lit--) two(`blower${lit}_`, art.blower(pal, lit, false), art.blower(pal, lit, true), { solid: SOLID_ALL });
  two('roll', art3.roll(pal, false), art3.roll(pal, true));
  two('fedVac', art3.fedVac(pal, false), art3.fedVac(pal, true), { solid: SOLID_ALL });
  two('drone', art3.drone(pal, false), art3.drone(pal, true), sting);
  two('mower', art3.mower(pal, false), art3.mower(pal, true), sting);
  two('gobblet', art3.gobblet(pal, false), art3.gobblet(pal, true), sting);
  for (let h = 0; h < STAKE_HITS; h++) two(`stake${h}_`, art3.stake(pal, h, false), art3.stake(pal, h, true), { solid: SOLID_ALL });
  const [a, b] = [art3.chaser(pal, false), art3.chaser(pal, true)];
  for (let i = 0; i < 4; i++) two(`chaser${i}_`, a[i], b[i], { hp: -SQUASH });
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
  const hit = { power: 150, thru: 1, upscore: KICK_POINTS };
  set[MONS.squirrel] = mon(anim('squirrel', 4), { power: 1, thru: 1, upscore: POP_POINTS }, pace(4, 2));
  // little Mr. Plume follows Rory, slowly, and nothing Rory does can knock him over
  set[MONS.little] = mon(anim('little', 5), { power: 250, thru: 1, end: -2, towards: 1 });
  set[MONS.whap] = mon(anim('whap', 1), { power: 200, thru: 1, towards: KICK_SPEED, end: KICK_LIFE });
  set[MONS.pow] = mon(anim('pow', 2), { power: 200, thru: 1, towards: KICK_SPEED, end: POW_LIFE });
  set[MONS.roll] = mon(anim('roll', 2), { power: 200, thru: 1, towards: ROLL_SPEED, end: ROLL_LIFE });
  set[MONS.inflatable] = mon(anim('inflatable', 9), { ...hit, newmon: MONS.flat });
  set[MONS.flat] = mon(anim('flat', 6), { power: 250, thru: 1, end: 14 });
  set[MONS.puff] = mon(anim('puff', 5), { power: 250, thru: 1, end: 12 });
  const fed = { ...hit, newmon: MONS.fedVac, upscore: FEED_POINTS };
  set[MONS.vacShort] = mon(anim('vac', 2), fed, pace(3, 2));
  set[MONS.vacLong] = mon(anim('vac', 2), fed, pace(6, 3));
  set[MONS.vacQuick] = mon(anim('vac', 1), fed, pace(5, 4));
  // a fed vacuum sleeps where it stopped: solid, still, and too heavy to kick over
  set[MONS.fedVac] = mon(anim('fedVac', 9), { power: 250, thru: 1, end: -2 });
  set[MONS.mower] = mon(anim('mower', 1), { ...hit, newmon: MONS.fedMower, upscore: FEED_POINTS }, pace(7, 4));
  set[MONS.fedMower] = set[MONS.fedVac];
  set[MONS.drone] = mon(anim('drone', 1), { ...hit, newmon: MONS.puff, thru: 0 }, pace(5, 2));
  set[MONS.droneHigh] = mon(anim('drone', 1), { ...hit, newmon: MONS.puff, thru: 0 }, pace(8, 3));
  // the swoop: it hovers three blocks up and drops to the ground, quick, then climbs back slowly; kick it while it is down
  set[MONS.droneSwoop] = mon(
    anim('drone', 1),
    { ...hit, newmon: MONS.puff, thru: 0 },
    [corner(0, 0, 2), corner(0, 3, 3, 0), corner(0, 0, 1, 0)],
  );
  for (let h = 0; h < BAG_HITS; h++) set[MONS.bag + h] = mon(anim(`bag${h}_`, 10 - h * 3), { ...hit, newmon: h + 1 < BAG_HITS ? MONS.bag + h + 1 : MONS.puff });
  for (let i = 0; i < BLOWER_HITS; i++) {
    const lit = 5 - Math.floor((i * 5) / BLOWER_HITS);
    set[MONS.blower + i] = mon(anim(`blower${lit}_`, Math.max(1, 3 - Math.floor(i / 3))), {
      ...hit,
      newmon: i + 1 < BLOWER_HITS ? MONS.blower + i + 1 : MONS.puff,
      upscore: KICK_POINTS * 2,
    });
  }
  for (let h = 0; h < STAKE_HITS; h++) set[MONS.stake + h] = mon(anim(`stake${h}_`, 6), { ...hit, newmon: h + 1 < STAKE_HITS ? MONS.stake + h + 1 : MONS.puff });
  set[MONS.gobblet] = mon(anim('gobblet', 5), { ...hit, newmon: MONS.puff, thru: 0, towards: 1, end: 160 });
  // the loose balloon: four pieces on one path, so they roll as one face; nothing knocks it over. A corner is counted
  // from where the path began, and the world wraps at 100 blocks, so the run goes in two legs (each the short way round)
  for (let i = 0; i < 4; i++) set[MONS.chaser + i] = mon(anim(`chaser${i}_`, 3), { power: 250, thru: 0, end: -1 }, [corner(0, 0, CHASE_SPEED), corner(CHASE_RUN / 2, 0, CHASE_SPEED), corner(CHASE_RUN, 0, CHASE_SPEED)]);
  return set;
}
