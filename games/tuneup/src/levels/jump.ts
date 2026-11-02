// Level 1, Jump Start (the garage at dawn). THE CHEZ's battery is flat. A tutorial through the
// garage: walk, hop (Up, or Q and E sideways) and Space. The red clamp waits up on the shelf,
// the black clamp under the workbench; each opens its own terminal (a door that takes its
// clamp). Then Doc Leo cranks: Space held under the crank's handle turns it a notch each reach,
// and its gauge fills, eight notches. The last one plays "Charge!" and the headlight door opens.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { CHEZ_LAMP, chezPicture } from '../../../kit/chez';
import { AIR, countedDoor, kit, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { teddyInWindow } from '../art/chezTeddy';
import { CTR, MON } from '../ids';
import { addFork, glint } from '../blocks/fork';
import { decorate } from './decor';
import { MapBuilder, at, type Level } from './maps';

/** Notches on the crank's gauge. */
export const NOTCHES = 8;
/** Ticks the crank shows a notch turning before the next can be turned. */
const TURN = 6;
/** Where things are (level blocks). */
export const JUMP = {
  w: 44,
  floor: 8,
  red: [23, 2] as [number, number],
  /** The secret: the shelf runs on past the red clamp, a glint over its end, a tuning fork on it. */
  fork: [28, 2] as [number, number],
  black: [16, 7] as [number, number],
  redDoor: 26,
  blackDoor: 29,
  crank: 32,
  drum: 34,
  /** THE CHEZ, parked facing left at the garage's end: its box's left column and top row. */
  car: [36, 5] as [number, number],
  /** The headlight: the block of the car Doc Leo bumps into, shut until the battery is charged. */
  lamp: [37, 6] as [number, number],
  exit: 39,
} as const;
/** The car's size in blocks (scale 3: 120 x 60). */
const CAR = [6, 3] as const;

export function jumpBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'garage');
  const { book, c, R } = k;
  // the clamps: a jumper cable's jaws, red and black, glinting
  const clamp = (red: boolean, glint: boolean) => {
    const p = k.pic('wall');
    const ink = c('ink', 0);
    const jaw = red ? R('red') : R('ink').concat(R('asphalt'));
    // the cable coiled behind
    for (let r = 3; r <= 5; r++) p.ring(12, 13, r, red ? c('red', 0) : c('asphalt', 0));
    // the jaws: two teeth-edged arms and the spring
    p.rect(3, 6, 10, 3, jaw[2] ?? jaw[1])
      .rect(3, 10, 10, 3, jaw[1])
      .rect(11, 5, 4, 9, jaw[2] ?? jaw[1]);
    for (let x = 3; x < 11; x += 2) p.set(x, 9, c('metal', 4));
    p.frame(3, 6, 10, 3, ink).frame(3, 10, 10, 3, ink).frame(11, 5, 4, 9, ink);
    if (glint) p.set(5, 7, c('cloud', 2)).set(6, 7, c('cloud', 2));
    return p;
  };
  for (const [id, red, ctr] of [
    ['red', true, CTR.red],
    ['black', false, CTR.black],
  ] as const) {
    const back = id === 'red' ? 'wall' : 'wall';
    const hit = { effect: ctr, eamt: 1, score: 50, touch: back, ntime: 8 };
    book.add(`clamp.${id}`, clamp(red, false), { ...AIR, ...hit, next: `clamp.${id}.1` });
    book.add(`clamp.${id}.1`, clamp(red, true), { ...AIR, ...hit, next: `clamp.${id}` });
  }
  // the terminals: a door each, shut until its clamp is clipped on
  const terminal = (red: boolean) => (p: Pixels) => {
    p.rect(6, 6, 8, 6, red ? c('red', 2) : c('asphalt', 1)).frame(6, 6, 8, 6, c('ink', 0));
    p.rect(8, 8, 4, 1, c('cloud', 2));
    if (red) p.rect(9, 7, 1, 3, c('cloud', 2));
  };
  countedDoor(k, 'term.red', 'wall', CTR.red, 1, terminal(true));
  countedDoor(k, 'term.black', 'wall', CTR.black, 1, terminal(false));
  // the crank: a handle hanging over the floor, and its gauge filling a notch a turn
  const crank = (n: number, turned: boolean) => {
    const p = k.pic('wall');
    // the gauge: eight tall cells across the top half, lit up to n (green when full)
    p.rect(0, 0, 20, 11, c('ink', 0));
    for (let i = 0; i < NOTCHES; i++)
      p.rect(1 + i * 2 + Math.floor(i / 4) * 2, 1, 2, 9, i < n ? c(n === NOTCHES ? 'green' : 'yellow', 2 + (i % 2)) : c('shade', 1));
    // the axle and the handle, turned a half between notches
    p.disc(10, 15, 2.4, c('mach', 4)).disc(10, 15, 1, c('ink', 0));
    if (turned) p.rect(10, 14, 8, 2, c('mach', 3)).rect(16, 14, 3, 6, c('accent', 2));
    else p.rect(2, 14, 8, 2, c('mach', 3)).rect(1, 14, 3, 6, c('accent', 2));
    return p;
  };
  for (let n = 0; n < NOTCHES; n++) {
    const last = n === NOTCHES - 1;
    // a notch: a ratchet click (score up); the last fills the battery and plays "Charge!" (hit points up)
    const turn = last ? { hp: 1, effect: CTR.charge, eamt: 1, score: 100 } : { score: 10 };
    book.add(`crank${n}`, crank(n, false), { ...AIR, ...turn, touch: `crank${n}.t` });
    book.add(`crank${n}.t`, crank(n + 1, true), { ...AIR, ntime: TURN, next: last ? 'crank.full' : `crank${n + 1}` });
  }
  book.add('crank.full', crank(NOTCHES, false), AIR);
  addFork(k, 'wall');
  glint(k, 'wall');
  // the way out: THE CHEZ itself, parked at the end of the garage facing left (the passenger side,
  // Teddy at the door window), drawn over the wall a block at a time. Its headlight is shut (a
  // solid block, its lens dark) until the battery is charged; touched then, it lights and opens.
  const car = chezPicture(
    {
      body: [c('red', 1), c('red', 2), c('red', 3)],
      trim: c('red', 0),
      glass: [c('siding', 0), c('sky', 4)],
      roof: c('ink', 0),
      tire: c('ink', 0),
      hub: c('metal', 4),
      rim: c('paint', 3),
      stripe: c('asphalt', 1),
      pin: c('paint', 3),
      bumper: c('ink', 1),
      lamp: c('orange', 3),
      tail: c('red', 3),
      lens: c('asphalt', 1),
      outline: c('ink', 0),
    },
    'left',
    3,
  );
  // Teddy in the front passenger seat, his head in the door window
  teddyInWindow(car, 0, 0, 3);
  const carBlock = (bx: number, by: number, lit = false) => {
    const p = k.pic('wall');
    p.blit(car.crop(bx * 20, by * 20, 20, 20), 0, 0, 255);
    if (lit) {
      // the lens, lit, and its beam
      const lx = Math.round(40 * 3 - CHEZ_LAMP[0] * 3) - bx * 20;
      const ly = Math.round(CHEZ_LAMP[1] * 3) - by * 20;
      p.disc(lx, ly, 3, c('lamp', 4)).disc(lx, ly, 1.5, c('cloud', 2));
      for (let i = 4; i < 9; i++) p.set(lx - i, ly - 1, c('lamp', 3)).set(lx - i, ly + 1, c('lamp', 3));
    }
    return p;
  };
  for (let by = 0; by < CAR[1]; by++)
    for (let bx = 0; bx < CAR[0]; bx++) {
      const at = [JUMP.car[0] + bx, JUMP.car[1] + by];
      if (at[0] === JUMP.lamp[0] && at[1] === JUMP.lamp[1]) {
        book.add('headlight', carBlock(bx, by), { solid: SOLID, effect: CTR.charge, eamt: -1, touch: 'headlight.on' });
        book.add('headlight.on', carBlock(bx, by, true), AIR);
      } else book.add(`car${bx}.${by}`, carBlock(bx, by), AIR);
    }
  return k;
}

const LEGEND: Record<string, string> = {
  '.': 'wall',
  p: 'wall.pegs',
  w: 'window',
  '=': 'floor',
  '#': 'slab',
  B: 'bench',
  L: 'bench.legs',
  s: 'shelf',
  o: 'tire',
  D: 'drum',
  C: 'chest',
};

export function jump(book: Kit['book']): Level {
  const { w, floor } = JUMP;
  const m = new MapBuilder(book, LEGEND, 'slab');
  m.fill(0, 0, w, floor, '.')
    .fill(0, floor, w, 1, '=')
    .fill(0, floor + 1, w, 1, '#');
  for (const x of [4, 16, 28, 40]) m.set(x, 2, 'w');
  for (const x of [9, 25, 34]) m.set(x, 3, 'p');
  // the left wall: the tool chest
  m.fill(0, 0, 1, floor, 'C');
  // stacks of tires, one, two and three high: steps up to the bench
  m.set(10, 7, 'o').fill(11, 6, 1, 2, 'o').fill(12, 5, 2, 3, 'o');
  // the workbench (its top at row 5) with the black clamp under it
  m.fill(14, 5, 5, 1, 'B').set(14, 6, 'L').set(14, 7, 'L').set(18, 6, 'L').set(18, 7, 'L');
  m.set(...JUMP.black, 'clamp.black');
  // the shelf up on the wall with the red clamp
  m.fill(20, 3, 9, 1, 's');
  m.set(...JUMP.red, 'clamp.red');
  m.set(JUMP.fork[0] - 2, 1, 'wall.glint').set(...JUMP.fork, 'fork');
  // the terminals, the crank, the drum (Sir Reginald's perch) and the headlight
  m.set(JUMP.redDoor, 6, 'term.red.top').set(JUMP.redDoor, 7, 'term.red');
  m.set(JUMP.blackDoor, 6, 'term.black.top').set(JUMP.blackDoor, 7, 'term.black');
  m.set(JUMP.crank, 5, 'crank0');
  m.set(JUMP.drum, 7, 'D');
  for (let by = 0; by < CAR[1]; by++)
    for (let bx = 0; bx < CAR[0]; bx++) {
      const [x, y] = [JUMP.car[0] + bx, JUMP.car[1] + by];
      m.set(x, y, x === JUMP.lamp[0] && y === JUMP.lamp[1] ? 'headlight' : `car${bx}.${by}`);
    }
  m.fill(w - 1, 0, 1, floor, 'C');
  m.link(JUMP.exit, 7);
  m.mon(MON.dreamBird, JUMP.drum, 6);
  // he starts in mid air at (8, 5), so the view (centered on where he starts, and never scrolling
  // up or down) shows the whole garage from its left wall; he drops to the floor
  decorate(m, [
    ['light', 6, 0],
    ['light', 18, 0],
    ['light', 30, 0],
    ['board', 6, 4],
    ['board', 30, 3],
    ['board', 38, 2],
    ['charger', 42, 5],
  ]);
  // variants here and there so the walls and floors don't repeat
  m.vary('wall', ['wall.hook'], 13).vary('floor', ['floor.drip'], 9).vary('slab', ['slab.crack'], 9);
  return { m, start: at(8, 5), size: [w, 10] };
}
