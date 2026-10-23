// THE HIVE's map: the avenue outside, the castle front, the counter, the little movie theater
// past it, the stairs and the tall front room downstairs, and upstairs the seating and the
// stage. Every intermission is a scene on this one map: the first starts out on the avenue, the
// others up on the stage, where the poet comes off after a set; each one's curtain leads to the
// next set (or, after the last, to the bow).
import { MON } from '../ids';
import type { MapBuilder } from '../common/maps';
import { placePicture } from '../common/picture';

export const HIVE_W = 80;
export const HIVE_H = 16;
/** Where the poet starts: out on the avenue, or on the stage. */
export const HIVE_STREET: [number, number] = [1, 13];
export const HIVE_STAGE: [number, number] = [32, 5];
/** The curtain (the link to the next set). */
export const CURTAIN: [number, number] = [22, 5];

export function buildHive(m: MapBuilder): void {
  // ---------------- outside: the avenue at night
  for (let x = 0; x <= 18; x++) {
    for (let y = 0; y <= 13; y++) m.set(x, y, (x + y) % 3 ? 'night' : 'night2');
    m.set(x, 10, 'city2').set(x, 11, 'cityLow').set(x, 12, 'cityLow').set(x, 13, 'cityLow');
    if (x % 5 === 2) m.set(x, 9, 'city');
    m.set(x, 14, 'sidewalk').set(x, 15, 'sidewalk');
  }
  m.col(6, 10, 13, 'post').set(6, 9, 'lantern');
  // the castle's long front along the avenue: battlements, lit windows, stone
  for (let x = 11; x <= 16; x++) {
    m.set(x, 4, 'merlonBack');
    for (let y = 5; y <= 13; y++) m.set(x, y, (x + y) % 2 ? 'stoneBack' : 'stoneBack2');
  }
  for (const x of [12, 15]) m.set(x, 7, 'castleWindow').set(x, 11, 'castleWindow');
  m.set(9, 13, 'bench').set(14, 13, 'news');
  m.set(3, 13, 'coin@night').set(9, 12, 'coin@night').set(14, 12, 'bill@stoneBack2');
  // the castle front: a turret, the battlements, the wall with its arrow slits, the sign, the arched door
  m.set(17, 0, 'turretCap').set(17, 1, 'turretTop').col(17, 2, 13, 'turret').set(18, 0, 'night').set(18, 1, 'night');
  m.col(18, 2, 13, 'turret');
  m.set(19, 1, 'merlon').set(20, 1, 'merlon').set(19, 0, 'night').set(20, 0, 'night');
  m.col(19, 2, 11, 'stone').col(20, 2, 11, 'stone2');
  m.set(19, 4, 'slit').set(20, 7, 'slit');
  m.set(19, 10, 'sign.0.0').set(20, 10, 'sign.1.0');
  m.set(19, 12, 'archTop').set(20, 12, 'archTop').set(19, 13, 'arch').set(20, 13, 'arch');
  m.row(14, 19, 20, 'floor').row(15, 19, 20, 'under');

  // ---------------- inside: the shell
  m.row(0, 21, HIVE_W - 1, 'beam');
  m.row(14, 21, HIVE_W - 1, 'floor').row(15, 21, HIVE_W - 1, 'under');
  for (let x = 21; x < HIVE_W; x++) for (let y = 1; y <= 13; y++) m.set(x, y, y === 13 ? 'wall' : 'wallHi');

  // ---------------- upstairs (x 21..57, floor on row 7): the stage, then the seating
  m.row(7, 21, 57, 'floor');
  for (let x = 21; x <= 33; x++) for (let y = 1; y <= 5; y++) m.set(x, y, x >= 26 && x <= 29 ? 'drapeLit' : 'drape');
  m.row(6, 21, 32, 'stage').set(33, 6, 'footlights');
  m.set(CURTAIN[0], CURTAIN[1], 'curtain').set(CURTAIN[0], CURTAIN[1] - 1, 'drapeLit');
  m.set(27, 5, 'mic').set(24, 3, 'openMic').set(31, 5, 'easel');
  m.set(26, 0, 'spotCan').set(30, 0, 'spotCan');
  m.set(25, 5, 'coin@drape').set(30, 3, 'coin@drape');
  m.link(CURTAIN[0], CURTAIN[1], 'next');
  m.mon(MON.leo, 28, 5);
  // the seating: tables, a couch, the lamps, posters; the third goat at a table with a latte
  m.set(40, 1, 'pendant').set(48, 1, 'pendant').set(36, 3, 'poster').set(54, 3, 'poster2');
  m.set(38, 6, 'table').set(44, 6, 'table').set(52, 6, 'table');
  m.set(40, 6, 'couchArm').row(6, 41, 42, 'couch').set(43, 6, 'couchArm');
  m.set(36, 6, 'coin@wall').set(41, 4, 'coin@wallHi').set(50, 6, 'mug@wall').set(52, 4, 'bill@wallHi').set(56, 6, 'coin@wall');
  m.mon(MON.goat, 47, 6);
  m.mon(MON.carl, 34, 3);

  // ---------------- downstairs under the seating (rows 8..13)
  // the counter: the espresso machine, the pastry case, the tip jar, the register
  m.set(22, 13, 'counter');
  placePicture(m, 'espresso0', 23, 13, 2, 1);
  m.set(25, 13, 'counter').set(26, 13, 'pastry').set(27, 13, 'pastry').set(28, 13, 'counter').set(29, 13, 'jar').set(30, 13, 'counter').set(31, 13, 'register').row(13, 32, 33, 'counter');
  m.set(24, 10, 'menu').set(26, 10, 'menu2').set(29, 8, 'pendant');
  // the little movie theater past the counter: the screen, the seats up the rake, the booth
  m.set(34, 13, 'doorway').set(34, 12, 'doorTop');
  for (let x = 35; x <= 50; x++) for (let y = 8; y <= 13; y++) m.set(x, y, 'dark');
  placePicture(m, 'film0', 36, 9, 3, 2);
  m.row(13, 40, 41, 'seat').set(41, 13, 'seatShush');
  m.row(13, 43, 44, 'riser').row(12, 43, 44, 'seat').set(44, 12, 'seatShush');
  m.fill(46, 12, 2, 2, 'riser').row(11, 46, 47, 'seat').set(46, 11, 'seatShush');
  m.fill(48, 11, 3, 3, 'riser');
  m.row(9, 44, 47, 'projBeam').set(43, 10, 'projBeam');
  m.set(42, 13, 'coin@dark').set(45, 11, 'coin@dark').set(49, 10, 'bill@dark');
  m.mon(MON.teddy, 38, 13);
  // the hall to the stairs: brick, posters
  for (let x = 51; x <= 57; x++) for (let y = 8; y <= 13; y++) m.set(x, y, 'brickWall');
  m.set(52, 10, 'poster').set(55, 10, 'poster2');
  m.set(53, 13, 'coin@brickWall').set(56, 13, 'coin@brickWall');
  // the stairs up to the seating, open treads (ledges: walk under them, hop up through them):
  // col 58 is the top tread (row 7, level with the floor upstairs), col 64 the bottom (row 13)
  for (let i = 0; i <= 6; i++) m.set(58 + i, 7 + i, 'stair');
  m.set(57, 6, 'newel');
  // the tall front room: windows onto the avenue, a couch, Gwinn asleep, a bookshelf
  for (const x of [67, 72, 77]) m.set(x, 12, 'windowTop').set(x, 13, 'window');
  m.set(69, 2, 'pendant').set(75, 2, 'pendant');
  m.set(68, 13, 'couchArm').row(13, 69, 70, 'couch').set(71, 13, 'couchArm');
  m.mon(MON.gwinn, 74, 13);
  m.set(76, 13, 'table');
  m.col(79, 9, 12, 'books').set(79, 13, 'books2');
  m.set(69, 11, 'coin@wallHi').set(70, 11, 'coin@wallHi').set(78, 13, 'mug@wall').set(73, 10, 'bill@wallHi').set(66, 13, 'coin@wall');
}
