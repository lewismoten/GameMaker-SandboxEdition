// Level 3: Puddlewick Park, on a spring morning (where Teddy sat pretty for the kids in the
// first adventure). Doc Leo wants the streamers off a kite stuck in the big oak. The new idea
// is the see-saw: its ends go up and down by themselves (there are kids at the other ends),
// and an end is solid, so Teddy can ride one up: wait on the little step beside it, and walk
// on when it comes down level with the step. Teach: ride the low end up over the hedge.
// Test: two see-saws in the duck pond, rider to rider, and on to the high bank (fall in and
// the water floats Teddy up and drifts him back to the near bank). Twist: Juggles' super
// see-saw shoots its end way up into the oak; a squirrel on the branch, the streamers. Then
// down, under the flying discs (play dead), to THE CHEZ.
//
// The blocks are in parkTiles.ts, the monsters in parkBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, parkTiles } from './parkTiles';
import { parkBeasts } from './parkBeasts';
import { bandAt } from './common';
import { parkSong } from '../sound/music';

/** Where things are, for the bot's route. */
/** A see-saw end's lowest row: a block over the lawn, so it never comes down on Teddy. */
const LOW = 38;

export const PARK = { sawA: 15, hedge: 16, bank: 20, sawB: 21, sawC: 24, highBank: 27, superSaw: 42, branch: 43, streamers: 45, disc: 56, car: 60 };

export function park(): Level {
  const bs = parkTiles();
  const beasts = parkBeasts();
  bs.chez(
    (_bx, by) => (by ? bs.pic('lawn') : bs.pic('far')),
    'streamers',
    bs.pic('farTop'),
    (by) => (by ? bs.pic('lawn') : bs.pic('far')),
  );
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => `sky${bandAt(y, G)}`);
  for (const [cx, cy] of [
    [4, 27],
    [20, 25],
    [56, 23],
    [70, 24],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, 37, 100, 1, 'farTop');
  m.rect(0, 38, 100, 1, 'far');
  m.rect(0, 39, 100, 1, 'lawn');
  m.rect(0, G, 100, 1, 'grass');
  m.rect(0, G + 1, 100, 3, 'dirt');
  m.rect(0, G + 4, 100, 100 - G - 4, 'deep');
  for (const x of [3, 9, 19, 38, 53]) m.set(x, 39, 'lawnFlower');

  // The bench and the lamppost by the gate.
  m.set(4, 39, 'bench00').set(5, 39, 'bench10');
  for (let by = 0; by < 3; by++) m.set(7, 37 + by, `lamp0${by}`);

  // See-saw A: ride the right end up over the hedge.
  m.set(10, 39, 'signLowL').set(11, 39, 'signLowR');
  m.set(PARK.sawA - 2, 39, 'fulcrum').set(PARK.sawA - 1, 39, 'fulcrum');
  m.mon(PARK.sawA - 3, LOW, 'kidUp');
  m.mon(PARK.sawA, LOW - 3, 'sawDown');
  m.set(PARK.sawA - 1, LOW, 'step');
  m.mon(PARK.sawA - 2, 39, 'plankA_0').mon(PARK.sawA - 1, 39, 'plankA_1');
  for (let y = 36; y < 40; y++) m.set(PARK.hedge, y, 'hedgeWall').set(PARK.hedge + 1, y, 'hedgeWall');
  m.set(PARK.hedge, 35, 'hedgeTop').set(PARK.hedge + 1, 35, 'hedgeTop');

  // The duck pond: two see-saws, rider ends on the right, to the high bank.
  const p0 = PARK.bank + 1;
  const p1 = PARK.highBank - 1;
  for (let x = p0; x <= p1; x++)
    m.set(x, G, 'pondTop')
      .set(x, G + 1, 'pond')
      .set(x, G + 2, 'pondBed');
  m.set(PARK.bank, LOW, 'step');
  for (const rider of [PARK.sawB, PARK.sawC]) {
    m.set(rider + 1, G, 'rock').set(rider + 1, 39, 'fulcrum');
    m.mon(rider + 1, 39, 'plank_0');
    m.mon(rider + 2, LOW - 3, 'kidDown');
    m.mon(rider, LOW, 'sawUp');
  }
  m.mon(22, G, 'duck');
  m.rect(PARK.highBank, 35, 10, 1, 'grass');
  m.rect(PARK.highBank, 36, 10, 4, 'dirt');

  // The oak, Juggles' super see-saw, the kite and the streamers up on the branch.
  const s = PARK.superSaw;
  m.set(s - 3, 39, 'signSuperL').set(s - 2, 39, 'signSuperR');
  m.set(s - 1, LOW, 'step');
  m.set(s + 1, 39, 'fulcrum');
  m.set(s + 2, 38, 'juggles0Top').set(s + 2, 39, 'juggles0Bot');
  m.mon(s, LOW, 'sawSuper');
  for (let x = 40; x <= 52; x++) for (let y = 26; y <= 31; y++) m.set(x, y, `leaf${bandAt(y, G)}`);
  for (const [x, y] of [
    [40, 26],
    [52, 26],
    [40, 31],
    [52, 31],
  ])
    m.set(x, y, `sky${bandAt(y, G)}`);
  for (let y = 32; y < 40; y++) m.set(48, y, y < 37 ? `trunkSky${bandAt(y, G)}` : y === 37 ? 'trunk' : y === 38 ? 'trunkFar' : 'trunkLawn');
  for (let x = PARK.branch; x < 48; x++) m.set(x, 32, `branch${bandAt(32, G)}`);
  m.set(44, 30, 'kite');
  m.set(PARK.streamers, 31, 'streamers');
  m.set(49, 34, 'branchBare').set(51, 36, 'branchBare');

  // The disc kid, and THE CHEZ with Doc Leo.
  m.set(52, 39, 'signDeadL').set(53, 39, 'signDeadR');
  m.set(PARK.disc, 39, 'discKid');
  bs.def('discKid').birthMon = beasts.id('disc');
  bs.def('discKid').birthTime = 46;
  const car = PARK.car;
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');
  m.set(car + 3, 37, 'leoWant')
    .set(car + 3, 38, 'leoHead')
    .set(car + 3, 39, 'leoBody');
  // the park's hedge closes it off at both ends (the map wraps around)
  m.rect(66, 30, 34, 10, 'edgeHedge');
  m.rect(66, 29, 34, 1, 'edgeHedgeTop');
  m.rect(0, 30, 1, 10, 'edgeHedge');
  m.set(0, 29, 'edgeHedgeTop');

  // Monsters.
  m.mon(45, 31, 'squirrel');
  m.mon(25, 32, 'poodle');
  const treats: [number, number][] = [
    [6, 39],
    [9, 39],
    [16, 34],
    [17, 34],
    [19, 39],
    [22, 33],
    [30, 34],
    [32, 34],
    [34, 34],
    [38, 39],
    [43, 31],
    [46, 31],
    [50, 39],
    [55, 39],
    [58, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.treat(35, 34, 'bone');
  m.mark('start', 2, 39);
  m.mark('exit', car, 39);
  return {
    file: 'park',
    hero: 'teddy',
    title: 'Puddlewick Park',
    time: 'morning',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [18, 34],
    pose: [23, 38, 'frontHop'],
    song: parkSong,
    card: ['Streamers! Off the kite in', 'the big oak. Ride a see-saw.', 'NEW: SEE-SAWS GO UP AND DOWN'],
  };
}
