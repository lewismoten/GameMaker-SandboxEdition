// Level 11's background blocks, the Fairgrounds' funhouse at sunset. Outside: the Fair's gate
// arch, the strings of lights and a booth from the sequel's midway, and Honker by the door.
// Inside: lilac wallpaper, a checkered floor, and the blinking boards. A board is a block
// that animates by itself: solid, then two flashes (it's going!), then gone (a faint outline
// where it was), then a brighter outline (it's coming back), then solid again. The red boards
// and the blue boards keep the same beat half a beat apart (the blue ones wait a while before
// their first board), and a round mirror over each run lights in its color in step with it.
// Under the boards is the ball pit: soft to land in, with a padded step at its near end to
// climb back up by. The spinning barrel is a fast belt (air that pushes right) over a long
// run of red boards: too long to walk across in one beat, quick enough to ride.
import { Pixels } from '../../../kit/pixels';
import { blob, micro, speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { c, canvas, copy, cut, dirt, r, sky } from '../blocks/tiles';
import { wideSign } from './common';
import { art } from './parts';
import { midwayTiles, skyAt as midwaySky } from '../../../teddy2/src/levels/level7Tiles';

export const G = 40;
/** The funhouse's ceiling row (its roof is the row above). */
export const CEIL = 31;
/** The ball pit's floor row (a fallen Teddy walks on the row above it). */
export const PIT = 44;
export const skyAt = midwaySky;
/** The blinking boards' beat, in game ticks: solid, two flashes, gone, coming back. */
export const BEAT = { on: 26, flash: 4, gone: 10, coming: 4 };
/** How long the blue boards wait before their first board: half a beat behind the red. */
export const BLUE_WAIT = 24;
export const PERIOD = BEAT.on + 2 * BEAT.flash + BEAT.gone + BEAT.coming;

/** Lilac wallpaper (the sequel's wallpaper() only knows the sequel's colors): stars or diamonds. */
function paperOf(pattern: 'stars' | 'diamonds', seed: number): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r('lilac'), 2, 1, seed, 0.08);
  if (pattern === 'diamonds')
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y) % 10 === 0 || (x - y + 20) % 10 === 0) p.set(x, y, c('lilac', 1));
  if (pattern === 'stars')
    for (const [x, y] of [
      [5, 5],
      [15, 15],
    ])
      p.set(x, y - 1, c('yellow', 3))
        .set(x - 1, y, c('yellow', 3))
        .set(x, y, c('yellow', 3))
        .set(x + 1, y, c('yellow', 3))
        .set(x, y + 1, c('yellow', 3));
  return p;
}

export function funhouseTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  // The sequel's midway, borrowed as it is: its sawdust, lights, gate arch, a booth and Honker.
  const mid = midwayTiles();
  t.wall('sawdust', mid.pic('sawdust'));
  t.wall('deep', dirt(5, true));
  for (const ph of [0, 1]) t.air(`lights${ph}`, mid.pic(`lights${ph}`), { next: `lights${1 - ph}`, ntime: 9 });
  for (let bx = 0; bx < 5; bx++) for (let by = 0; by < 2; by++) t.air(`arch${bx}${by}`, mid.pic(`arch${bx}${by}`));
  for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 3; by++) t.air(`toss${bx}${by}`, mid.pic(`toss${bx}${by}`));
  t.air('honkerTop', mid.pic('honkerTop'));
  t.air('honkerBot', mid.pic('honkerBot'));
  t.wall('edge', mid.pic('sawdust'));

  // The funhouse: striped front, a scalloped roof, its sign, the doorways.
  const front = new Pixels(20, 20, c('lilac', 2));
  for (let x = 0; x < 20; x += 8) front.rect(x, 0, 4, 20, c('pink', 2));
  front.rect(0, 0, 1, 20, c('ink', 0)).rect(19, 0, 1, 20, c('ink', 0));
  t.wall('front', front);
  const roof = (() => {
    const p = copy(sky(1));
    p.rect(0, 8, 20, 12, c('lilac', 1));
    for (let x = 0; x < 20; x += 10) blob(p, x + 5, 8, 5, 3, [c('yellow', 2), c('yellow', 3)], 0, 1);
    return p;
  })();
  t.wall('roof', roof);
  art(
    t,
    'sFun',
    4,
    1,
    () => sky(1),
    (p) => {
      p.rect(2, 2, 76, 16, c('lilac', 1)).frame(2, 2, 76, 16, c('yellow', 3));
      for (let x = 5; x < 76; x += 6) p.set(x, 3, c('glow', 3)).set(x, 16, c('glow', 3));
      micro(p, 40 - 21, 7, 'THE  FUNHOUSE', c('yellow', 3));
    },
  );
  const paper = paperOf('stars', 3);
  t.air('paper', paper);
  t.air(
    'doorway',
    (() => {
      const p = new Pixels(20, 20, c('lilac', 0));
      p.rect(0, 0, 2, 20, c('yellow', 2)).rect(18, 0, 2, 20, c('yellow', 2));
      return p;
    })(),
  );
  t.wall('ceiling', paperOf('diamonds', 4));
  // the checkered floor, and the dark under it
  const floor = new Pixels(20, 20, c('lilac', 0));
  for (let x = 0; x < 20; x += 10) floor.rect(x, 0, 5, 5, c('paint', 3)).rect(x + 5, 0, 5, 5, c('ink', 0));
  floor.rect(0, 5, 20, 1, c('yellow', 2));
  t.wall('floor', floor);
  const under = new Pixels(20, 20, c('lilac', 1));
  under.rect(0, 0, 20, 1, c('lilac', 0)).rect(0, 10, 20, 1, c('lilac', 0)).rect(5, 0, 1, 10, c('lilac', 0)).rect(15, 10, 1, 10, c('lilac', 0));
  t.wall('under', under);

  // The ball pit: the dark in it, the balls, its floor, the padded step, the pillars.
  const pit = new Pixels(20, 20, c('lilac', 0));
  for (let y = 2; y < 20; y += 6) pit.set(4 + (y % 7), y, c('lilac', 1));
  t.air('pit', pit);
  const balls = copy(pit);
  const cols = ['red', 'yellow', 'blue', 'green', 'pink'];
  for (let i = 0; i < 7; i++) balls.disc(2 + ((i * 7) % 18), 15 - (i % 2) * 4, 3, c(cols[i % 5], 2));
  t.air('balls', balls);
  t.wall(
    'pitFloor',
    (() => {
      const p = new Pixels(20, 20, c('lilac', 0));
      for (let i = 0; i < 10; i++) p.disc(1 + ((i * 9) % 19), 3 + (i % 3) * 5, 3, c(cols[i % 5], 1));
      return p;
    })(),
  );
  t.wall(
    'step',
    (() => {
      const p = copy(balls);
      p.rect(1, 2, 18, 18, c('yellow', 2)).frame(1, 2, 18, 18, c('ink', 0)).rect(2, 3, 16, 2, c('yellow', 3));
      micro(p, 6, 9, 'UP', c('ink', 0));
      return p;
    })(),
  );
  t.wall(
    'pillar',
    (() => {
      const p = new Pixels(20, 20, c('yellow', 2));
      for (let y = 0; y < 20; y += 5) p.rect(0, y, 20, 2, c('red', 2));
      p.rect(0, 0, 1, 20, c('ink', 0)).rect(19, 0, 1, 20, c('ink', 0));
      return p;
    })(),
  );
  t.wall(
    'pillarTop',
    (() => {
      const p = copy(t.pic('pillar'));
      p.rect(0, 0, 20, 4, c('paint', 3)).rect(0, 4, 20, 1, c('ink', 0));
      return p;
    })(),
  );

  // The blinking boards and their mirrors, in two colors on one beat.
  for (const [fam, ramp] of [
    ['red', 'red'],
    ['blue', 'blue'],
  ] as const) {
    const board = (flash: number, under = pit) => {
      const p = copy(under);
      const face = flash === 1 ? c('paint', 3) : flash === 2 ? c(ramp, 1) : c(ramp, 2);
      p.rect(0, 0, 20, 6, face)
        .rect(0, 0, 20, 1, flash === 1 ? c('paint', 3) : c(ramp, 3))
        .rect(0, 6, 20, 1, c('ink', 0));
      for (const x of [4, 15]) p.rect(x, 2, 1, 2, c('ink', 0));
      return p;
    };
    const outline = (bright: boolean, under = pit) => {
      const p = copy(under);
      for (let x = 0; x < 20; x += bright ? 2 : 4) p.set(x, 0, c(ramp, bright ? 3 : 1)).set(x, 6, c(ramp, bright ? 3 : 1));
      return p;
    };
    t.ledge(`${fam}On`, board(0), { next: `${fam}Flash1`, ntime: BEAT.on });
    t.ledge(`${fam}Flash1`, board(1), { next: `${fam}Flash2`, ntime: BEAT.flash });
    t.ledge(`${fam}Flash2`, board(2), { next: `${fam}Gone`, ntime: BEAT.flash });
    t.air(`${fam}Gone`, outline(false), { next: `${fam}Coming`, ntime: BEAT.gone });
    t.air(`${fam}Coming`, outline(true), { next: `${fam}On`, ntime: BEAT.coming });
    // the same boards as steps on the wall (a chain of their own, in step with the pit's)
    t.ledge(`${fam}StepOn`, board(0, paper), { next: `${fam}StepFlash1`, ntime: BEAT.on });
    t.ledge(`${fam}StepFlash1`, board(1, paper), { next: `${fam}StepFlash2`, ntime: BEAT.flash });
    t.ledge(`${fam}StepFlash2`, board(2, paper), { next: `${fam}StepGone`, ntime: BEAT.flash });
    t.air(`${fam}StepGone`, outline(false, paper), { next: `${fam}StepComing`, ntime: BEAT.gone });
    t.air(`${fam}StepComing`, outline(true, paper), { next: `${fam}StepOn`, ntime: BEAT.coming });
    // the round mirror on the wall over each run, lit in its color while its boards are there
    const mirror = (lit: number) => {
      const p = copy(paper);
      p.disc(10, 10, 8, c('gold', 1)).disc(10, 10, 6, lit === 2 ? c(ramp, 3) : lit === 1 ? c('paint', 3) : lit === 3 ? c(ramp, 1) : c('metal', 1));
      p.set(7, 7, c('paint', 3)).set(8, 6, c('paint', 3));
      return p;
    };
    t.air(`${fam}MirOn`, mirror(2), { next: `${fam}MirFlash1`, ntime: BEAT.on });
    t.air(`${fam}MirFlash1`, mirror(1), { next: `${fam}MirFlash2`, ntime: BEAT.flash });
    t.air(`${fam}MirFlash2`, mirror(2), { next: `${fam}MirGone`, ntime: BEAT.flash });
    t.air(`${fam}MirGone`, mirror(0), { next: `${fam}MirComing`, ntime: BEAT.gone });
    t.air(`${fam}MirComing`, mirror(3), { next: `${fam}MirOn`, ntime: BEAT.coming });
  }
  // The blue boards' and mirrors' first wait (placed on the map; they never come back to it).
  t.air('blueWait', t.pic('blueGone'), { next: 'blueOn', ntime: BLUE_WAIT });
  t.air('blueMirWait', t.pic('blueMirGone'), { next: 'blueMirOn', ntime: BLUE_WAIT });
  t.air('blueStepWait', t.pic('blueStepGone'), { next: 'blueStepOn', ntime: BLUE_WAIT });

  // The spinning barrel: hoops turning over the boards (three rows; the bottom row pushes).
  for (const ph of [0, 1]) {
    const b = canvas(1, 3, () => paper);
    for (let y = 0; y < 60; y++) {
      const s = (y + ph * 5) % 10;
      if (s < 2) b.rect(0, y, 20, 1, c('orange', 2));
    }
    b.rect(0, 0, 20, 3, c('orange', 3)).rect(0, 0, 20, 1, c('ink', 0));
    for (let x = 0; x < 20; x += 10) b.rect(x + ph * 5, 3, 2, 57, c('orange', 1));
    const bc = cut(b);
    t.air(`barrelTop${ph}`, bc[0][0], { next: `barrelTop${1 - ph}`, ntime: 2 });
    t.air(`barrelMid${ph}`, bc[1][0], { next: `barrelMid${1 - ph}`, ntime: 2 });
    t.air(`barrel${ph}`, bc[2][0], { grav: GRAV.right | GRAV.down, next: `barrel${1 - ph}`, ntime: 2 });
  }

  // The balcony the blinking stairs climb to (stand on it, hop up through it).
  t.ledge(
    'balcony',
    (() => {
      const p = copy(paper);
      p.rect(0, 0, 20, 4, c('yellow', 2)).rect(0, 0, 20, 1, c('yellow', 3)).rect(0, 4, 20, 1, c('ink', 0));
      for (let x = 3; x < 20; x += 6) p.rect(x, 5, 2, 15, c('wood', 1));
      return p;
    })(),
  );

  // The prize stand up on the balcony, with the party horns on its counter.
  art(
    t,
    'stand',
    3,
    2,
    () => paper,
    (p) => {
      for (let x = 0; x < 60; x++) p.rect(x, 0, 1, 8, (x >> 2) % 2 ? c('paint', 3) : c('lilac', 2));
      p.rect(2, 8, 3, 32, c('wood', 1)).rect(55, 8, 3, 32, c('wood', 1));
      micro(p, 30 - 13, 12, 'PRIZES', c('yellow', 3));
      p.rect(0, 30, 60, 10, c('lilac', 1)).rect(0, 30, 60, 2, c('lilac', 3));
    },
  );
  t.clue('horns', 'horns', 'paper');

  // Signs.
  const signs: [string, string, Pixels][] = [
    ['Blink', 'BOARDS\nBLINK!', paper],
    ['Beat', 'RED, THEN\nBLUE', paper],
    ['Barrel', 'RIDE THE\nBARREL', paper],
    ['Fun', 'FUN\nHOUSE', sky(2)],
  ];
  for (const [name, words, base] of signs) {
    const [l, r] = wideSign(base, words);
    t.air(`sign${name}L`, l);
    t.air(`sign${name}R`, r);
  }
  return t;
}
