// VILLA.BBL: the house of Marcus Iocundus, poet, on the Esquiline. Two levels share it:
//   I. Canis Meus Flatum Dedit: the dining room (triclinium) at the banquet for the senators.
//      Pompeian red walls, columns, couches where the senators recline (and cough), tables (ledges)
//      laid with figs and olives, and under the head table, in shadow, Rufus the dog, asleep, from
//      whom the clouds come (sub mensa... in tenebris... sic venit pestilentia): his table gives
//      birth to them. The shutters are air that a touch throws open (counter 20: the air let in),
//      and the door out only opens with five. Teddy's CAVE CANEM mosaic is in the floor.
//   IV. Felis Fortissimus: the kitchen (culina) the same night, as Felix, the cat: the table,
//      the scrolls he climbs (ascendit librum) to the hanging lamp (saltat in lucernam), the
//      will on the shelf (stat in testamento: oops, nunc fractum est), cupboards a bump opens
//      (patefaciens armaria: a cheese inside each, counter 21), mouse holes, and on the end of
//      the table the crown of cheese (corona casei), which only crowns a cat with six.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt } from '../../../snowbound/src/art/draw';
import { micro, microWidth } from '../../../snowbound/src/art/font';
import type { Pal } from '../art/pal';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { AIR, AIR_NEEDED, CHEESE, CHEESE_NEEDED, MON } from '../ids';
import { BlockBook, GRAV, LEDGE, LIFE, SOLID, column, context, copy, cup, denarius, grapes, outside, sparkle, wreath } from './common';

/** Ticks between the clouds from under Rufus's table. */
const GAS_EVERY = 46;

export function buildVilla(pal: Pal): BlockBook {
  const x = context(pal);
  const { book, c, R, P, air } = x;

  book.add('outside', outside(x), { solid: SOLID });

  // ---------- I. the triclinium ----------
  /** Pompeian red panels framed in black, a thin gold line (the fourth style, near enough). */
  const wall = (seed: number, panel: 'red' | 'black' = 'red') => {
    const p = P();
    const r = rng(seed);
    for (let y = 0; y < 20; y++)
      for (let xx = 0; xx < 20; xx++)
        p.set(xx, y, shadeAt(R(panel === 'red' ? 'pompeii' : 'ink'), panel === 'red' ? 1 : 0, panel === 'red' ? 2 : 1, 0.5 + (r() - 0.5) * 0.3, xx, y));
    p.rect(0, 0, 1, 20, c('ink', 0))
      .rect(19, 0, 1, 20, c('ink', 0))
      .rect(2, 2, 16, 1, c('ochre', 2))
      .rect(2, 17, 16, 1, c('ochre', 2))
      .rect(2, 2, 1, 16, c('ochre', 2))
      .rect(17, 2, 1, 16, c('ochre', 2));
    if (panel === 'black') {
      // a slender painted candelabrum
      p.rect(10, 4, 1, 12, c('ochre', 3)).rect(7, 5, 7, 1, c('ochre', 3)).set(7, 4, c('flame', 2)).set(13, 4, c('flame', 2)).rect(8, 15, 5, 1, c('ochre', 2));
    }
    return p;
  };
  book.add('wall', wall(1), air);
  book.add('wallB', wall(2, 'black'), air);
  // the frieze under the ceiling: a band of ochre with a running wave
  const frieze = P().rect(0, 0, 20, 20, c('pompeii', 0));
  frieze.rect(0, 10, 20, 8, c('ochre', 1));
  for (let xx = 0; xx < 20; xx++) frieze.set(xx, 14 + Math.round(Math.sin(xx / 2) * 2), c('pompeii', 2));
  frieze.rect(0, 18, 20, 2, c('ink', 0)).rect(0, 9, 20, 1, c('gold', 0));
  book.add('frieze', frieze, air);
  // the walk row: a plain marble dado under a gold molding, calm behind the guests and the dogs
  const dado = (seed: number) => {
    const p = P();
    const r = rng(seed);
    for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) p.set(xx, y, shadeAt(R('marble'), 1, 2, 0.45 + (r() - 0.5) * 0.1 + y / 80, xx, y));
    p.rect(0, 0, 20, 1, c('ink', 0)).rect(0, 1, 20, 1, c('ochre', 3)).rect(0, 2, 20, 1, c('ochre', 1));
    p.rect(0, 18, 20, 2, c('marble', 0));
    return p;
  };
  const base = dado(3);
  book.add('base', base, air);
  // the floor: a mosaic (solid), black and white tesserae with a border; and Teddy's CAVE CANEM
  const mosaic = (dog: boolean) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) p.set(xx, y, (xx + y * 3) % 7 === 0 ? c('marble', 1) : c('marble', 3));
    p.rect(0, 0, 20, 2, c('ink', 0)).rect(0, 2, 20, 1, c('marble', 2));
    for (let xx = 0; xx < 20; xx += 4) p.rect(xx, 4, 2, 2, c('ink', 0));
    if (dog) {
      // a corgi in tesserae: big ears, a matched pair; CAVE over him and CANEM under
      blob(p, 10, 11, 5, 2.4, R('fur'), 1, 2);
      p.rect(4, 9, 3, 3, c('fur', 2)).line(4, 9, 3, 6, c('fur', 1)).line(6, 9, 6, 6, c('fur', 1)).set(3, 11, c('ink', 0)).set(5, 10, c('ink', 0));
      for (const lx of [7, 13]) p.rect(lx, 13, 1, 2, c('fur', 1));
      micro(p, 3, 0, 'CAVE', c('ink', 0));
      micro(p, 0, 15, 'CANEM', c('pompeii', 1));
    }
    return p;
  };
  book.add('floor', mosaic(false), { solid: SOLID });
  book.add('caveCanem', mosaic(true), { solid: SOLID });
  const under = P().rect(0, 0, 20, 20, c('stone', 1));
  for (let y = 0; y < 20; y += 5) under.rect(0, y, 20, 1, c('stone', 0));
  book.add('under', under, { solid: SOLID });
  // columns (scenery)
  book.add('colTop', column(x, frieze, true), air);
  book.add('col', column(x, wall(4)), air);
  book.add('colBase', column(x, base, false, true), air);
  // the shutters: a touch throws one open and lets the air in (counter 20)
  const shutter = (open: boolean) => {
    const p = wall(5, 'black');
    if (open) {
      p.rect(4, 3, 12, 14, c('blue', 0));
      for (const [sx, sy] of [
        [7, 6],
        [12, 5],
        [10, 11],
        [6, 13],
        [14, 12],
      ])
        p.set(sx, sy, c('marble', 3));
      p.disc(13, 8, 2, c('marble', 3)).disc(14, 7, 1.6, c('blue', 0));
      p.rect(1, 3, 3, 14, c('wood', 2)).rect(16, 3, 3, 14, c('wood', 2));
      // fresh air streaming in
      for (let k = 0; k < 3; k++) p.line(5, 7 + k * 3, 11, 6 + k * 3, c('steam', 2));
    } else {
      p.rect(4, 3, 12, 14, c('wood', 2)).rect(9, 3, 2, 14, c('wood', 0));
      for (let y = 5; y < 16; y += 2) p.rect(5, y, 4, 1, c('wood', 1)).rect(11, y, 4, 1, c('wood', 1));
      p.disc(8, 10, 0.8, c('bronze', 3)).disc(12, 10, 0.8, c('bronze', 3));
    }
    return p;
  };
  book.add('shutter', shutter(false), { ...air, effect: AIR, eamt: 1, score: 100, touch: 'shutterOpen' });
  book.add('shutterOpen', shutter(true), air);
  // the couches where the senators recline: two blocks wide (head end, foot end), coughing
  const couch = (half: 'L' | 'R', f: number) => {
    const p = copy(base);
    // the couch (lectus): a mattress on turned legs, a cushion at the head
    p.rect(0, 12, 20, 4, c('purple', 1)).rect(0, 12, 20, 1, c('purple', 2)).rect(0, 16, 20, 1, c('wood', 3));
    for (const lx of half === 'L' ? [2] : [17]) p.rect(lx, 17, 2, 3, c('wood', 2));
    if (half === 'L') {
      blob(p, 4, 10, 3, 2.4, R('ochre'), 1, 3);
      // a senator: bald, a laurel, a toga with the broad purple stripe, propped on an elbow
      blob(p, 12, 10, 7, 3, R('toga'), 1, 3);
      p.rect(9, 8, 8, 1, c('purple', 1));
      const hy = f ? 4 : 5;
      blob(p, 7, hy, 3.2, 3, R('skin'), 2, 4);
      p.set(6, hy, c('ink', 0))
        .set(8, hy, c('ink', 0))
        .line(4, hy - 2, 9, hy - 3, c('laurel', 2));
      if (f)
        p.rect(6, hy + 2, 3, 2, c('ink', 0))
          .set(10, hy, c('steam', 2))
          .set(12, hy - 1, c('steam', 1))
          .set(11, hy + 2, c('steam', 2));
      else p.rect(6, hy + 2, 3, 1, c('ink', 0));
      p.line(5, 9, 3, 12, c('skin', 2));
    } else {
      blob(p, 6, 10, 7, 2.6, R('toga'), 1, 3);
      p.rect(12, 10, 4, 2, c('skin', 2)).rect(16, 10, 2, 2, c('wood', 1));
    }
    return p;
  };
  book.add('senL0', couch('L', 0), { ...air, next: 'senL1', ntime: 33 });
  book.add('senL1', couch('L', 1), { ...air, next: 'senL0', ntime: 9 });
  book.add('senR', couch('R', 0), air);
  // the tables (mensae): a round marble top on a bronze leg (a ledge)
  const table = (rufus: boolean, f = 0) => {
    const p = copy(base);
    p.rect(1, 4, 18, 3, c('marble', 3)).rect(1, 4, 18, 1, c('marble', 2)).rect(2, 7, 16, 1, c('vein', 0));
    p.rect(9, 8, 2, 10, c('bronze', 2)).rect(5, 18, 10, 2, c('bronze', 1));
    if (rufus) {
      // Rufus, asleep in the shadow under it: a big red dog, one ear over his eyes, smug in sleep
      p.rect(0, 8, 20, 12, c('ink', 1));
      p.rect(9, 8, 2, 10, c('bronze', 1));
      blob(p, 10, 15, 8.4, 4, R('rufus'), 0, 2);
      blob(p, 4, 13, 3.6, 3, R('rufus'), 1, 3);
      p.line(2, 11, 1, 14, c('rufus', 0)).set(2, 13, c('ink', 0)).set(1, 15, c('ink', 0));
      p.line(15, 13, 19, 11 - f, c('rufus', 1));
      micro(p, 13, 9 - f, 'z', c('marble', 3));
    }
    return p;
  };
  book.add('table', table(false), { solid: LEDGE, grav: GRAV.down });
  book.add('rufusTable', table(true), { solid: LEDGE, grav: GRAV.down, birthMon: MON.gas, birthTime: GAS_EVERY });
  // food on the tables and shelves: figs and olives (points), grapes and a cup (dignity), denarii
  const figs = (bg: Pixels) => {
    const p = copy(bg);
    p.rect(3, 15, 14, 3, c('bronze', 2)).rect(4, 18, 12, 1, c('bronze', 1));
    for (const [fx, fy] of [
      [6, 13],
      [10, 12],
      [14, 13],
      [8, 10],
    ])
      blob(p, fx, fy, 2.2, 2.4, R('grape'), 0, 2);
    return p;
  };
  book.add('figs', figs(wall(6)), { score: 50, touch: 'wall' });
  const olives = (bg: Pixels) => {
    const p = copy(bg);
    p.rect(4, 16, 12, 2, c('marble', 2)).rect(5, 18, 10, 1, c('marble', 1));
    for (const [ox, oy] of [
      [6, 14],
      [9, 15],
      [12, 14],
      [14, 15],
      [8, 12],
      [11, 12],
    ])
      p.disc(ox, oy, 1.3, c('olive', (ox + oy) % 2 ? 1 : 2));
    return p;
  };
  book.add('olives', olives(wall(7)), { score: 50, touch: 'wall' });
  book.add('grapes', grapes(x, wall(8)), { hp: 20, score: 10, touch: 'wall' });
  book.add('cup', cup(x, wall(9)), { hp: 30, score: 10, touch: 'wall' });
  book.add('coin', denarius(x, wall(10)), { score: 100, touch: 'wall' });
  book.add('coinB', denarius(x, copy(base)), { score: 100, touch: 'base' });
  book.add('wreath', wreath(x, wall(11)), { effect: LIFE, eamt: 1, score: 500, touch: 'wall' });
  // a shelf on the wall (a ledge): the lararium, the household gods' shrine
  const shelf = (bg: Pixels, gods: boolean) => {
    const p = copy(bg);
    p.rect(0, 14, 20, 3, c('marble', 3)).rect(0, 14, 20, 1, c('marble', 2)).rect(3, 17, 2, 3, c('marble', 1)).rect(15, 17, 2, 3, c('marble', 1));
    if (gods) {
      p.rect(4, 3, 12, 11, c('ochre', 1)).line(3, 3, 10, 0, c('ochre', 2)).line(10, 0, 17, 3, c('ochre', 2));
      for (const gx of [7, 13]) p.rect(gx - 1, 6, 2, 6, c('bronze', 2)).disc(gx, 5, 1, c('bronze', 3));
    }
    return p;
  };
  book.add('shelf', shelf(wall(12), false), { solid: LEDGE, grav: GRAV.down });
  book.add('lararium', shelf(wall(13), true), { solid: LEDGE, grav: GRAV.down });
  // Lucius, green, leaning into the amphora; the amphora (solid)
  const lucius = (f: number) => {
    const p = copy(base);
    blob(p, 9, 14, 6, 6, R('toga'), 1, 3);
    p.rect(4, 13, 10, 1, c('purple', 1));
    const hx = 14 + f;
    blob(p, hx, 9 + f, 3.4, 3.2, R('gas'), 2, 3);
    p.set(hx + 1, 8 + f, c('ink', 0))
      .set(hx - 1, 8 + f, c('ink', 0))
      .rect(hx, 11 + f, 2, 1, c('ink', 0));
    p.line(12, 12, 18, 14, c('skin', 2));
    return p;
  };
  book.add('lucius0', lucius(0), { ...air, next: 'lucius1', ntime: 24 });
  book.add('lucius1', lucius(1), { ...air, next: 'lucius0', ntime: 12 });
  const amphora = copy(base);
  blob(amphora, 10, 11, 5, 7, R('tile'), 0, 3);
  amphora
    .rect(8, 1, 4, 4, c('tile', 2))
    .rect(7, 1, 6, 1, c('tile', 3))
    .line(6, 6, 6, 3, c('tile', 1))
    .line(14, 6, 14, 3, c('tile', 1))
    .rect(9, 17, 2, 3, c('tile', 1));
  book.add('amphora', amphora, { solid: SOLID });
  // a marble bust on its pedestal, laughing (the group's emblem): the pedestal is solid
  const bust = copy(wall(14));
  blob(bust, 10, 16, 6, 4, R('marble'), 1, 3);
  blob(bust, 10, 9, 4.4, 5, R('marble'), 1, 3);
  bust
    .set(8, 8, c('vein', 0))
    .set(12, 8, c('vein', 0))
    .line(8, 11, 12, 11, c('vein', 0))
    .set(7, 10, c('vein', 0))
    .set(13, 10, c('vein', 0))
    .rect(9, 12, 3, 1, c('vein', 1));
  for (let k = 0; k < 7; k++) bust.set(6 + k, 4 + (k % 2), c('laurel', 2));
  book.add('bust', bust, air);
  const pedestal = copy(base);
  pedestal.rect(4, 0, 12, 20, c('marble', 2)).rect(3, 0, 14, 2, c('marble', 3)).rect(3, 18, 14, 2, c('marble', 3)).rect(6, 4, 8, 10, c('marble', 1));
  micro(pedestal, 3, 7, 'RISI', c('ink', 0));
  book.add('pedestal', pedestal, { solid: SOLID });
  // the door out of the dining room: it opens once five shutters let the air out
  const door = (open: boolean, top: boolean) => {
    const p = top ? wall(15) : copy(base);
    if (top) {
      p.rect(2, 6, 16, 14, c('wood', 1)).rect(1, 4, 18, 2, c('marble', 3)).rect(5, 9, 10, 8, c('wood', 2));
      micro(p, 4, 0, 'EXI', c('ochre', 3));
      return p;
    }
    if (open) {
      p.rect(2, 0, 16, 20, c('blue', 0)).rect(2, 0, 2, 20, c('wood', 2)).rect(16, 0, 2, 20, c('wood', 2));
      for (let k = 0; k < 3; k++) p.line(6, 4 + k * 5, 14, 3 + k * 5, c('steam', 2));
      return p;
    }
    p.rect(2, 0, 16, 20, c('wood', 1)).rect(5, 2, 10, 7, c('wood', 2)).rect(5, 11, 10, 7, c('wood', 2)).disc(14, 10, 1.2, c('bronze', 3));
    micro(p, 8, 4, String(AIR_NEEDED), c('steam', 2));
    return p;
  };
  book.add('door', door(false, false), { solid: SOLID, effect: AIR, eamt: -AIR_NEEDED, score: 1000, touch: 'doorOpen' });
  book.add('doorOpen', door(true, false), { grav: GRAV.none });
  book.add('doorTop', door(false, true), air);
  // the way in (scenery): the atrium beyond
  const entry = copy(base);
  entry.rect(2, 0, 16, 20, c('stone', 3)).rect(2, 0, 2, 20, c('marble', 2)).rect(16, 0, 2, 20, c('marble', 2)).rect(6, 6, 8, 8, c('water', 2));
  book.add('entry', entry, air);
  const entryTop = wall(16);
  entryTop.rect(2, 6, 16, 14, c('stone', 3)).rect(1, 4, 18, 2, c('marble', 3)).rect(2, 6, 2, 14, c('marble', 2)).rect(16, 6, 2, 14, c('marble', 2));
  book.add('entryTop', entryTop, air);
  // a hanging oil lamp, flickering (scenery)
  const hanging = (f: number) => {
    const p = wall(17);
    p.rect(10, 0, 1, 7, c('bronze', 1)).rect(5, 7, 10, 3, c('bronze', 2)).rect(14, 6, 3, 2, c('bronze', 2));
    blob(p, 16 + (f ? 0.4 : -0.4), 3, 1.4, 2.4 + f * 0.4, R('flame'), 0, 3);
    return p;
  };
  book.add('hang0', hanging(0), { ...air, next: 'hang1', ntime: 5 });
  book.add('hang1', hanging(1), { ...air, next: 'hang0', ntime: 6 });

  // ---------- IV. the kitchen (culina) ----------
  /** Smoke-dark plaster, a few cracks; one oil lamp somewhere. */
  const kwall = (seed: number) => {
    const p = P();
    const r = rng(seed);
    for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) p.set(xx, y, shadeAt(R('stone'), 1, 2, 0.4 + (r() - 0.5) * 0.4 - y / 80, xx, y));
    for (let k = 0; k < 2; k++) {
      let cx = Math.floor(r() * 20);
      for (let y = Math.floor(r() * 10); y < 20 && cx >= 0 && cx < 20; y += 1) {
        p.set(cx, y, c('stone', 0));
        if (r() < 0.3) cx += r() < 0.5 ? -1 : 1;
        if (r() < 0.12) break;
      }
    }
    return p;
  };
  book.add('kwall', kwall(41), air);
  const beams = kwall(42);
  beams.rect(0, 0, 20, 7, c('wood', 0)).rect(0, 7, 20, 1, c('ink', 0));
  for (const hx of [5, 14]) beams.rect(hx, 8, 1, 4, c('wood', 2)).line(hx - 2, 12, hx + 2, 12, c('wood', 2));
  book.add('beams', beams, air);
  // hanging things under the beams: garlic, a ham, pots (scenery)
  const hangs = (what: 'garlic' | 'pots') => {
    const p = copy(beams);
    if (what === 'garlic')
      for (const [gx, gy] of [
        [4, 14],
        [6, 16],
        [8, 14],
      ])
        blob(p, gx, gy, 1.8, 2, R('marble'), 1, 3);
    else {
      blob(p, 14, 15, 4, 3, R('bronze'), 0, 3);
      p.rect(10, 13, 8, 1, c('bronze', 3));
    }
    return p;
  };
  book.add('garlic', hangs('garlic'), air);
  book.add('pots', hangs('pots'), air);
  const kbase = kwall(43);
  kbase.rect(0, 14, 20, 6, c('stone', 0)).rect(0, 14, 20, 1, c('stone', 3));
  book.add('kbase', kbase, air);
  // a mouse hole in the base of the wall (scenery: the mice tremble under the floor)
  const hole = copy(kbase);
  hole.disc(10, 19, 4, c('ink', 0)).rect(6, 19, 8, 1, c('ink', 0)).set(9, 17, c('eye', 0)).set(11, 17, c('eye', 0));
  book.add('hole', hole, air);
  // the kitchen floor: big stone flags (solid)
  const flags = P();
  for (let y = 0; y < 20; y++) for (let xx = 0; xx < 20; xx++) flags.set(xx, y, shadeAt(R('stone'), 1, 3, 0.5 + Math.sin(xx * 0.7 + y) * 0.08, xx, y));
  flags.rect(0, 0, 20, 1, c('stone', 4)).rect(10, 0, 1, 20, c('stone', 0)).rect(0, 10, 10, 1, c('stone', 0));
  book.add('kfloor', flags, { solid: SOLID });
  // the hearth (scenery, warm): its fire flickers
  const hearth = (f: number) => {
    const p = copy(kbase);
    p.rect(1, 6, 18, 14, c('stone', 0)).rect(0, 4, 20, 3, c('stone', 3)).rect(3, 9, 14, 11, c('ink', 0));
    for (let k = 0; k < 3; k++) blob(p, 6 + k * 4, 16 - ((k + f) % 2), 2, 3.4, R('flame'), 0, 3);
    p.rect(3, 18, 14, 2, c('wood', 1));
    return p;
  };
  book.add('hearth0', hearth(0), { ...air, next: 'hearth1', ntime: 4 });
  book.add('hearth1', hearth(1), { ...air, next: 'hearth0', ntime: 5 });
  // the kitchen table: its top a ledge, its legs scenery
  const ktop = kwall(44);
  ktop.rect(0, 13, 20, 4, c('wood', 3)).rect(0, 13, 20, 1, c('wood', 4)).rect(0, 17, 20, 1, c('wood', 1));
  book.add('ktop', ktop, { solid: LEDGE, grav: GRAV.down });
  const kleg = copy(kbase);
  kleg.rect(2, 0, 3, 20, c('wood', 2)).rect(15, 0, 3, 20, c('wood', 2));
  book.add('kleg', kleg, air);
  const klegHi = kwall(45);
  klegHi.rect(2, 0, 3, 20, c('wood', 2)).rect(15, 0, 3, 20, c('wood', 2));
  book.add('klegHi', klegHi, air);
  // the scrolls he climbs (ascendit librum): a stack of book rolls, one block (solid) and its top (a ledge)
  const scrolls = (top: boolean) => {
    const p = top ? kwall(46) : copy(kbase);
    const rows = top ? [12, 16] : [0, 4, 8, 12, 16];
    rows.forEach((y, k) => {
      const off = (k % 2) * 3;
      for (let sx = 1 + off; sx < 18; sx += 6) {
        p.rect(sx, y, 5, 4, c('toga', 2))
          .disc(sx + 1, y + 2, 1.4, c('ochre', 2))
          .set(sx + 1, y + 2, c('ink', 0));
      }
    });
    return p;
  };
  book.add('scrolls', scrolls(false), { solid: SOLID });
  book.add('scrollTop', scrolls(true), { solid: LEDGE, grav: GRAV.down });
  // the hanging lamp (lucerna) he jumps into: a ledge on its chain, its flame flickering
  const lucerna = (f: number) => {
    const p = kwall(47);
    p.rect(10, 0, 1, 9, c('bronze', 1)).rect(3, 9, 14, 4, c('bronze', 2)).rect(3, 9, 14, 1, c('bronze', 3)).rect(16, 8, 3, 2, c('bronze', 2));
    blob(p, 18, 5, 1.4, 2.6 + f * 0.4, R('flame'), 0, 3);
    return p;
  };
  book.add('lucerna0', lucerna(0), { solid: LEDGE, grav: GRAV.down, next: 'lucerna1', ntime: 5 });
  book.add('lucerna1', lucerna(1), { solid: LEDGE, grav: GRAV.down, next: 'lucerna0', ntime: 6 });
  // a wall shelf (a ledge), with jars on it or bare
  const kshelf = (jars: boolean) => {
    const p = kwall(48);
    if (jars)
      for (const [jx, col] of [
        [4, 'tile'],
        [10, 'bronze'],
        [15, 'tile'],
      ] as const)
        blob(p, jx, 9, 2.6, 4, R(col), 0, 3);
    p.rect(0, 13, 20, 3, c('wood', 3)).rect(0, 13, 20, 1, c('wood', 4)).rect(3, 16, 2, 4, c('wood', 1)).rect(15, 16, 2, 4, c('wood', 1));
    return p;
  };
  book.add('kshelf', kshelf(false), { solid: LEDGE, grav: GRAV.down });
  book.add('kshelfJars', kshelf(true), { solid: LEDGE, grav: GRAV.down });
  // the will (testamentum) on its wax tablets: step on it, oops, now it's broken (points)
  const will = (broken: boolean) => {
    const p = kwall(49);
    if (!broken) {
      p.rect(3, 6, 14, 10, c('wood', 2)).rect(4, 7, 12, 8, c('ochre', 0));
      for (let y = 8; y < 15; y += 2) p.rect(5, y, 10, 1, c('ink', 0));
      micro(p, 2, 0, 'TEST', c('ochre', 3));
    } else {
      p.rect(2, 12, 7, 6, c('wood', 2)).rect(11, 13, 7, 5, c('wood', 2)).line(8, 12, 11, 18, c('ink', 0));
      micro(p, 4, 3, 'OOPS', c('marble', 3));
    }
    return p;
  };
  book.add('will', will(false), { ...air, score: 250, touch: 'willBroken' });
  book.add('willBroken', will(true), air);
  // the cupboards (armaria): bump one open and its cheese is yours (counter 21)
  const armarium = (open: boolean, low: boolean) => {
    const p = low ? copy(kbase) : kwall(50);
    p.rect(1, 1, 18, 19, c('wood', 1)).rect(1, 1, 18, 2, c('wood', 3));
    if (open) {
      p.rect(3, 4, 14, 15, c('ink', 0)).rect(3, 11, 14, 1, c('wood', 2));
      p.rect(0, 3, 3, 16, c('wood', 2)).rect(17, 3, 3, 16, c('wood', 2));
      blob(p, 8, 8, 2.6, 2, R('ochre'), 0, 2);
    } else {
      p.rect(3, 4, 6, 15, c('wood', 2)).rect(11, 4, 6, 15, c('wood', 2)).disc(9, 11, 0.9, c('bronze', 3)).disc(11, 11, 0.9, c('bronze', 3));
      // a wedge of cheese drawn on the door, so you know
      p.rect(12, 6, 4, 3, c('cheese', 2)).set(13, 7, c('cheese', 0));
    }
    return p;
  };
  book.add('armarium', armarium(false, false), { solid: SOLID, effect: CHEESE, eamt: 1, score: 100, touch: 'armOpen' });
  book.add('armOpen', armarium(true, false), air);
  book.add('armariumLow', armarium(false, true), { solid: SOLID, effect: CHEESE, eamt: 1, score: 100, touch: 'armOpenLow' });
  book.add('armOpenLow', armarium(true, true), air);
  // a milk bowl on the floor (dignity back) and fish bones (points)
  const bowl = copy(kbase);
  bowl.rect(4, 15, 12, 4, c('tile', 2)).rect(3, 14, 14, 2, c('tile', 3)).rect(5, 14, 10, 1, c('marble', 3));
  book.add('milk', bowl, { hp: 30, score: 10, touch: 'kbase' });
  const bones = copy(kwall(51));
  bones.line(4, 12, 15, 12, c('marble', 3)).disc(16, 12, 2, c('marble', 2));
  for (let k = 0; k < 4; k++) bones.line(6 + k * 2, 9, 7 + k * 2, 15, c('marble', 2));
  bones.line(2, 9, 4, 12, c('marble', 2)).line(2, 15, 4, 12, c('marble', 2));
  book.add('bones', bones, { score: 50, touch: 'kwall' });
  // the crown of cheese at the end of the table: it crowns a cat with six cheeses (and is his)
  const corona = (won: boolean) => {
    const p = kwall(52);
    p.rect(0, 13, 20, 4, c('wood', 3)).rect(0, 13, 20, 1, c('wood', 4));
    blob(p, 10, 9, 8, 4, R('cheese'), 1, 3);
    for (let k = 0; k < 5; k++) p.line(3 + k * 3.5, 6, 4 + k * 3.5, 2, c('cheese', 3)).set(4 + k * 3.5, 1, c('gold', 3));
    p.set(7, 9, c('cheese', 0)).set(12, 10, c('cheese', 0)).set(15, 8, c('cheese', 0));
    if (won) sparkle(x, p, 53, 6);
    else micro(p, Math.round(10 - microWidth(String(CHEESE_NEEDED)) / 2), 8, String(CHEESE_NEEDED), c('ink', 0));
    return p;
  };
  book.add('corona', corona(false), { solid: SOLID, effect: CHEESE, eamt: -CHEESE_NEEDED, score: 2000, touch: 'crowned' });
  book.add('crowned', corona(true), { grav: GRAV.none });
  // the tin heart, on the kitchen floor under the shelf (points only, no sound of its own)
  for (let k = 0; k < SHINE_FRAMES; k++)
    book.add(
      `tinHeart${k || ''}`,
      drawTinHeart(copy(kbase), { ink: c('ink', 0), tin: [c('iron', 0), c('iron', 1), c('iron', 2)], white: c('marble', 3), dark: c('grey', 0) }, k),
      {
        score: 100,
        touch: 'kbase',
        grav: GRAV.down,
        next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`,
        ntime: k ? 2 : 50,
      },
    );
  return book;
}
