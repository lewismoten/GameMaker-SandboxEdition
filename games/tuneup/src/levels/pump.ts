// Level 8, Pump Up the Volume (the curb at noon). THE CHEZ's tires are soft, and the owner's
// manual says 32 psi; the only pump is the balloon pump, so Doc Leo climbs the giant (squashed)
// tire on balloon dogs, as in the Teddy finale: B twists one under his shoes and it floats him up
// seven blocks, bobs a moment at the top (time to step off onto a shop's awning) and pops. A pink
// balloon poodle waits on each awning. The sky is one fade from the top of the screen to the
// curb, with clouds, and the curb has giant grass, a dandelion and a bottle cap, as a shrunk
// Doc Leo sees them. On the tire, he works the pump's handle (Space held) while its gauge fills
// eight notches, and the gate at the far side opens for a full tire. Down its far side, a slide
// whistle.
import { addFork, glint } from '../blocks/fork';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { poodle } from '../sprites/balloonDogs';
import { AIR, countedDoor, kit, LEDGE, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MON } from '../ids';
import { MapBuilder, at, type Level } from './maps';

/** Notches on the pump's gauge, and ticks each stroke shows before the next. */
export const STROKES = 8;
const STROKE = 6;
export const PUMP = { w: 37, floor: 9, tire: [25, 32] as [number, number], tireTop: 4, handle: 29, door: 34, exit: 35 } as const;
/** The tire's height in blocks (its top row to the floor). */
const TIRE_H = PUMP.floor - PUMP.tireTop;
/** The awnings' row, just under a balloon dog's ride (it rises seven blocks from the curb). */
export const AWNING_ROW = 3;
/** The pigeon's start (level x, y): it flies 14 blocks right and back over the awnings. */
export const PIGEON = [12, 1] as const;
/** The secret: a glint over the second awning's left end, and a tuning fork on it (level x, y). */
export const PUMP_FORK = [19, AWNING_ROW - 1] as const;
/** The awnings: [first x, last x]. Doc Leo twists a balloon dog just left of each and rides it up. */
export const AWNINGS: [number, number][] = [
  [11, 14],
  [19, 21],
  [24, 24],
];
/** Where he twists each balloon dog (the column left of each awning). */
export const TWISTS = AWNINGS.map(([a]) => a - 1);
/** A pink balloon poodle on each awning, worth points. */
export const POODLE = 250;
export const poodleAt = ([a, b]: [number, number]) => Math.floor((a + b + 1) / 2);

export function pumpBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'curb');
  const { book, c, R } = k;
  const ink = c('ink', 0);
  // the sky: one fade from the top of the screen down to the curb, a block of it a row
  const fade = gradient(new Pixels(20, PUMP.floor * 20, 0), 0, 0, 20, PUMP.floor * 20, R('wall'), 0, 4);
  const sky = (y: number) => fade.crop(0, y * 20, 20, 20);
  for (let y = 0; y < PUMP.floor; y++) book.add(`air${y}`, sky(y), AIR);
  // clouds, two blocks wide, in two shapes
  for (const [name, y, bumps] of [
    [
      'cloudA',
      1,
      [
        [8, 12, 6],
        [16, 9, 7],
        [25, 11, 6],
        [31, 13, 5],
      ],
    ],
    [
      'cloudB',
      0,
      [
        [9, 13, 5],
        [17, 11, 6],
        [26, 13, 5],
      ],
    ],
  ] as const) {
    const wide = new Pixels(40, 20, 255);
    for (const [x, yy, r] of bumps) wide.disc(x, yy, r, c('paint', 2));
    for (const [x, yy, r] of bumps) wide.disc(x - 1, yy - 1, r - 1.5, c('paint', 3));
    wide.rect(4, 15, 32, 2, c('paint', 2));
    for (let h = 0; h < 2; h++) book.add(`${name}${h}`, sky(y).blit(wide.crop(h * 20, 0, 20, 20), 0, 0, 255), AIR);
  }
  // giant things on the curb, as a shrunk Doc Leo sees them: grass in the cracks, a dandelion, a bottle cap
  const tuft = (seed: number) => {
    const p = sky(PUMP.floor - 1);
    const blades = [
      [3, 6, -2],
      [7, 1, 1],
      [10, 4, 3],
      [14, 8, -1],
      [17, 3, 2],
    ];
    blades.forEach(([x, top, lean], i) => {
      if ((i + seed) % 5 === 4) return;
      p.line(x, 19, x + lean, top + seed, c('grass', 1 + ((i + seed) % 3))).line(x + 1, 19, x + 1 + lean, top + seed + 1, c('grass', 2 + ((i + seed) % 2)));
    });
    return p;
  };
  book.add('tuft0', tuft(0), AIR);
  book.add('tuft1', tuft(2), AIR);
  const stem = (y: number, leaf: boolean) => {
    const p = sky(y);
    p.rect(9, 0, 2, 20, c('grass', 1)).rect(9, 0, 1, 20, c('grass', 3));
    if (leaf) for (let i = 0; i < 6; i++) p.rect(11 + i, 10 - i, 2, 2, c('leaf', 2)).rect(7 - i, 13 - i, 2, 2, c('leaf', 3));
    return p;
  };
  const flower = sky(PUMP.floor - 4);
  for (let a = 0; a < 12; a++) {
    const t = (a * Math.PI) / 6;
    flower.disc(10 + Math.cos(t) * 6, 10 + Math.sin(t) * 6, 2.6, c('yellow', 2 + (a % 2)));
  }
  flower.disc(10, 10, 4, c('yellow', 1)).disc(10, 10, 2, c('orange', 2)).rect(9, 16, 2, 4, c('grass', 1));
  book.add('flower', flower, AIR);
  for (let y = PUMP.floor - 3; y < PUMP.floor; y++) book.add(`stem${y}`, stem(y, y === PUMP.floor - 2), AIR);
  const cap = sky(PUMP.floor - 1);
  cap.rect(1, 9, 18, 11, c('red', 1)).rect(1, 9, 18, 2, c('red', 3));
  for (let x = 1; x < 19; x += 3) cap.rect(x, 18, 2, 2, c('red', 0));
  cap.rect(4, 12, 12, 4, c('paint', 3)).rect(6, 13, 8, 2, c('red', 2));
  book.add('bottlecap', cap, AIR);
  // the far end: a wooden fence, its boards and their pointed tops
  const fence = (top: boolean) => {
    const p = top ? sky(0) : k.P(c('wood', 1));
    for (let x = 0; x < 20; x += 7) {
      p.rect(x + 1, top ? 6 : 0, 5, top ? 14 : 20, c('wood', 3)).rect(x + 1, top ? 6 : 0, 1, top ? 14 : 20, c('wood', 4));
      if (top) p.rect(x + 2, 4, 3, 2, c('wood', 3)).set(x + 3, 3, c('wood', 3));
    }
    if (!top) p.rect(0, 8, 20, 3, c('wood', 2)).set(3, 9, ink).set(10, 9, ink).set(17, 9, ink);
    return p;
  };
  book.add('fence.top', fence(true), { solid: SOLID });
  book.add('fence', fence(false), { solid: SOLID });
  // a pink balloon poodle on an awning, bobbing; touching it scores it
  for (let f = 0; f < 2; f++)
    book.add(`poodle${f}`, poodle(sky(AWNING_ROW - 1), f === 1), { ...AIR, score: POODLE, touch: `air${AWNING_ROW - 1}`, ntime: 10, next: `poodle${1 - f}` });
  // a shop awning to stand on (solid on top), striped; its post below
  const awning = sky(AWNING_ROW);
  for (let x = 0; x < 20; x += 6) awning.rect(x, 0, 3, 8, c('accent', 3)).rect(x + 3, 0, 3, 8, c('paint', 3));
  awning.rect(0, 8, 20, 2, c('accent', 1));
  for (let x = 1; x < 20; x += 4) awning.disc(x, 10, 1.5, c('accent', 1));
  book.add('awning', awning, { solid: LEDGE, ...AIR });
  for (let y = AWNING_ROW + 1; y < PUMP.floor; y++) book.add(`post${y}`, sky(y).rect(9, 0, 2, 20, c('mach', 2)).rect(9, 0, 1, 20, c('mach', 4)), AIR);
  // the tire, squashed flat at the top and bottom: rubber with tread, the white wheel in the middle
  const [t0, t1] = PUMP.tire;
  const tw = t1 - t0 + 1;
  const th = TIRE_H * 20;
  const big = new Pixels(tw * 20, th, 255);
  for (let y = 0; y < th; y++)
    for (let x = 0; x < tw * 20; x++) {
      const dx = Math.max(0, Math.abs(x - tw * 10) - (tw * 10 - 20));
      const dy = Math.max(0, Math.abs(y - th / 2) - (th / 2 - 20));
      if (dx * dx + dy * dy < 20 * 20) big.set(x, y, (x + y) % 8 < 2 && dy > 0 ? c('shade', 0) : c('shade', 1));
    }
  big
    .disc(tw * 10, th / 2, 28, c('paint', 3))
    .disc(tw * 10, th / 2, 24, c('paint', 2))
    .disc(tw * 10, th / 2, 8, c('mach', 4))
    .disc(tw * 10, th / 2, 3, ink);
  for (let by = 0; by < TIRE_H; by++)
    for (let bx = 0; bx < tw; bx++) {
      const p = sky(PUMP.tireTop + by).blit(big.crop(bx * 20, by * 20, 20, 20), 0, 0, 255);
      // solid where the tire fills most of the block (the top row flat, so it stands)
      let fill = 0;
      for (let yy = 0; yy < 20; yy++) for (let xx = 0; xx < 20; xx++) if (big.get(bx * 20 + xx, by * 20 + yy) !== 255) fill++;
      book.add(`tire${bx}.${by}`, p, fill > 200 ? { solid: SOLID } : AIR);
    }
  // the pump: its handle over the tire (Space works it), the barrel and hose behind Doc Leo
  const handleRow = PUMP.tireTop - 3;
  const handle = (n: number, down: boolean) => {
    const p = sky(handleRow);
    p.rect(0, 0, 20, 9, ink);
    for (let i = 0; i < STROKES; i++)
      p.rect(1 + i * 2 + Math.floor(i / 4) * 2, 1, 2, 7, i < n ? c(n === STROKES ? 'green' : 'yellow', 2 + (i % 2)) : c('shade', 1));
    p.rect(3, down ? 14 : 11, 14, 3, c('wood', 2)).rect(9, down ? 17 : 14, 2, down ? 3 : 6, c('mach', 4));
    return p;
  };
  for (let n = 0; n < STROKES; n++) {
    const last = n === STROKES - 1;
    const stroke = last ? { effect: CTR.psi, eamt: 1, score: 100, hp: 1 } : { score: 10 };
    book.add(`handle${n}`, handle(n, false), { ...AIR, ...stroke, touch: `handle${n}.d` });
    book.add(`handle${n}.d`, handle(n + 1, true), { ...AIR, ntime: STROKE, next: last ? 'handle.full' : `handle${n + 1}` });
  }
  book.add('handle.full', handle(STROKES, false), AIR);
  for (const y of [handleRow + 1, handleRow + 2]) {
    const barrel = sky(y);
    barrel.rect(6, 0, 8, 20, c('blue', 2)).rect(6, 0, 2, 20, c('blue', 3));
    if (y === handleRow + 1) barrel.rect(9, 0, 2, 4, c('mach', 4));
    book.add(`barrel${y}`, barrel, AIR);
  }
  // down the full tire's far side, once: the slide whistle (a little energy, for its sound slot)
  const slideRow = PUMP.floor - 3;
  book.add('slide', sky(slideRow), { ...AIR, hp: 1, touch: `air${slideRow}` });
  countedDoor(k, 'gate', `air${PUMP.floor - 1}`, CTR.psi, 1, (p: Pixels) => {
    p.disc(10, 12, 4, c('paint', 3)).rect(10, 9, 1, 4, ink);
  });
  // the gate's top half on its own row's sky (countedDoor's would carry the row below's)
  const top = sky(PUMP.floor - 2);
  top.rect(2, 4, 16, 16, c('mach', 3)).frame(2, 4, 16, 16, c('mach', 0)).rect(2, 2, 16, 2, c('mach', 1));
  top.rect(8, 8, 4, 4, c('lamp', 3)).frame(8, 8, 4, 4, c('mach', 0));
  book.add('gateTop', top, AIR);
  addFork(k, `air${AWNING_ROW - 1}`);
  glint(k, `air${AWNING_ROW - 2}`);
  return k;
}

export function pump(book: Kit['book']): Level {
  const { w, floor } = PUMP;
  const m = new MapBuilder(book, {}, 'walk');
  for (let y = 0; y < floor; y++) m.fill(0, y, w, 1, `air${y}`);
  // the sidewalk, its slabs varied
  for (let x = 0; x < w; x++) m.set(x, floor, x % 7 === 3 ? 'walk.crack' : x % 11 === 6 ? 'walk.pebble' : 'walk');
  for (const [x, name] of [
    [2, 'cloudA'],
    [13, 'cloudB'],
    [21, 'cloudA'],
    [32, 'cloudB'],
  ] as const)
    for (let h = 0; h < 2; h++) m.set(x + h, name === 'cloudA' ? 1 : 0, `${name}${h}`);
  // the curb's giant things, clear of where Doc Leo twists and the awnings' posts
  m.set(6, floor - 4, 'flower');
  for (let y = floor - 3; y < floor; y++) m.set(6, y, `stem${y}`);
  for (const [x, t] of [
    [1, 0],
    [3, 1],
    [8, 1],
    [16, 0],
    [17, 1],
    [22, 0],
  ] as const)
    m.set(x, floor - 1, `tuft${t}`);
  m.set(12, floor - 1, 'bottlecap');
  for (const [a, b] of AWNINGS) {
    m.fill(a, AWNING_ROW, b - a + 1, 1, 'awning');
    for (let y = AWNING_ROW + 1; y < floor; y++) m.set(b, y, `post${y}`);
    m.set(poodleAt([a, b]), AWNING_ROW - 1, 'poodle0');
  }
  m.set(...PUMP_FORK, 'fork').set(PUMP_FORK[0] + 1, AWNING_ROW - 2, `air${AWNING_ROW - 2}.glint`);
  const [t0, t1] = PUMP.tire;
  for (let by = 0; by < TIRE_H; by++) for (let bx = 0; bx <= t1 - t0; bx++) m.set(t0 + bx, PUMP.tireTop + by, `tire${bx}.${by}`);
  // (the handle is a row below the screen's top: PLAYGAME changes only blocks wholly on screen)
  m.set(PUMP.handle, PUMP.tireTop - 3, 'handle0')
    .set(PUMP.handle + 1, PUMP.tireTop - 2, `barrel${PUMP.tireTop - 2}`)
    .set(PUMP.handle + 1, PUMP.tireTop - 1, `barrel${PUMP.tireTop - 1}`);
  m.set(t1 + 1, floor - 3, 'slide').set(t1 + 2, floor - 3, 'slide');
  m.set(PUMP.door, floor - 2, 'gateTop').set(PUMP.door, floor - 1, 'gate');
  m.set(w - 1, 0, 'fence.top').fill(w - 1, 1, 1, floor - 1, 'fence');
  m.link(PUMP.door, floor - 1);
  m.mon(MON.reggie, 4, floor - 1);
  m.mon(MON.pigeon, PIGEON[0], PIGEON[1]);
  return { m, start: at(8, 5), size: [w, 10] };
}
