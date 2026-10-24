// Level 6: MEANWHILE... Doc Leo's Balloons, at noon in the Clown Club's hall. Doc Leo needs
// the big bag of party balloons from the loft under the rafters. His rubber chicken's SQUAWK
// clears the pigeons off the floor; then the new idea: twist a balloon dog (1) and it inflates
// under his shoes and floats him up six blocks, then bobs and pops. Teach: up onto the first
// shelf. Test: from shelf to shelf (a balloon rises through a shelf). Twist: Juggles is up on a
// shelf practicing, and his pins sail across the shaft to the loft now and then: a pin pops a
// balloon (Doc Leo drops back onto the shelf), so ride up between pins. Then the bag, and down
// the shelves on the far side to the back door.
//
// The blocks are in balloonTiles.ts, the monsters in balloonBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, balloonTiles } from './balloonTiles';
import { balloonBeasts } from './balloonBeasts';
import { leoSong } from '../sound/leoSong';

/** Where things are, for the bot's route (the shelves' rows are where they stand). */
export const BALLOON = { pigeons: 7, lift1: 12, lift2: 17, lift3: 24, shelf1: 34, shelf2: 28, loft: 22, bag: 38, door: 54 };

export function balloon(): Level {
  const bs = balloonTiles();
  const beasts = balloonBeasts();
  const m = new LevelMap(bs, beasts, 'wall');
  // the hall: x 1..58, the floor at G, the rafters at row 18
  m.rect(1, 19, 58, G - 19, (_x, y) => (y < 30 ? 'paperHi' : 'paper'));
  m.rect(0, 18, 60, 1, 'rafter');
  m.rect(0, G, 60, 1, 'floor');
  for (let x = 1; x < 59; x++) m.set(x, 19, 'bunting');
  for (const x of [8, 30, 36, 52]) m.set(x, 32, 'window');
  for (const x of [5, 12, 46, 54]) m.set(x, 23, 'windowHi');
  m.set(28, 38, 'rack00').set(29, 38, 'rack10').set(28, 39, 'rack01').set(29, 39, 'rack11');
  m.set(34, 38, 'mirror00').set(34, 39, 'mirror01');
  m.set(41, 38, 'rack00').set(42, 38, 'rack10').set(41, 39, 'rack01').set(42, 39, 'rack11');
  m.set(4, 36, 'poster00').set(5, 36, 'poster10').set(4, 37, 'poster01').set(5, 37, 'poster11');
  m.set(8, 38, 'signSquawkL').set(9, 38, 'signSquawkR');
  m.set(10, 37, 'signBalloonL').set(11, 37, 'signBalloonR');

  // Shelf 1 (row 34), the prop cabinet under shelf 2 (row 28), the loft (row 22).
  m.rect(13, BALLOON.shelf1, 5, 1, 'shelf');
  m.rect(18, BALLOON.shelf2 + 1, 1, G - BALLOON.shelf2 - 1, 'cabinet');
  m.rect(18, BALLOON.shelf2, 7, 1, 'shelfHi');
  for (const x of [14, 16]) m.set(x, BALLOON.shelf1 - 1, x === 14 ? 'box' : 'boxPink');
  m.rect(25, BALLOON.loft + 1, 1, G - BALLOON.loft - 1, 'cabinet');
  m.rect(25, BALLOON.loft, 16, 1, 'loft');
  // Juggles on shelf 2, tossing pins across the shaft over the loft's edge
  m.set(19, 26, 'juggles0Top').set(19, 27, 'juggles0Bot');
  m.set(19, 25, 'pinsUp');
  bs.def('pinsUp').birthMon = beasts.id('pin');
  bs.def('pinsUp').birthTime = 90;
  m.set(21, 25, 'signPinsL').set(22, 25, 'signPinsR');
  m.set(BALLOON.bag, BALLOON.loft - 1, 'balloons');

  // Down the far side: shelves stepping down to the floor, and the back door.
  m.set(41, BALLOON.loft - 1, 'signDown');
  m.rect(41, BALLOON.shelf2, 5, 1, 'shelfHi');
  m.rect(46, BALLOON.shelf1, 5, 1, 'shelf');
  m.set(BALLOON.door, 38, 'door00').set(BALLOON.door, 39, 'door01');
  m.rect(59, 18, 1, G - 18, 'wall');
  m.rect(0, 18, 1, G - 18, 'wall');

  // Monsters.
  m.mon(BALLOON.pigeons, 39, 'pigeon');
  m.mon(BALLOON.pigeons + 2, 39, 'pigeon');
  m.mon(33, 21, 'poodle');
  const treats: [number, number][] = [
    [3, 39],
    [6, 39],
    [15, 33],
    [21, 27],
    [23, 27],
    [27, 21],
    [29, 21],
    [31, 21],
    [35, 21],
    [43, 27],
    [48, 33],
    [52, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', 3, 39);
  m.mark('exit', BALLOON.door, 39);
  return {
    file: 'balloon',
    hero: 'leo',
    title: "Doc Leo's Balloons",
    time: 'noon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [6, 30],
    pose: [12, 39, 'twist1'],
    song: leoSong,
    card: ['MEANWHILE, Doc Leo needs', 'balloons. YOU are Doc Leo!', 'NEW: SPACE SQUAWK  1 BALLOON'],
  };
}
