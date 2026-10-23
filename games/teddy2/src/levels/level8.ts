// Level 8: The Dog Show, at night in the Fair's show barn. Spin through the turnstile into
// the ring, climb the A-frame, go through the tunnel, go round the hoop (Teddy retired from
// hoops), play dead under the popcorn, bark the rival poodle off, ring the judges' bell to
// let down the velvet rope, and there is Gwinn in the Best Behaved ring, wiggling. Sit
// pretty beside her and she SITS. The blue ribbon opens the stage curtain: the Big Show.
//
// The blocks are in level8Tiles.ts, the monsters in level8Beasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, showTiles } from './level8Tiles';
import { showBeasts } from './level8Beasts';

export function show(): Level {
  const bs = showTiles();
  const beasts = showBeasts();
  const m = new LevelMap(bs, beasts, 'wall');
  m.rect(0, 0, 100, 30, 'rafter');
  m.rect(0, 30, 100, 3, (x, y) => ((x + y) % 2 ? 'crowd' : 'crowd2'));
  m.rect(0, 33, 100, 7, 'wall');
  m.rect(0, G, 100, 1, 'ring');
  m.rect(0, G + 1, 100, 59, 'deep');
  for (let bx = 0; bx < 6; bx++) m.set(30 + bx, 34, `banner${bx}`);
  for (const x of [20, 46, 66]) m.set(x - 1, 29, 'spotL').set(x + 1, 29, 'spotR');
  for (const x of [20, 46, 66]) for (let y = 33; y < 40; y++) m.set(x, y, 'spotDown');
  m.rect(0, 30, 1, 10, 'barnWall');
  m.rect(92, 30, 8, 10, 'barnWall');

  // The turnstile into the ring (a monster), rails.
  for (const x of [5, 6, 7, 9, 10]) m.set(x, 39, 'rail');
  // The agility course: the A-frame, the tunnel, the hoop.
  const af = 13;
  m.set(af, 39, 'aframeL').set(af + 1, 38, 'aframeL').set(af + 1, 39, 'aframeT');
  m.set(af + 2, 37, 'aframeL').set(af + 2, 38, 'aframeT').set(af + 2, 39, 'aframeT');
  m.set(af + 3, 37, 'aframeR').set(af + 3, 38, 'aframeT').set(af + 3, 39, 'aframeT');
  m.set(af + 4, 38, 'aframeR').set(af + 4, 39, 'aframeT');
  m.set(af + 5, 39, 'aframeR');
  for (let x = 22; x < 27; x++) m.set(x, 38, 'tunnelTop').set(x, 39, 'tunnel');
  m.set(29, 38, 'hoopTop').set(29, 39, 'hoopBot');
  m.set(28, 37, 'signHoop').set(29, 37, 'signHoopR');
  // The popcorn stand, which pops popcorn across the ring.
  m.set(40, 38, 'popTop').set(40, 39, 'popBot');
  bs.def('popBot').birthMon = beasts.id('popcorn');
  bs.def('popBot').birthTime = 46;
  // The judges' table and bell; the velvet rope (a monster) across the Best Behaved ring.
  m.set(55, 39, 'table').set(56, 39, 'table');
  m.set(57, 38, 'judgeTop').set(57, 39, 'judgeBot');
  m.set(61, 37, 'signBest').set(62, 37, 'signBestR');
  for (const x of [59, 70]) m.set(x, 39, 'rail');
  // The stage, Doc Leo by the curtain; the curtain door is the way out (it takes the ribbon).
  m.rect(76, 39, 16, 1, 'stage');
  m.rect(80, 30, 12, 9, 'curtain');
  m.set(82, 37, 'leoTop').set(82, 38, 'leoBot');
  m.set(85, 38, 'curtainDoor');
  m.set(75, 38, 'signStage');

  // Monsters.
  m.mon(8, 39, 'turnstile');
  m.mon(48, 39, 'rival');
  m.mon(56, 38, 'judgeBell');
  m.mon(58, 39, 'velvet');
  m.mon(64, 38, 'askSit');
  m.mon(65, 39, 'gwinnShow');
  m.mon(25, 37, 'scentBone');
  m.mon(52, 39, 'scentPoodle');
  for (const [x, y] of [
    [16, 35],
    [29, 36],
    [78, 37],
  ])
    m.mon(x, y, 'poodle');
  const treats: [number, number][] = [
    [3, 39],
    [11, 39],
    [12, 39],
    [14, 37],
    [15, 36],
    [17, 36],
    [18, 37],
    [20, 39],
    [23, 39],
    [25, 39],
    [31, 39],
    [33, 39],
    [36, 39],
    [43, 39],
    [45, 39],
    [51, 39],
    [53, 39],
    [61, 39],
    [67, 39],
    [72, 39],
    [74, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', 2, 39);
  m.mark('exit', 85, 38);
  return {
    file: 'show',
    hero: 'teddy',
    title: 'The Dog Show',
    time: 'show',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [54, 35],
    pose: [64, 39, 'frontBeg'],
  };
}
