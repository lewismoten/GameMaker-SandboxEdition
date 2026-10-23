// Level 7: The Fair Midway, at sunset. Gwinn entered herself in the dog show (number 13!)
// and her entry card blew to the top of THE BIG DROP. The ride takes three tickets, and the
// Klown Klub's booths pay tickets for tricks: ring the High Striker's bell (climb its pegs
// and high five it), sit pretty for Bubbles, spin for Twirly, and sniff under the bleachers.
// The carousel's horses lift Teddy to its canopy, and a trampoline bounces him up to a perch. THE CHEZ is parked by the show barn.
//
// The blocks are in level7Tiles.ts, the monsters in level7Beasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, bandRow, midwayTiles, skyAt } from './level7Tiles';
import { midwayBeasts } from './level7Beasts';

export function midway(): Level {
  const bs = midwayTiles();
  const beasts = midwayBeasts();
  bs.chez(
    () => bs.pic('sky3'),
    'tag',
    bs.pic('sky3'),
    () => bs.pic('sky3'),
  );
  bs.clue('tagDeck', 'tag', 'sky0');
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => skyAt(y));
  for (const [cx, cy] of [
    [8, 26],
    [36, 27],
    [70, 26],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, 'sawdust');
  m.rect(0, G + 1, 100, 59, 'deep');
  for (let x = 1; x < 92; x++) m.set(x, 33, x % 2 ? 'lights0' : 'lights1');

  // The gate.
  for (let bx = 0; bx < 5; bx++) for (let by = 0; by < 2; by++) m.set(2 + bx, 38 + by, `arch${bx}${by}`);
  // The High Striker: pegs up the pole, its bell at the top (a monster).
  for (let y = 29; y < 39; y++) m.set(12, y, `striker${bandRow(y)}`);
  m.set(12, 39, 'strikerBase');
  for (const y of [38, 36, 34, 32, 30]) m.set(11, y, `peg${bandRow(y)}`);
  m.set(14, 38, 'honkerTop').set(14, 39, 'honkerBot');
  // The ring toss and Bubbles.
  for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 3; by++) m.set(18 + bx, 37 + by, `toss${bx}${by}`);
  m.set(23, 38, 'bubblesTop').set(23, 39, 'bubblesBot');
  // The carousel.
  for (let bx = 0; bx < 5; bx++) for (let by = 0; by < 4; by++) m.set(28 + bx, 36 + by, `carousel${bx}${by}`);
  // The spin-to-win wheel and Twirly.
  for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 3; by++) m.set(38 + bx, 37 + by, `wheel${bx}${by}`);
  m.set(42, 38, 'twirlyTop').set(42, 39, 'twirlyBot');
  // THE BIG DROP: the gate (three tickets), the tower, the car's track, the deck up top.
  const tower = 53;
  m.set(tower - 3, 38, 'pratfallTop').set(tower - 3, 39, 'pratfallBot');
  m.set(tower - 2, 39, 'sign3');
  m.set(tower - 1, 39, 'gate');
  for (let y = 26; y < 39; y++) m.set(tower - 1, y, `latticeWall${bandRow(y)}`);
  for (let y = 16; y < 40; y++) {
    m.set(tower, y, `lattice${bandRow(y)}`);
    m.set(tower + 1, y, `track${bandRow(y)}`);
  }
  for (let y = 19; y < 40; y++) m.set(tower + 2, y, `latticeWall${bandRow(y)}`);
  m.rect(tower + 2, 18, 4, 1, 'deck');
  m.rect(tower + 2, 17, 4, 1, 'rail');
  m.set(tower + 4, 17, 'tagDeck');
  m.set(tower + 5, 17, 'signDown');
  m.set(tower - 1, 15, 'dropSign0')
    .set(tower, 15, 'dropSign1')
    .set(tower + 1, 15, 'dropSign2');
  // The trampoline, between Twirly and THE BIG DROP: hop onto its bed and ride the air up
  // to the perch of treats (a detour, never on the way).
  const tramp = 47;
  m.set(tramp, 39, 'trampoline');
  for (let y = 30; y < 39; y++) m.set(tramp, y, `boing${y}a`);
  // (the perch spans the column: Teddy flies up through it and lands on it coming down)
  m.rect(tramp - 1, 29, 3, 1, 'perch');
  // The food row: corn dogs, the root beer stand.
  for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 3; by++) m.set(62 + bx, 37 + by, `food${bx}${by}`);
  m.set(67, 39, 'rootBeer').set(68, 39, 'signRoot');
  // The show barn, THE CHEZ by its door.
  m.rect(80, 32, 12, 8, 'barn');
  m.rect(80, 31, 12, 1, 'barnRoof');
  m.set(83, 34, 'showSign0').set(84, 34, 'showSign1').set(85, 34, 'showSign2');
  const car = 74;
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');
  m.set(car + 3, 37, 'leoWant')
    .set(car + 3, 38, 'leoHead')
    .set(car + 3, 39, 'leoBody');
  m.rect(92, 28, 8, 12, 'hedgeWall');
  m.rect(0, 28, 1, 12, 'hedgeWall');

  // Monsters.
  m.mon(11, 28, 'strikerBell');
  m.mon(22, 38, 'askSit');
  m.mon(43, 39, 'askSpin');
  m.mon(29, 39, 'horse1');
  m.mon(31, 37, 'horse2');
  m.mon(tower + 1, 38, 'dropIdle');
  m.mon(67, 37, 'bee');
  m.mon(35, 39, 'scentTicket');
  for (const [x, y] of [
    [30, 35],
    [tower + 3, 17],
    [11, 26],
  ])
    m.mon(x, y, 'poodle');
  const treats: [number, number][] = [
    [7, 39],
    [9, 39],
    [16, 39],
    [25, 39],
    [27, 39],
    [29, 35],
    [31, 35],
    [34, 39],
    [36, 39],
    [45, 39],
    [49, 39],
    [46, 28],
    [47, 28],
    [48, 28],
    [59, 39],
    [61, 39],
    [65, 39],
    [70, 39],
    [72, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  // one bone by the food row (the second half of the adventure heals less)
  m.treat(62, 36);
  m.treat(64, 36, 'bone');
  m.mark('start', 1, 39);
  m.mark('exit', car, 39);
  return {
    file: 'midway',
    hero: 'teddy',
    title: 'The Fair Midway',
    time: 'sunset',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [26, 35],
    pose: [37, 39, 'frontBeg'],
  };
}
