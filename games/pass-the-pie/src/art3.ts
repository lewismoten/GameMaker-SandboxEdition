// PASS THE PIE 3.0's new props and troublemakers, in the same block-print look (print.ts). 20x20 each; a monster
// picture is see-through, a block picture is on paper.
//   bag        a canvas kick bag hanging from a stand (Mr. Plume's practice target; three kicks to tip it)
//   drone      Uncle Dale's leaf-blower drone: a little four-rotor box that hovers back and forth
//   fedVac     a robot vacuum that swallowed a dinner roll: stalled, a flat lid you can stand on, "Z"s
//   roll       a dinner roll in the air, spinning (Rory's toss)
//   mower      Dale's robot mower, a wedge on wheels with one sensor eye
//   stake      Big Gobble's tether stake: a steel spike in a sandbag with a rope going up
//   gobblet    a little balloon turkey Big Gobble puffs out of its beak; it drifts toward Mr. Plume
//   chaser     Big Gobble loose on Main Street: 2x2 pieces of one rolling balloon face (the chase)
//   wind       a gust: streaks of paper blowing right (two frames)
//   updraft    a street grate's warm air rising: wavy lines going up (two frames)
//   cord       an orange extension cord along the ground (the clue), and a plug end
//   crate      a shipping crate of parade supplies to stand on
//   awning     a striped shop awning: stand on it, jump up through it
//   rumble     the ground in front of Big Gobble, shaken by its thumping (two frames)
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { hatch, oval, paperBlock, press, stamp, T } from './print';

const sheet = (w = 20, h = 20) => new Pixels(w, h, T);
const onPaper = (pal: Pal, s: Pixels) => stamp(pal, s, true);
const cut = (pal: Pal, s: Pixels) => stamp(pal, s);

/** A canvas kick bag on a stand: `hits` kicks taken so far (0 to 2) tilt it further and add patches. */
export function bag(pal: Pal, hits: number, frame: boolean): Pixels {
  const { acc, acc2, ink } = press(pal);
  const st = pal.r('steel');
  const s = sheet();
  s.rect(2, 0, 16, 2, st[0]).rect(2, 0, 2, 20, st[0]).rect(0, 18, 8, 2, st[0]); // the stand
  const lean = hits + (frame ? 1 : 0);
  s.line(10, 2, 10 + lean, 4, ink[0]); // the chain
  for (let y = 4; y < 17; y++) {
    const dx = Math.round((lean * (y - 4)) / 6);
    s.rect(7 + dx, y, 7, 1, y % 4 === 0 ? acc2[1] : acc[1]);
  }
  if (hits > 0) s.rect(9 + lean, 8, 3, 3, acc2[2]);
  if (hits > 1) s.rect(10 + lean * 2, 12, 3, 2, acc2[2]);
  return cut(pal, s);
}

/** A leaf-blower drone: a box with two rotors on top and a nozzle; `frame` turns the rotors. */
export function drone(pal: Pal, frame: boolean): Pixels {
  const { acc, ink } = press(pal);
  const st = pal.r('steel');
  const s = sheet();
  const blade = (x: number) => (frame ? s.rect(x - 4, 3, 9, 1, ink[1]) : s.rect(x - 1, 2, 3, 2, ink[1]));
  blade(5);
  blade(15);
  s.rect(4, 4, 2, 3, st[0]).rect(14, 4, 2, 3, st[0]);
  s.rect(3, 7, 14, 7, st[1]).rect(3, 7, 14, 1, st[2]);
  s.rect(6, 9, 3, 2, acc[2]).rect(11, 9, 3, 2, acc[2]); // two little lights, glaring
  s.rect(8, 14, 4, 4, st[0]).rect(7, 17, 6, 2, ink[0]); // the nozzle
  return cut(pal, s);
}

/** A robot vacuum that swallowed a roll: lid shut flat, eye closed, the roll's end in its mouth, a "Z". */
export function fedVac(pal: Pal, frame: boolean): Pixels {
  const st = pal.r('steel');
  const { ink } = press(pal);
  const cr = pal.r('crust');
  const s = sheet();
  s.rect(1, 9, 18, 2, st[2]).rect(1, 11, 18, 7, st[1]).rect(1, 17, 18, 2, st[0]);
  s.rect(7, 13, 5, 1, ink[0]); // the eye, shut
  oval(s, 17, 15, 2.5, 2, cr[2]);
  s.set(18, 14, cr[1]);
  const z = frame ? 1 : 0;
  s.line(12, 2 - z, 15, 2 - z, ink[1]).line(15, 2 - z, 12, 5 - z, ink[1]).line(12, 5 - z, 15, 5 - z, ink[1]);
  return cut(pal, s);
}

/** A dinner roll in flight; `frame` turns it a quarter. */
export function roll(pal: Pal, frame: boolean): Pixels {
  const cr = pal.r('crust');
  const s = sheet();
  if (frame) {
    oval(s, 10, 10, 4, 5, cr[2]);
    s.rect(9, 6, 2, 8, cr[1]);
  } else {
    oval(s, 10, 10, 5, 4, cr[2]);
    s.rect(6, 9, 8, 2, cr[1]);
  }
  s.set(8, 8, cr[3] ?? cr[2]);
  return cut(pal, s);
}

/** Dale's robot mower: a low wedge on two wheels with a sensor eye. */
export function mower(pal: Pal, frame: boolean): Pixels {
  const { acc, acc2, ink } = press(pal);
  const s = sheet();
  for (let y = 9; y < 17; y++) s.rect(2 + Math.max(0, 12 - y), y, 16 - Math.max(0, 12 - y), 1, acc2[1]);
  s.rect(2, 16, 16, 1, ink[0]);
  s.rect(13, 11, 3, 2, acc[2]);
  oval(s, 5, 17, 2, 2, ink[0]);
  oval(s, 15, 17, 2, 2, ink[0]);
  s.set(frame ? 4 : 6, 17, acc2[3]).set(frame ? 14 : 16, 17, acc2[3]);
  return cut(pal, s);
}

/** A tether stake: a spike in a sandbag with a rope going up; `hits` loosens it (0 to 2). */
export function stake(pal: Pal, hits: number, frame: boolean): Pixels {
  const { acc2, ink, leaf } = press(pal);
  const st = pal.r('steel');
  const s = sheet();
  const lean = hits * 2 + (frame ? 1 : 0);
  s.line(10, 12, 10 + lean * 2, 0, acc2[2]).line(11, 12, 11 + lean * 2, 0, acc2[2]); // the rope, taut
  s.rect(9, 8 + hits, 3, 8, st[1]);
  oval(s, 10, 17, 7, 3, leaf[1]); // the sandbag
  s.rect(4, 16, 12, 1, ink[1]);
  if (hits > 1) s.set(4, 13, st[2]).set(16, 13, st[2]);
  return cut(pal, s);
}

/** A little balloon turkey, puffed out of Big Gobble's beak: round, smug, a string trailing. */
export function gobblet(pal: Pal, frame: boolean): Pixels {
  const { acc2, ink } = press(pal);
  const fan = pal.r('tFan');
  const s = sheet();
  const y = frame ? 1 : 0;
  for (let a = 0; a < 5; a++) s.rect(4 + a * 3, 3 + y + (a % 2), 2, 4, a % 2 ? acc2[2] : fan[1]);
  oval(s, 10, 10 + y, 6, 5, fan[2]);
  s.rect(7, 8 + y, 2, 2, ink[0]).rect(12, 8 + y, 2, 2, ink[0]);
  s.rect(9, 11 + y, 3, 2, pal.r('tBeak')[1]);
  s.line(10, 15 + y, frame ? 8 : 12, 19, ink[1]);
  return cut(pal, s);
}

/** Big Gobble loose: one 40x40 face rolling along, cut into four monster pictures (TL, TR, BL, BR). */
export function chaser(pal: Pal, frame: boolean): Pixels[] {
  const { acc, acc2, ink } = press(pal);
  const fan = pal.r('tFan');
  const s = new Pixels(40, 40, T);
  for (let a = 0; a < 9; a++) {
    const ang = (a / 9) * Math.PI * 2 + (frame ? 0.35 : 0);
    for (let t = 14; t < 20; t++) s.rect(Math.round(20 + Math.cos(ang) * t) - 1, Math.round(21 + Math.sin(ang) * t) - 1, 3, 3, a % 2 ? acc2[2] : fan[1]);
  }
  oval(s, 20, 21, 15, 15, fan[2]);
  s.rect(11, 13, 5, 5, ink[0]).rect(24, 13, 5, 5, ink[0]).set(12, 14, acc2[3]).set(25, 14, acc2[3]);
  s.line(10, 10, 16, 12, ink[0]).line(30, 10, 24, 12, ink[0]); // brows, determined
  s.rect(16, 20, 8, 5, pal.r('tBeak')[1]).rect(18, 25, 4, 7, pal.r('tRed')[1]);
  s.rect(9, 29, 22, 2, acc[1]);
  const o = stamp(pal, s);
  return [o.crop(0, 0, 20, 20), o.crop(20, 0, 20, 20), o.crop(0, 20, 20, 20), o.crop(20, 20, 20, 20)];
}

/** A gust: streaks blowing right, shifted each frame (a block that pushes the hero right). */
export function wind(pal: Pal, frame: number): Pixels {
  const { paper } = press(pal);
  const p = paperBlock(pal);
  for (const [x, y, l] of [
    [2, 4, 6],
    [9, 9, 7],
    [1, 14, 5],
    [12, 17, 5],
  ])
    p.rect((x + frame * 6) % 20, y, l, 1, paper[3]).rect((x + frame * 6 + l) % 20, y, 2, 1, paper[0]);
  return p;
}

/** Warm air rising from a grate: wavy lines going up (a block that lifts the hero). */
export function updraft(pal: Pal, frame: number): Pixels {
  const { paper, acc } = press(pal);
  const p = paperBlock(pal);
  for (const x of [4, 10, 16])
    for (let y = 0; y < 20; y++) if ((y + frame * 5) % 10 < 6) p.set(x + (Math.floor((y + frame * 5) / 3) % 2), y, (y + frame) % 4 ? paper[3] : acc[3]);
  return p;
}

/** The grate the updraft rises from (stand on it). */
export function grate(pal: Pal): Pixels {
  const { ink } = press(pal);
  const st = pal.r('steel');
  const p = paperBlock(pal);
  p.rect(0, 14, 20, 6, st[1]);
  for (let x = 1; x < 20; x += 3) p.rect(x, 15, 1, 5, ink[0]);
  return p;
}

/** The orange extension cord along the ground, a plug at its end (`plug`). */
export function cord(pal: Pal, plug: boolean): Pixels {
  const { acc } = press(pal);
  const { ink } = press(pal);
  const s = sheet();
  if (plug) {
    s.rect(0, 16, 10, 2, acc[2]).rect(10, 13, 6, 7, acc[1]).rect(16, 14, 3, 1, pal.r('steel')[2]).rect(16, 17, 3, 1, pal.r('steel')[2]);
  } else for (let x = 0; x < 20; x++) s.set(x, 16 + (Math.floor(x / 5) % 2), acc[2]).set(x, 17 + (Math.floor(x / 5) % 2), acc[1]);
  s.set(0, 0, T);
  void ink;
  return onPaper(pal, s);
}

/** A crate of parade supplies: solid, to climb on. */
export function crate(pal: Pal): Pixels {
  const { ink, acc2 } = press(pal);
  const p = new Pixels(20, 20, acc2[1]);
  p.frame(0, 0, 20, 20, ink[0]).frame(1, 1, 18, 18, acc2[0]);
  p.line(2, 2, 17, 17, acc2[0]).line(2, 17, 17, 2, acc2[0]);
  hatch(p, 3, 3, 14, 14, acc2[0], 7);
  return p;
}

/** A striped shop awning (a ledge). */
export function awning(pal: Pal): Pixels {
  const { acc, acc2, ink } = press(pal);
  const p = paperBlock(pal);
  for (let x = 0; x < 20; x++) p.rect(x, 0, 1, 7, Math.floor(x / 5) % 2 ? acc[2] : acc2[3]);
  for (let x = 0; x < 20; x += 5) oval(p, x + 2.5, 7, 2.5, 1.5, Math.floor(x / 5) % 2 ? acc[2] : acc2[3]);
  p.rect(0, 0, 20, 1, ink[0]);
  return p;
}

/** The ground in front of Big Gobble, shaken by its thumping: the leaves jump a pixel and dust kicks up. */
export function rumble(pal: Pal, ground: Pixels, shaken: boolean): Pixels {
  if (!shaken) return ground;
  const { paper } = press(pal);
  const p = new Pixels(20, 20, 0);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, ground.get(x, Math.min(19, y + 1)));
  p.rect(3, 0, 2, 1, paper[3]).rect(14, 0, 3, 1, paper[3]);
  return p;
}

/** A gold acorn: a secret's prize, shining. */
export function goldAcorn(pal: Pal): Pixels {
  const g = pal.r('tGold');
  const { ink } = press(pal);
  const s = sheet();
  oval(s, 10, 12, 5, 6, g[1]);
  s.rect(7, 9, 2, 6, g[0]);
  s.rect(4, 6, 12, 4, g[0]).rect(5, 5, 10, 1, g[0]);
  s.rect(10, 2, 1, 3, ink[1]);
  s.set(1, 3, g[1]).set(18, 5, g[1]).set(2, 16, g[1]).set(17, 15, g[1]); // a glint all round
  return onPaper(pal, s);
}

/** A mug of hot cider with steam curling up: hit points back. */
export function cider(pal: Pal): Pixels {
  const { paper, acc, acc2 } = press(pal);
  const s = sheet();
  s.rect(5, 9, 9, 10, acc2[1]).rect(14, 11, 3, 1, acc2[1]).rect(16, 11, 1, 5, acc2[1]).rect(14, 15, 3, 1, acc2[1]);
  s.rect(6, 10, 7, 2, acc[2]);
  for (const x of [7, 11]) s.set(x, 7, paper[3]).set(x + 1, 6, paper[3]).set(x, 5, paper[3]).set(x + 1, 4, paper[3]);
  return onPaper(pal, s);
}

/** A clipped hedge that looks exactly like a street's end, but is only leaves: walk right in. */
export function hedgeLook(pal: Pal): Pixels {
  const { ink, leaf } = press(pal);
  const p = new Pixels(20, 20, leaf[1]);
  for (let y = 0; y < 20; y += 5)
    for (let x = (y / 5) % 2 ? 0 : 3; x < 20; x += 6) {
      oval(p, x + 2, y + 2, 2, 2, leaf[2]);
      p.set(x + 2, y + 1, leaf[3]);
    }
  p.rect(0, 0, 2, 20, ink[0]).rect(18, 0, 2, 20, ink[0]);
  return p;
}

/** An oak trunk, bark carved in long strokes (climb it). */
export function trunk(pal: Pal): Pixels {
  const b = pal.r('tBrown');
  const { ink } = press(pal);
  const p = paperBlock(pal);
  p.rect(4, 0, 12, 20, b[1]).rect(4, 0, 1, 20, ink[0]).rect(15, 0, 1, 20, ink[0]);
  for (let y = 1; y < 20; y += 4) p.rect(7 + (y % 3), y, 1, 3, b[0]).rect(11 - (y % 2), y + 2, 1, 3, b[0]);
  return p;
}

/** A branch in leaf: stand on it, jump up through it. */
export function branch(pal: Pal): Pixels {
  const { leaf, acc } = press(pal);
  const b = pal.r('tBrown');
  const p = paperBlock(pal);
  p.rect(0, 4, 20, 3, b[1]).rect(0, 6, 20, 1, b[0]);
  for (let x = 1; x < 20; x += 4) oval(p, x + 1, 2, 3, 2, x % 8 === 1 ? acc[2] : leaf[2]);
  for (let x = 3; x < 20; x += 6) oval(p, x, 10, 2, 2, leaf[1]);
  return p;
}

/** Roof shingles (a ledge). */
export function roof(pal: Pal): Pixels {
  const { ink, acc } = press(pal);
  const p = paperBlock(pal);
  p.rect(0, 0, 20, 9, acc[0]);
  for (let y = 0; y < 9; y += 3) {
    for (let x = (y / 3) % 2 ? 0 : 4; x < 20; x += 8) p.rect(x, y, 1, 3, ink[0]);
    p.rect(0, y + 2, 20, 1, ink[1]);
  }
  p.rect(0, 0, 20, 1, ink[0]);
  return p;
}

/** A house's clapboard siding, behind everything (walk in front of it). */
export function siding(pal: Pal): Pixels {
  const { ink, acc2 } = press(pal);
  const p = new Pixels(20, 20, acc2[2]);
  for (let y = 4; y < 20; y += 5) p.rect(0, y, 20, 1, ink[2]).rect(0, y + 1, 20, 1, acc2[1]);
  p.rect(13, 0, 1, 4, ink[2]).rect(5, 5, 1, 4, ink[2]).rect(15, 10, 1, 4, ink[2]).rect(8, 15, 1, 4, ink[2]);
  return p;
}

export { T };
