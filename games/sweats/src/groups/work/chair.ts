// "The Office Chair That Tried to Kill Me": behold my battleground. The chair, once regal, now
// wobbling like a newborn giraffe on ice, its armrests held together by three kinds of tape, a
// paperclip and maybe a gummy worm. War on the loose screw; the creak that haunts his calls;
// stolen by an intern who swore it was too loud; tracked through a maze of cubicles, past a
// suspicious stack of unused printer paper and the motivational poster he doesn't believe in;
// the wrench borrowed from a janitor ("good luck, you'll need it"), bubble gum, a sliver of hope;
// flung backwards into shredded memos and a forgotten holiday sweater. He refuses to let it
// defeat him.
//
// The epic: the cubicle maze (partitions to hop, desks with their video calls), loose screws
// rolling about, the tower of printer paper with the tape on top, the janitor's cart and the
// wrench, the intern rolling about on the stolen chair (hop over him), the soft pile of shredded
// memos with the gum on top, the creaks wailing down the aisle, and the chair itself: it takes
// the four things (tape, screw, wrench, gum) and takes him back, squeak and all.
//
// Layout (12 rows: ceiling 0, carpet 10, he walks row 9): partitions are solid, two rows tall
// (their tops on row 8); the desks and the memo pile are ledges.
import { Pixels, rng } from '../../../../kit/pixels';
import { blob } from '../../../../snowbound/src/art/draw';
import { micro } from '../../../../snowbound/src/art/font';
import type { Monster } from '../../../../../web/src/formats/monster';
import type { Pal } from '../../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, gate, loot, plotThing } from '../../common/blocks';
import { anim, corner, mon, pace, still } from '../../common/characters';
import type { MapBuilder } from '../../common/maps';
import { addPicture, placePicture } from '../../common/picture';
import { T, face, hello, hurts, outline, type SpriteBook } from '../../common/sprites';
import { MON, POWER } from '../../ids';
import type { Monologue } from '../types';
import { CHAIR_MON } from './ids';
import { officeBase, officeWall } from './office';

/** The repairs: the tape, the loose screw, the wrench, the bubble gum. */
export const REPAIRS = 4;

/** His office chair: the wobbly seat, the armrests taped up, the wheels; `ok` sits up straight. */
function drawChair(p: Pixels, pal: Pal, x: number, y: number, ok: boolean): void {
  const c = pal.c;
  const tilt = ok ? 0 : 1;
  // the back, a little crooked
  p.rect(x + 3 + tilt, y, 10, 9, c('ink2', 1)).rect(x + 4 + tilt, y + 1, 8, 7, c('cube', 1)).rect(x + 5 + tilt, y + 2, 1, 5, c('cube', 2));
  p.rect(x + 7, y + 9, 2, 2, c('metal', 0));
  // the seat and the armrests, taped (grey, white, and the gummy worm)
  p.rect(x + 1, y + 11, 14, 3, c('cube', 1)).rect(x + 1, y + 11, 14, 1, c('cube', 2));
  p.rect(x, y + 7, 3, 2, c('ink', 1)).rect(x + 13, y + 7, 3, 2, c('ink', 1)).rect(x + 1, y + 9, 1, 2, c('ink', 1)).rect(x + 14, y + 9, 1, 2, c('ink', 1));
  p.rect(x, y + 7, 2, 2, c('grey', 2)).rect(x + 14, y + 7, 2, 2, c('white', 2)).set(x + 13, y + 8, c('green', 3)).set(x + 12, y + 8, c('red', 3));
  // the post, the star base, the wheels
  p.rect(x + 7, y + 14, 2, 3, c('metal', 1)).line(x + 1, y + 17, x + 14, y + 17, c('ink', 1));
  for (const wx of [x + 1, x + 7, x + 13]) p.rect(wx, y + 18, 2, 2, c('ink', 0));
}

export function chairBlocks(book: BlockBook, pal: Pal): void {
  const { c, r: R } = pal;
  const wall = (seed: number) => officeWall(pal, seed);
  // the cubicle partitions: fabric panels on a metal frame (solid; the top one has the rail)
  const part = (top: boolean) => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('cube', (x * 3 + y * 5) % 11 < 2 ? 0 : 1));
    p.rect(0, 0, 1, 20, c('metal', 1)).rect(19, 0, 1, 20, c('metal', 0));
    if (top) p.rect(0, 0, 20, 3, c('metal', 2)).rect(0, 3, 20, 1, c('metal', 0));
    else p.rect(0, 18, 20, 2, c('ink2', 0));
    return p;
  };
  book.add('partTop', part(true), { solid: SOLID });
  book.add('part', part(false), { solid: SOLID });
  // the cubicles' back panels behind it all (scenery): fabric, a rail on top, the baseboard
  const back = (top: boolean, low: boolean) => {
    const p = top ? wall(44) : new Pixels(20, 20);
    for (let y = top ? 10 : 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('cube', (x + y * 3) % 9 < 1 ? 1 : 0));
    if (top) p.rect(0, 9, 20, 2, c('metal', 1)).rect(0, 9, 20, 1, c('metal', 2));
    if (low) p.rect(0, 17, 20, 3, c('ink2', 0));
    return p;
  };
  book.add('cubeTop', back(true, false), AIR);
  book.add('cubeBack', back(false, false), AIR);
  book.add('cubeBase', back(false, true), AIR);
  const cubeBase = back(false, true);
  loot(book, pal, 'cubeBase');
  // a desk (a ledge on the walking row) and its monitor with a video call of tiny faces
  const desk = cubeBase.crop(0, 0, 20, 20);
  desk.rect(0, 0, 20, 3, c('wood', 4)).rect(0, 3, 20, 1, c('wood', 1)).rect(1, 4, 2, 16, c('metal', 1)).rect(13, 4, 6, 14, c('wood', 2)).frame(13, 4, 6, 7, c('wood', 1)).frame(13, 10, 6, 8, c('wood', 1));
  desk.rect(15, 7, 2, 1, c('metal', 2)).rect(15, 13, 2, 1, c('metal', 2));
  book.add('desk', desk, { solid: LEDGE, grav: GRAV.down });
  const monitor = back(false, false);
  monitor.rect(3, 3, 14, 11, c('ink', 1)).rect(4, 4, 12, 9, c('daylight', 0)).rect(9, 14, 2, 4, c('ink', 1)).rect(6, 18, 8, 2, c('ink', 1));
  for (const [fx, fy, h] of [[4, 4, 'hair'], [10, 4, 'yellow'], [4, 8, 'grey'], [10, 8, 'liver']] as const) {
    monitor.rect(fx, fy, 6, 4, c('daylight', (fx + fy) % 3 ? 1 : 2)).rect(fx + 2, fy + 1, 2, 3, c('skin', 3)).rect(fx + 2, fy + 1, 2, 1, c(h, 1));
  }
  monitor.rect(3, 15, 6, 2, c('white', 1)).rect(14, 16, 3, 2, c('white', 2));
  book.add('monitor', monitor, AIR);
  // the suspicious stack of unused printer paper (solid: climb it)
  const reams = new Pixels(20, 20);
  for (let y = 0; y < 20; y += 5) reams.rect(0, y, 20, 5, c('white', 2)).rect(0, y + 4, 20, 1, c('white', 0)).rect(0, y + 1, 20, 2, c('blue', 2)).rect(7, y + 1, 6, 2, c('white', 2));
  reams.rect(0, 0, 1, 20, c('white', 0));
  book.add('reams', reams, { solid: SOLID });
  // the janitor's cart: a mop in its bucket, a trash bag, spray bottles (scenery)
  const cart = new Pixels(40, 20, 255);
  cart.rect(2, 9, 18, 8, c('yellow', 1)).rect(2, 9, 18, 1, c('yellow', 2)).rect(5, 17, 2, 2, c('ink', 0)).rect(15, 17, 2, 2, c('ink', 0));
  cart.line(12, 9, 17, 0, c('wood', 3)).rect(15, 0, 5, 2, c('white', 1));
  cart.rect(22, 4, 16, 13, c('grey', 1)).rect(22, 4, 16, 1, c('grey', 2)).rect(24, 17, 2, 2, c('ink', 0)).rect(34, 17, 2, 2, c('ink', 0));
  blob(cart, 30, 2, 5, 3, R('ink2'), 0, 1);
  for (const x of [24, 28]) cart.rect(x, 6, 3, 6, c('teal', 2)).rect(x + 1, 4, 1, 2, c('white', 2));
  micro(cart, 5, 11, 'WET', c('ink', 0));
  addPicture(book, 'cart', cart, officeBase(pal), () => AIR);
  // the coffee he spilled (over the carpet's top: the floor)
  const spill = officeBase(pal);
  blob(spill, 10, 18, 9, 2.4, R('coffee'), 1, 2);
  spill.set(6, 17, c('white', 1)).set(13, 18, c('coffee', 3));
  book.add('spill', spill, AIR);
  // the soft pile of shredded memos and a forgotten holiday sweater (2 x 2, its top a ledge)
  const pile = new Pixels(40, 40, 255);
  const r = rng(41);
  blob(pile, 20, 32, 19, 16, R('white'), 0, 2);
  for (let k = 0; k < 260; k++) {
    const x = 2 + r() * 36;
    const y = 18 + r() * 22;
    const dx = (x - 20) / 19;
    const dy = (y - 32) / 16;
    if (dx * dx + dy * dy < 1) pile.line(x, y, x + 1 + r() * 2, y + (r() < 0.5 ? 1 : 0), c(r() < 0.2 ? 'yellow' : r() < 0.3 ? 'blue' : 'white', r() < 0.5 ? 1 : 2));
  }
  pile.rect(8, 22, 16, 9, c('red', 1)).rect(8, 22, 16, 1, c('red', 2)).rect(4, 23, 4, 4, c('red', 1)).rect(24, 24, 6, 3, c('red', 1)).rect(8, 26, 16, 2, c('green', 1));
  for (const x of [11, 16, 21]) pile.set(x, 24, c('white', 2)).set(x - 1, 25, c('white', 2)).set(x + 1, 25, c('white', 2)).set(x, 26, c('white', 2));
  addPicture(book, 'memos', pile, (_c, row) => (row ? officeBase(pal) : wall(42)), (_c, row) => (row ? AIR : { solid: LEDGE, grav: GRAV.down }));
  // the chair's creak, haunting the aisle: a crack of sound lines over its spot
  const creak = wall(43);
  for (const rr of [4, 7]) for (let a = -0.8; a <= 0.8; a += 0.1) creak.set(10 - Math.cos(a) * rr, 14 + Math.sin(a) * rr, c('cube', 0));
  book.add('creak', creak, { ...AIR, birthMon: CHAIR_MON.squeak, birthTime: 80 });
  // the chair: it takes the four repairs and lets him sit (still squeaking)
  const seat = (ok: boolean) => {
    const p = officeBase(pal);
    drawChair(p, pal, 2, 0, ok);
    if (ok) p.rect(1, 0, 3, 1, c('gold', 2)).rect(16, 0, 3, 1, c('gold', 2)).set(2, 1, c('gold', 3)).set(17, 1, c('gold', 3));
    return p;
  };
  book.add('chairOk', seat(true), { grav: GRAV.none });
  gate(book, 'chair', seat(false), 'chairOk', REPAIRS);
  // the four repairs: a roll of tape, the loose screw, the borrowed wrench, a wad of bubble gum
  plotThing(book, 'officeWall', 'tape@officeWall', (p) => {
    p.disc(10, 14, 5, c('grey', 2)).disc(10, 14, 2, c('beige', 2)).ring(10, 14, 5, c('grey', 0)).rect(13, 17, 5, 3, c('grey', 2));
  });
  plotThing(book, 'cubeBack', 'screw@cubeBack', (p) => {
    p.rect(6, 9, 8, 3, c('metal', 2)).rect(9, 12, 2, 7, c('metal', 1)).set(10, 19, c('metal', 0));
    for (let y = 12; y < 19; y += 2) p.set(8, y, c('metal', 0)).set(11, y + 1, c('metal', 0));
    p.rect(9, 10, 2, 1, c('ink', 0));
  });
  plotThing(book, 'base', 'wrench@base', (p) => {
    p.line(4, 15, 14, 9, c('metal', 2)).line(4, 16, 14, 10, c('metal', 1)).disc(15, 9, 3, c('metal', 2)).rect(15, 7, 3, 2, c('beige', 2)).disc(3.5, 16, 2, c('metal', 1));
  });
  plotThing(book, 'officeWall', 'gum@officeWall', (p) => {
    blob(p, 10, 15, 5, 3.6, R('pink'), 0, 2);
    p.set(8, 14, c('pink', 2)).line(12, 12, 16, 9, c('pink', 1));
  });
}

export function chairSprites(book: SpriteBook, pal: Pal): void {
  const { c } = pal;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  // a loose screw, rolling on its side, scowling
  const screw = (f: number) => {
    const p = P();
    p.rect(3, 12, 4, 6, c('metal', 2)).rect(7, 13, 10, 4, c('metal', 1));
    for (let x = 8 + f; x < 17; x += 2) p.rect(x, 13, 1, 4, c('metal', 0));
    p.rect(4, 14 + f, 2, 2, c('ink', 1)).set(17, 15, c('metal', 0));
    face(p, pal, 11, 9, { angry: true });
    return outline(p, ink);
  };
  book.add('screw0', screw(0), hurts(-6));
  book.add('screw1', screw(1), hurts(-6));
  // the creak: SQUEAK in a jagged little wail
  const squeak = (f: number) => {
    const p = P();
    for (let x = 1; x < 19; x++) p.set(x, 6 + ((x + f) % 4 < 2 ? 0 : 2), c('pink', 2)).set(x, 16 - ((x + f) % 4 < 2 ? 0 : 2), c('pink', 2));
    micro(p, 1, 9 - f, 'EEK', c('white', 2));
    p.set(14, 9 - f, c('white', 2)).set(16, 10 - f, c('white', 2));
    return outline(p, ink);
  };
  book.add('squeak0', squeak(0), hurts(-5, 0));
  book.add('squeak1', squeak(1), hurts(-5, 0));
  // the intern, hoodie and lanyard, rolling about on HIS chair
  const intern = (f: number) => {
    const p = P();
    drawChair(p, pal, 2, 0, false);
    for (let wx = 3; wx < 17; wx += 6) p.set(wx + f, 18, c('metal', 2));
    p.rect(5, 6, 9, 6, c('green', 1)).rect(5, 6, 9, 1, c('green', 2)).rect(9, 7, 1, 4, c('blue', 2));
    blob(p, 9.5, 3, 3, 3, pal.r('skin'), 2, 4);
    p.rect(6, 0, 7, 2, c('hair', 2)).set(8, 3, ink).set(11, 3, ink).set(10, 5, ink);
    p.rect(13, 12, 5, 2, c('sweats', 1)).rect(16, 14, 2, 4, c('sweats', 1)).rect(16, 18, 3, 2, c('white', 2));
    return outline(p, ink);
  };
  book.add('intern0', intern(0), hurts(-10));
  book.add('intern1', intern(1), hurts(-10));
  // the janitor: grey coveralls, a cap, a ring of keys; leaning on the mop
  const janitor = (f: number) => {
    const p = P();
    p.rect(6, 7, 8, 8, c('grey', 1)).rect(6, 7, 8, 1, c('grey', 2)).rect(6, 15, 3, 4, c('grey', 0)).rect(11, 15, 3, 4, c('grey', 0)).rect(5, 19, 4, 1, ink).rect(11, 19, 4, 1, ink);
    blob(p, 10, 4, 3, 3, pal.r('skin'), 1, 3);
    p.rect(6, 0, 8, 2, c('navy', 2)).rect(10, 2, 6, 1, c('navy', 1)).set(9, 4, ink).set(12, 4, ink).rect(9, 6, 3, 1, c('hair', 1));
    p.line(16, 1 + f, 16, 19, c('wood', 3)).rect(14, 9, 3, 2, c('skin', 3)).disc(7, 13, 1.5, c('gold', 2));
    return outline(p, ink);
  };
  book.add('janitor0', janitor(0), hello);
  book.add('janitor1', janitor(1), hello);
}

export function chairMonsters(set: Monster[], mb: SpriteBook): void {
  set[CHAIR_MON.screw] = mon(anim(mb, 'screw0', 'screw1', 3), { power: POWER.foe, thru: 1, newmon: CHAIR_MON.puff }, pace(3, 1));
  set[CHAIR_MON.squeak] = mon(anim(mb, 'squeak0', 'squeak1', 3), { power: POWER.foe, thru: 0, end: -1, newmon: CHAIR_MON.puff }, [corner(0, 0, 2), corner(0, 1, 1, 4), corner(-8, 0, 2, 4)]);
  set[CHAIR_MON.intern] = mon(anim(mb, 'intern0', 'intern1', 3), { power: POWER.tough, thru: 1 }, pace(4, 2));
  set[CHAIR_MON.janitor] = mon(anim(mb, 'janitor0', 'janitor1', 20), { power: POWER.friend, thru: 0, newmon: CHAIR_MON.janitorOff }, still);
  set[CHAIR_MON.janitorOff] = mon(anim(mb, 'janitor1', 'janitor0', 4), { power: POWER.tough, thru: 0, end: 30 }, [corner(0, 0, 2), corner(-3, 0, 2, 4)]);
  set[CHAIR_MON.puff] = mon(anim(mb, 'ink0', 'ink1', 3), { power: POWER.friend, thru: 0, end: 8 });
}

export const chair: Monologue = {
  file: 'chair',
  title: 'The Office Chair That Tried to Kill Me',
  desc: 'The Office Chair',
  filler: 'slab',
  legend: {
    '^': 'ceiling',
    '*': 'ceilingLit',
    '.': 'officeWall',
    _: 'base',
    '=': 'carpet',
    R: 'partTop',
    I: 'part',
    K: 'desk',
    v: 'monitor',
    r: 'reams',
    y: 'blinds',
    G: 'chair',
    A: 'tape@officeWall',
    S: 'screw@cubeBack',
    '-': 'cubeTop',
    '%': 'cubeBack',
    ',': 'cubeBase',
    W: 'wrench@base',
    U: 'gum@officeWall',
    $: 'coin@base',
    c: 'coin@cubeBase',
    B: 'bill@cubeBase',
    '&': 'coin@officeWall',
    b: 'bill@base',
    m: 'mug@base',
    '!': 'spot@base',
  },
  build: (m: MapBuilder) => {
    // the walk-off: OFF blocks more of the cubicle aisle past the gate, so its punch line plays out before
    // the scene ends
    const OFF = 7;
    const W = 64 + OFF;
    m.row(0, 0, W - 1, '^');
    for (let x = 3; x < W; x += 6) m.set(x, 0, '*');
    m.fill(0, 1, W, 8, '.').row(9, 0, W - 1, '_').row(10, 0, W - 1, '=').row(11, 0, W - 1, 'slab');
    // the sea of cubicles behind it all
    for (const [x0, x1] of [[3, 29], [38, 46], [52, 58]]) m.row(7, x0, x1, '-').row(8, x0, x1, '%').row(9, x0, x1, ',');
    // his cubicle: the desk and its video call (the chair: gone)
    m.set(2, 9, '!').set(4, 9, 'K').set(5, 9, 'K').set(5, 8, 'v').set(3, 4, 'poster');
    // the maze of cubicles: partitions to hop, a desk with the loose screw, rolling screws
    const partition = (x: number) => m.set(x, 8, 'R').set(x, 9, 'I');
    for (const x of [7, 14, 22, 30]) partition(x);
    m.set(11, 9, 'c').set(12, 9, 'K').set(13, 9, 'K').set(12, 8, 'S').set(13, 8, 'v').set(10, 3, 'y');
    m.mon(CHAIR_MON.screw, 9, 9);
    // the suspicious stack of unused printer paper, the tape on top; the poster he doesn't believe in
    m.set(18, 9, 'r').col(19, 8, 9, 'r').col(20, 7, 9, 'r').set(20, 6, 'A').set(16, 3, 'poster');
    m.mon(MON.leo, 15, 9);
    // another cubicle: a desk, a coin on it, a screw underfoot, the spilled coffee
    m.set(31, 9, 'spill').row(9, 27, 28, 'K').set(28, 8, 'v').set(25, 9, 'c').set(26, 3, 'y');
    m.mon(CHAIR_MON.screw, 23, 9);
    // the janitor and his cart: the wrench ("good luck, you'll need it")
    m.mon(CHAIR_MON.janitor, 32, 9);
    placePicture(m, 'cart', 33, 9, 2, 1);
    m.set(35, 9, 'W').set(37, 9, 'm').set(34, 4, 'thermostat');
    // the intern, rolling about on the stolen chair
    m.mon(CHAIR_MON.intern, 40, 9);
    m.set(42, 3, 'y').set(47, 9, 'b');
    // the soft pile of shredded memos and the holiday sweater, the gum on top
    placePicture(m, 'memos', 49, 8, 2, 2);
    m.set(50, 7, 'U').set(49, 7, '&').set(48, 3, 'y');
    // the aisle where the creak wails, the chair
    placePicture(m, 'plant', 36, 8, 1, 2);
    m.set(56, 9, 'c').set(60, 8, 'creak').set(58, 3, 'poster');
    m.set(60, 9, 'G').set(60, 7, 'clock');
    m.link(60 + OFF, 9, 'next');
    return { start: [1, 9], size: [W, 12] };
  },
  monsters: chairMonsters,
  song: 'epic',
  clips: { open: 'chair_o', line: 'chair_l', punch: 'chair_p', word: 'chair_w' },
  view: [8, 3],
  card: ['Behold my battleground.', 'Fight anyway.'],
};
