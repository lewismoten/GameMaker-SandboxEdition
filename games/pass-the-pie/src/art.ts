// PASS THE PIE's props, dishes and troublemakers, cut in the block-print look (print.ts). A block picture comes on
// paper (`onPaper`); a monster picture is see-through. Everything is 20x20 unless it says otherwise.
//   dishes      pie, gravy boat, green bean casserole, cranberry sauce (ridges from the can), a basket of rolls
//   yard        leaf piles (and scuffed flat), pumpkins, a short picket fence, a squirrel, little Mr. Plume (no hat yet)
//   payback     inflatable lawn turkeys (and their crumpled vinyl), robot vacuums, the WHAP and POW of
//               a kick, a puff, Big Gobble's blower with its pressure lights, Big Gobble himself (3x3 blocks)
//   streets     the dog and his bone, kitchen window and pot, parade floats, the dash's bar, the town hall doors,
//               Grandma's oven (the restart door) and Rory standing (the finale's hand-off)
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { hatch, oval, paperBlock, press, stamp, T } from './print';

export { T };

const sheet = (w = 20, h = 20) => new Pixels(w, h, T);
/** A sprite stamped in ink on the street's paper: a block picture. */
const onPaper = (pal: Pal, s: Pixels) => stamp(pal, s, true);
/** A sprite stamped in ink, see-through: a monster picture. */
const cut = (pal: Pal, s: Pixels) => stamp(pal, s);
const R = (pal: Pal, n: string) => pal.r(n);

// ---- the dishes

export function pie(pal: Pal): Pixels {
  const c = R(pal, 'crust');
  const s = sheet();
  oval(s, 10, 13, 8, 4, c[0]);
  oval(s, 10, 11, 8, 4, c[1]);
  for (let x = 4; x < 17; x += 3) s.rect(x, 9, 2, 1, c[2]).set(x + 1, 10, c[2]);
  s.rect(4, 15, 13, 1, R(pal, 'steel')[1]);
  s.line(8, 10, 11, 12, c[0]).line(12, 10, 9, 12, c[0]);
  return onPaper(pal, s);
}

export function gravy(pal: Pal): Pixels {
  const g = R(pal, 'gravy');
  const st = R(pal, 'steel');
  const s = sheet();
  s.rect(4, 10, 11, 5, st[2]).rect(5, 15, 9, 1, st[1]).rect(8, 16, 3, 2, st[1]).rect(6, 18, 7, 1, st[1]);
  s.rect(14, 9, 4, 2, st[2]).set(17, 8, st[2]);
  s.rect(2, 9, 2, 4, st[1]).set(1, 10, st[1]);
  s.rect(5, 10, 9, 2, g[1]).set(16, 8, g[2]);
  return onPaper(pal, s);
}

export function casserole(pal: Pal): Pixels {
  const b = R(pal, 'bean');
  const s = sheet();
  s.rect(2, 10, 16, 7, R(pal, 'steel')[1]);
  s.rect(3, 8, 14, 4, b[1]);
  for (let x = 4; x < 16; x += 3) s.rect(x, 8, 2, 1, b[2]).set(x + 1, 10, b[0]);
  s.rect(5, 7, 3, 1, R(pal, 'crust')[2]).rect(11, 7, 4, 1, R(pal, 'crust')[2]); // the fried onions on top
  s.rect(0, 12, 2, 2, R(pal, 'steel')[0]).rect(18, 12, 2, 2, R(pal, 'steel')[0]);
  return onPaper(pal, s);
}

export function cranberry(pal: Pal): Pixels {
  const c = R(pal, 'cran');
  const s = sheet();
  oval(s, 10, 16, 8, 2, R(pal, 'steel')[2]);
  s.rect(5, 5, 10, 11, c[1]);
  for (let y = 7; y < 16; y += 3) s.rect(5, y, 10, 1, c[0]); // the ridges, still there
  s.rect(6, 5, 2, 10, c[2]);
  return onPaper(pal, s);
}

export function rolls(pal: Pal): Pixels {
  const c = R(pal, 'crust');
  const { acc2, ink } = press(pal);
  const s = sheet();
  s.rect(2, 11, 16, 7, acc2[1]);
  for (let x = 2; x < 18; x += 2) s.rect(x, 12, 1, 6, acc2[0]);
  for (const [x, y] of [
    [5, 10],
    [10, 9],
    [15, 10],
  ])
    oval(s, x, y, 3, 2.5, c[1]).set(x - 1, y - 1, c[2]);
  s.rect(1, 11, 18, 1, ink[0]);
  return onPaper(pal, s);
}

// ---- the yard

export function leaves(pal: Pal, flat: boolean): Pixels {
  const { acc, acc2 } = press(pal);
  const s = sheet();
  if (flat) {
    for (let x = 1; x < 19; x += 3) s.rect(x, 17, 3, 2, x % 2 ? acc[1] : acc2[1]);
    return onPaper(pal, s);
  }
  oval(s, 10, 14, 9, 6, acc[1]);
  for (let i = 0; i < 9; i++) {
    const x = 3 + ((i * 7) % 14);
    const y = 10 + ((i * 5) % 8);
    s.rect(x, y, 3, 2, i % 2 ? acc[2] : acc2[1]).set(x + 1, y + 2, acc[0]);
  }
  return onPaper(pal, s);
}

export function pumpkin(pal: Pal): Pixels {
  const { acc, leaf } = press(pal);
  const s = sheet();
  oval(s, 10, 14, 8, 5, acc[1]);
  s.rect(6, 10, 1, 9, acc[0]).rect(10, 9, 1, 10, acc[0]).rect(14, 10, 1, 9, acc[0]);
  s.rect(9, 6, 2, 4, leaf[0]).rect(11, 6, 3, 1, leaf[2]);
  return onPaper(pal, s);
}

export function fence(pal: Pal): Pixels {
  const { paper, ink } = press(pal);
  const s = sheet();
  for (let x = 1; x < 20; x += 6)
    s.rect(x, 7, 4, 13, paper[3])
      .set(x, 7, T)
      .set(x + 3, 7, T);
  s.rect(0, 11, 20, 2, paper[3]).rect(0, 16, 20, 2, paper[3]);
  return onPaper(pal, s).rect(0, 19, 20, 1, ink[0]);
}

export function squirrel(pal: Pal, flick: boolean): Pixels {
  const b = R(pal, 'tBrown');
  const s = sheet();
  // a bushy curl of tail behind, a round body, a little head with an ear
  oval(s, 5, flick ? 8 : 9, 4, 6, b[2]);
  s.rect(4, flick ? 4 : 5, 2, 7, b[3]);
  oval(s, 11, 15, 4, 4, b[1]);
  oval(s, 14, 10, 3, 3, b[1]);
  s.rect(14, 6, 2, 2, b[1]).set(15, 9, press(pal).ink[0]).rect(10, 18, 2, 1, b[0]).rect(14, 18, 2, 1, b[0]);
  s.rect(12, 14, 2, 2, b[3]);
  return cut(pal, s);
}

/** Mr. Plume on the first street: small, sweet, no hat yet. */
export function littlePlume(pal: Pal, bob: boolean): Pixels {
  const [b, fan, red, beak] = ['tBrown', 'tFan', 'tRed', 'tBeak'].map((n) => R(pal, n));
  const s = sheet();
  const y = bob ? 1 : 0;
  for (let a = 0; a < 5; a++) {
    const ang = Math.PI * (0.45 + a * 0.18);
    for (let t = 2; t < 8; t++) s.rect(Math.round(7 + Math.cos(ang) * t), Math.round(12 + y - Math.sin(ang) * t), 2, 2, t > 6 ? fan[3] : fan[a % 3]);
  }
  oval(s, 9, 13 + y, 5, 4, b[1]);
  s.rect(12, 6 + y, 2, 6, b[2]);
  oval(s, 13, 6 + y, 2, 2, b[3]);
  s.set(14, 5 + y, press(pal).ink[0])
    .rect(15, 6 + y, 2, 1, beak[1])
    .rect(14, 7 + y, 1, 3, red[1]);
  s.rect(8, 17 + y, 1, 3 - y, beak[0]).rect(11, 17 + y, 1, 3 - y, beak[0]);
  return cut(pal, s);
}

// ---- payback

/** An inflatable lawn turkey: a fat vinyl balloon of a turkey, a smile printed on, tethered at the base. */
export function inflatable(pal: Pal, bob: boolean): Pixels {
  const { acc, acc2, ink } = press(pal);
  const fan = R(pal, 'tFan');
  const s = sheet();
  const y = bob ? 1 : 0;
  // the tail fan: a half wheel of vinyl stripes behind
  for (let a = 0; a < 9; a++) {
    const ang = Math.PI * (0.15 + (a / 8) * 0.7);
    for (let t = 3; t < 10; t++) s.rect(Math.round(10 + Math.cos(ang) * t), Math.round(13 + y - Math.sin(ang) * t), 2, 2, a % 2 ? acc2[2] : acc[2]);
  }
  oval(s, 10, 13 + y, 5, 5, fan[2]); // the body, round and shiny
  s.rect(7, 10 + y, 2, 2, fan[3]);
  s.rect(9, 4 + y, 3, 6, fan[1]); // the neck
  oval(s, 10, 4 + y, 2, 2, fan[3]);
  s.set(10, 3 + y, ink[0])
    .rect(12, 4 + y, 2, 1, R(pal, 'tBeak')[1])
    .rect(11, 5 + y, 1, 3, R(pal, 'tRed')[1]);
  s.rect(7, 18, 7, 2, R(pal, 'steel')[0]).rect(4, 19, 13, 1, R(pal, 'steel')[1]); // the base and its stakes
  return cut(pal, s);
}

/** An inflatable going flat: a crumpled sheet of vinyl with its head and wattle flopped over the top, and a "pff". */
export function deflated(pal: Pal, more: boolean): Pixels {
  const { ink } = press(pal);
  const fan = R(pal, 'tFan');
  const s = sheet();
  const h = more ? 3 : 5;
  // the sheet: a jagged, wrinkled heap (never a smooth oval)
  for (let x = 2; x < 18; x++) {
    const top = 19 - h + ((x * 7) % 3) - (x > 6 && x < 12 ? 1 : 0);
    s.rect(x, top, 1, 20 - top, x % 4 === 0 ? fan[1] : fan[2]);
  }
  s.rect(8, 19 - h - 2, 3, 2, fan[3]); // the head, flopped
  s.set(8, 19 - h - 2, ink[0])
    .rect(11, 19 - h - 1, 2, 1, R(pal, 'tBeak')[1])
    .rect(10, 19 - h, 1, 2, R(pal, 'tRed')[1]);
  if (!more) s.line(15, 8, 18, 5, ink[1]).line(16, 11, 19, 10, ink[1]).line(13, 7, 14, 3, ink[1]);
  return cut(pal, s);
}

/** A robot vacuum: a low round puck with a sensor eye, angry (`mad`) once someone has kicked its friends. */
export function vacuum(pal: Pal, frame: boolean, mad = false): Pixels {
  const st = R(pal, 'steel');
  const { ink, acc } = press(pal);
  const s = sheet();
  oval(s, 10, 15, 9, 4, st[1]);
  s.rect(2, 15, 17, 2, st[0]);
  s.rect(6, 12, 8, 2, st[2]);
  s.rect(frame ? 11 : 9, 12, 2, 2, mad ? acc[2] : ink[0]);
  if (mad) s.line(6, 10, 9, 11, ink[0]).line(14, 10, 11, 11, ink[0]);
  s.set(frame ? 3 : 17, 18, ink[1]).set(frame ? 5 : 15, 19, ink[1]); // the brushes spinning
  return cut(pal, s);
}

/** A canister vacuum standing in the way, glaring, its hose up like a fist: a block that bumps (on paper). */
export function canister(pal: Pal): Pixels {
  const st = R(pal, 'steel');
  const { ink, acc } = press(pal);
  const s = sheet();
  oval(s, 10, 12, 7, 7, st[1]);
  s.rect(3, 12, 15, 6, st[1]).rect(3, 17, 15, 2, st[0]);
  s.rect(6, 8, 3, 2, acc[2]).rect(12, 8, 3, 2, acc[2]);
  s.line(5, 6, 9, 7, ink[0]).line(16, 6, 12, 7, ink[0]);
  s.rect(8, 13, 5, 1, ink[0]);
  s.line(17, 10, 19, 4, st[0]).line(18, 10, 19, 5, st[0]).rect(17, 2, 3, 3, st[2]);
  oval(s, 5, 19, 1.5, 1.5, ink[0]);
  oval(s, 15, 19, 1.5, 1.5, ink[0]);
  return onPaper(pal, s);
}

/** The WHAP of a kick: a jagged burst. */
export function whap(pal: Pal, big: boolean): Pixels {
  const { acc, acc2 } = press(pal);
  const s = sheet();
  const r = big ? 9 : 6;
  for (let a = 0; a < 10; a++) {
    const ang = (a / 10) * Math.PI * 2;
    const len = a % 2 ? r : r * 0.55;
    s.line(10, 10, Math.round(10 + Math.cos(ang) * len), Math.round(10 + Math.sin(ang) * len), acc2[2]);
  }
  oval(s, 10, 10, r * 0.4, r * 0.4, acc[2]);
  return cut(pal, s);
}

/** The POW at the end of a combo: a bigger star burst with a bright core. */
export function pow(pal: Pal): Pixels {
  const { acc, acc2, paper } = press(pal);
  const s = sheet();
  for (let a = 0; a < 14; a++) {
    const ang = (a / 14) * Math.PI * 2 + 0.2;
    const len = a % 2 ? 9.5 : 5;
    s.line(10, 10, Math.round(10 + Math.cos(ang) * len), Math.round(10 + Math.sin(ang) * len), a % 4 < 2 ? acc2[2] : acc[2]);
  }
  oval(s, 10, 10, 4, 4, acc[2]);
  oval(s, 10, 10, 2, 2, paper[3]);
  return cut(pal, s);
}

/** A puff: what is left of a kicked gadget (springs and a little smoke). */
export function puff(pal: Pal, late: boolean): Pixels {
  const { paper, ink } = press(pal);
  const s = sheet();
  for (const [x, y, r] of [
    [7, 12, 4],
    [13, 11, 4],
    [10, 7, 4],
  ])
    oval(s, x, late ? y - 2 : y, late ? r + 1 : r, late ? r + 1 : r, paper[3]);
  if (!late) s.line(3, 17, 5, 15, ink[0]).line(5, 15, 3, 13, ink[0]).line(15, 17, 17, 15, ink[0]).line(17, 15, 15, 13, ink[0]);
  return cut(pal, s);
}

/** Big Gobble's blower: a big box fan with a hose up, and a gauge of `lit` lights (of 5). */
export function blower(pal: Pal, lit: number, frame: boolean): Pixels {
  const st = R(pal, 'steel');
  const { acc, ink, paper } = press(pal);
  const s = sheet();
  s.rect(1, 6, 18, 14, st[1]).rect(1, 6, 18, 1, st[2]);
  s.ring(10, 13, 5, ink[0]);
  // three blades, turning
  for (let k = 0; k < 3; k++) {
    const ang = (k * 2 * Math.PI) / 3 + (frame ? 1 : 0);
    s.line(10, 13, Math.round(10 + Math.cos(ang) * 4), Math.round(13 + Math.sin(ang) * 4), ink[0]);
  }
  s.rect(8, 0, 4, 6, acc[0]);
  for (let i = 0; i < 5; i++) s.rect(2 + i * 3, 19, 2, 1, i < lit ? acc[2] : paper[0]);
  s.rect(1, 18, 18, 1, ink[0]);
  return cut(pal, s);
}

/** Big Gobble: a three-story inflatable turkey for the parade, 3x3 blocks; nine pictures row by row, on paper. */
export function bigGobble(pal: Pal): Pixels[] {
  const { acc, acc2, ink } = press(pal);
  const fan = R(pal, 'tFan');
  const s = new Pixels(60, 60, T);
  for (let a = 0; a < 7; a++) {
    const ang = Math.PI * (0.1 + (a / 6) * 0.8);
    for (let t = 6; t < 28; t++) s.rect(Math.round(30 + Math.cos(ang) * t), Math.round(36 - Math.sin(ang) * t), 3, 3, t > 24 ? acc2[2] : fan[a % 3]);
  }
  oval(s, 30, 38, 17, 15, fan[2]);
  oval(s, 30, 22, 8, 8, fan[3]);
  s.rect(25, 19, 3, 3, ink[0]).rect(33, 19, 3, 3, ink[0]).set(26, 19, acc2[3]).set(34, 19, acc2[3]);
  s.rect(28, 24, 5, 3, R(pal, 'tBeak')[1]).rect(29, 27, 3, 6, R(pal, 'tRed')[1]);
  s.rect(22, 30, 16, 2, acc[1]); // a printed-on smile, smug
  s.rect(13, 42, 34, 1, fan[0]).rect(15, 47, 30, 1, fan[0]); // seams
  s.rect(29, 53, 2, 7, ink[1]);
  const o = stamp(pal, s, true);
  const out: Pixels[] = [];
  for (let by = 0; by < 3; by++) for (let bx = 0; bx < 3; bx++) out.push(o.crop(bx * 20, by * 20, 20, 20));
  return out;
}

// ---- streets

export function bone(pal: Pal): Pixels {
  const { paper } = press(pal);
  const s = sheet();
  s.rect(5, 9, 10, 3, paper[3]);
  for (const [x, y] of [
    [4, 8],
    [4, 12],
    [16, 8],
    [16, 12],
  ])
    oval(s, x, y, 2, 2, paper[3]);
  return onPaper(pal, s);
}

/** The neighbor's dog: big, sitting, friendly, in the way; `chewing` once he has the bone. */
export function dog(pal: Pal, chewing: boolean): Pixels {
  const b = R(pal, 'tBrown');
  const { ink, paper, acc } = press(pal);
  const s = sheet();
  oval(s, 9, 14, 7, 6, b[2]);
  oval(s, 12, 7, 5, 5, b[2]);
  s.rect(7, 3, 3, 7, b[0]).rect(15, 3, 3, 6, b[0]); // ears
  s.set(11, 6, ink[0]).set(14, 6, ink[0]).rect(12, 9, 3, 2, ink[0]);
  s.rect(9, 12, 7, 1, acc[1]); // a collar
  if (chewing) s.rect(14, 10, 6, 2, paper[3]).rect(18, 9, 2, 4, paper[3]);
  else s.rect(12, 11, 2, 2, R(pal, 'tRed')[1]);
  s.rect(4, 18, 4, 2, b[1]).rect(11, 18, 4, 2, b[1]);
  return onPaper(pal, s);
}

export function window(pal: Pal): Pixels {
  const { acc2, ink, paper } = press(pal);
  const p = paperBlock(pal);
  p.rect(2, 2, 16, 16, ink[0]).rect(4, 4, 12, 12, acc2[3]).rect(9, 4, 2, 12, ink[0]).rect(4, 9, 12, 2, ink[0]);
  p.rect(2, 2, 16, 3, acc2[1]);
  return p.rect(5, 12, 3, 3, paper[3]);
}

export function pot(pal: Pal): Pixels {
  const st = R(pal, 'steel');
  const s = sheet();
  s.rect(4, 9, 12, 9, st[1]).rect(2, 10, 2, 2, st[0]).rect(16, 10, 2, 2, st[0]).rect(4, 8, 12, 1, st[2]);
  s.line(8, 6, 9, 3, press(pal).paper[3]).line(12, 6, 13, 2, press(pal).paper[3]);
  return onPaper(pal, s);
}

/** A parade float rolling at ankle height: a wagon with a giant paper pumpkin. */
export function floatCar(pal: Pal): Pixels {
  const { acc, acc2, ink } = press(pal);
  const s = sheet();
  s.rect(1, 12, 18, 5, acc2[1]);
  for (let x = 2; x < 18; x += 4) s.rect(x, 13, 2, 3, acc[1]);
  oval(s, 10, 8, 6, 4, acc[2]);
  s.rect(10, 3, 1, 3, ink[0]);
  oval(s, 5, 18, 2, 2, ink[0]);
  oval(s, 15, 18, 2, 2, ink[0]);
  return onPaper(pal, s);
}

/** One block of the dash's bar: lit, cooling (pale) or out. */
export function segment(pal: Pal, state: 'on' | 'warn' | 'off'): Pixels {
  const { ink, acc, paper } = press(pal);
  const p = paperBlock(pal);
  p.rect(0, 5, 20, 10, ink[0]);
  if (state === 'off') return p.rect(2, 7, 16, 6, ink[1]);
  p.rect(2, 7, 16, 6, state === 'on' ? acc[2] : paper[3]);
  return state === 'on' ? p.rect(3, 8, 6, 1, acc[3]) : p;
}

/** The town hall's double doors, two blocks high: open and warm inside, or shut. */
export function hallDoor(pal: Pal, shut: boolean): [Pixels, Pixels] {
  const { ink, acc, acc2, paper } = press(pal);
  const p = new Pixels(20, 40, ink[0]);
  if (shut) {
    p.rect(2, 4, 16, 36, acc2[0]).rect(9, 4, 2, 36, ink[0]);
    hatch(p, 2, 4, 7, 36, ink[1], 4);
    hatch(p, 11, 4, 7, 36, ink[1], 4);
    p.rect(6, 22, 2, 2, acc[2]).rect(12, 22, 2, 2, acc[2]);
  } else {
    p.rect(3, 4, 14, 36, acc[2]).rect(5, 8, 10, 32, paper[3]);
  }
  return [p.crop(0, 0, 20, 20), p.crop(0, 20, 20, 20)];
}

/** Grandma's oven door, standing in the street: touch it to start the dash again. Two blocks high. */
export function ovenDoor(pal: Pal): [Pixels, Pixels] {
  const st = R(pal, 'steel');
  const { ink, acc } = press(pal);
  const s = new Pixels(20, 40, T);
  s.rect(1, 2, 18, 38, st[1]).rect(1, 2, 18, 2, st[2]);
  for (let i = 0; i < 3; i++) s.rect(3 + i * 5, 6, 3, 3, ink[0]).set(4 + i * 5, 7, st[2]);
  s.rect(3, 14, 14, 20, ink[0]).rect(5, 16, 10, 16, acc[1]).rect(5, 16, 10, 3, acc[2]);
  s.rect(3, 11, 14, 1, st[0]);
  const o = stamp(pal, s, true);
  return [o.crop(0, 0, 20, 20), o.crop(0, 20, 20, 20)];
}
