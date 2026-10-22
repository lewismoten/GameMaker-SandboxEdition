// The four block sets of Ebenezer Baker's kitchen: KITCHEN (tile and cabinets), CELLAR (stone
// and barrels), PARLOR (oak and wallpaper) and WORKS (pipes and belts). Every set holds the
// same kinds of block under the same names, drawn in the role ramps (floor, wall, wood...), so
// a room's ASCII map reads the same in any set and its palette decides how it looks.
//
// What Ebenezer built into every room to keep the Redcoats out (and what it does in Game-Maker):
//   false walls     look like walls, are not solid
//   glass           looks like floor, is solid (a very clean pane)
//   swing doors     solid on three sides: they only let you through one way
//   belts, grease   gravity: belts show it, greased boards do not (a false floor)
//   mousetraps      a false floor that bites (hit points) and stays sprung (touch block)
//   latches         refuse the touch until a spoon is carried (counter 20), then open
//   timed panels    next/ntime chains in two phases, so the maze changes shape as you walk it
//   risers          a chain that ends solid: dough that proofs shut after a while
//   openers         a chain that ends open: ice that thaws, a door on a timer
//   hot floors      a chain whose middle block hurts: burners, steam grates, live wires
//   spouts          blocks that give birth to monster 10..13 (whatever this room makes of it)
import { Pixels, rng } from '../../../kit/pixels';
import { bevel, blob, micro, outline, shadeAt } from '../art/draw';
import { blank, cap, chickenItem, eggFaberge, eggRotten, float, ingredient, kazoo, on, pie, spoon, tricorn } from '../art/kit';
import { c, r } from '../art/pal';
import { CTR, MON } from '../ids';
import { BlockSet, GRAV, SOLBOT, SOLID, SOLLEF, SOLRIG, SOLTOP } from './sets';

export type Style = 'kitchen' | 'cellar' | 'parlor' | 'works';

/** Which ingredients each set's rooms hold (the WORKS also has the Vault's thirteenth). */
export const SET_INGREDIENTS: Record<Style, number[]> = {
  kitchen: [1, 4, 7],
  cellar: [2, 5, 8],
  parlor: [3, 6, 9],
  works: [10, 11, 12, 13],
};

/** Timings, in 18.2 Hz ticks. */
export const TIMING = {
  /** A timed panel stays shut, then open, this long (a short warning between). */
  panel: 46,
  warn: 8,
  /** Risers proof shut this long after the room starts. */
  riser: { kitchen: 728, cellar: 546, parlor: 910, works: 637 } as Record<Style, number>,
  /** Openers open this long after the room starts. */
  opener: { kitchen: 364, cellar: 455, parlor: 364, works: 546 } as Record<Style, number>,
  hot: { off: 38, warm: 10, on: 26 },
  /** Ticks between a spout's births. */
  spout: 40,
};

/** One touch of a hot floor or a mousetrap and Doc Leo plays dead (the room starts over). */
export const HOT_DAMAGE = -100;
export const TRAP_DAMAGE = -100;

// ------------------------------------------------------------------ drawing

const px = () => new Pixels(20, 20);

function floorPx(style: Style, alt: boolean, seed = 1): Pixels {
  const p = px();
  const R = rng(seed * 31 + (alt ? 7 : 3));
  switch (style) {
    case 'kitchen': {
      // big checkerboard tiles, a grout line, a little shine
      const k = alt ? r('floor2') : r('floor');
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(k, alt ? 2 : 3, alt ? 3 : 4, 0.5 + (x - y) / 60, x, y));
      p.rect(0, 0, 20, 1, c('floor', 1)).rect(0, 0, 1, 20, c('floor', 1));
      p.set(4, 3, c('floor', 5)).set(5, 3, c('floor', 5)).set(4, 4, c('floor', 5));
      break;
    }
    case 'cellar':
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const edge = (y === 0 || x === 0 || (y === 10 && x < 12) || (x === 12 && y > 0) || (x === 6 && y > 10)) && !alt;
          p.set(x, y, edge ? c('floor', 1) : R() < 0.15 ? c('floor', 2) : R() < 0.1 ? c('floor', 4) : c('floor', 3));
        }
      if (alt) for (let i = 0; i < 6; i++) p.set(R() * 20, R() * 20, c('floor2', 1));
      break;
    case 'parlor':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(r('floor'), 2, 4, 0.45 + 0.3 * Math.sin(y * 0.8 + x * 0.12 + seed), x, y));
      for (const x of [0, 5, 10, 15]) p.rect(x, 0, 1, 20, c('floor', 1));
      p.rect(alt ? 5 : 10, alt ? 12 : 4, 5, 1, c('floor', 1));
      break;
    case 'works':
      p.rect(0, 0, 20, 20, c('floor', 2));
      for (let y = 1; y < 20; y += 4) for (let x = 1; x < 20; x += 4) p.rect(x, y, 2, 2, alt ? c('floor', 4) : c('floor', 3));
      p.rect(0, 0, 20, 1, c('floor', 1)).rect(0, 0, 1, 20, c('floor', 1));
      break;
  }
  return p;
}

/** A wall seen from above (its top). */
function wallTop(style: Style, seed = 1): Pixels {
  const p = px();
  const R = rng(seed + 11);
  switch (style) {
    case 'kitchen':
      bevel(p, 0, 0, 20, 20, r('wall'), 3, 1);
      p.rect(0, 9, 20, 1, c('wall', 2)).rect(9, 0, 1, 20, c('wall', 2));
      break;
    case 'cellar':
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, R() < 0.25 ? c('wall', 1) : R() < 0.2 ? c('wall', 3) : c('wall', 2));
      p.rect(0, 0, 20, 1, c('wall', 4));
      break;
    case 'parlor':
      // the top of a paneled wall: dark wood with a brass-edged cap
      p.rect(0, 0, 20, 20, c('wood', 0));
      p.rect(2, 2, 16, 16, c('wood', 1)).frame(2, 2, 16, 16, c('trim', 1));
      break;
    case 'works':
      bevel(p, 0, 0, 20, 20, r('wall'), 2, 1);
      for (const [x, y] of [
        [3, 3],
        [16, 3],
        [3, 16],
        [16, 16],
      ])
        p.set(x, y, c('wall', 5));
      break;
  }
  return p;
}

/** A wall's front face, where there is floor below it. */
function wallFace(style: Style, seed = 1): Pixels {
  const p = wallTop(style, seed);
  const R = rng(seed + 5);
  switch (style) {
    case 'kitchen':
      // white subway tiles with a chair rail
      for (let y = 6; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, y % 4 === 1 || (x + (Math.floor(y / 4) % 2) * 5) % 10 === 0 ? c('wall', 2) : c('wall', 4));
      p.rect(0, 5, 20, 2, c('trim', 3)).rect(0, 19, 20, 1, c('dark', 1));
      break;
    case 'cellar':
      for (let y = 5; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const row = Math.floor((y - 5) / 5);
          const edge = (y - 5) % 5 === 4 || (x + (row % 2) * 6) % 12 === 0;
          p.set(x, y, edge ? c('wall', 0) : R() < 0.2 ? c('wall', 3) : c('wall', 2));
        }
      p.rect(0, 19, 20, 1, c('dark', 0));
      break;
    case 'parlor':
      // wallpaper with a stripe of little flowers, and wainscot
      for (let y = 4; y < 14; y++) for (let x = 0; x < 20; x++) p.set(x, y, x % 5 === 2 ? c('wall', 3) : c('wall', 4));
      for (let x = 2; x < 20; x += 5) p.set(x, 7, c('accent', 3)).set(x, 11, c('accent', 2));
      p.rect(0, 14, 20, 6, c('wood', 2)).rect(0, 14, 20, 1, c('wood', 4)).rect(4, 16, 4, 3, c('wood', 1)).rect(12, 16, 4, 3, c('wood', 1));
      p.rect(0, 3, 20, 1, c('trim', 3));
      break;
    case 'works':
      p.rect(0, 6, 20, 14, c('wall', 2));
      for (let x = 0; x < 20; x += 5) p.rect(x, 6, 1, 14, c('wall', 1));
      p.rect(0, 6, 20, 1, c('wall', 4)).rect(0, 12, 20, 2, c('metal', 2)).rect(0, 12, 20, 1, c('metal', 4));
      for (let x = 2; x < 20; x += 5) p.set(x, 9, c('wall', 5)).set(x, 16, c('wall', 5));
      break;
  }
  return p;
}

/** Solid furniture: four props per set. */
function prop(style: Style, i: number, base: Pixels): Pixels {
  const p = on(base);
  const S = (x: number, y: number, w: number, h: number) => p.rect(x + 2, y + 2, w, h, c('dark', 0));
  if (style === 'kitchen') {
    if (i === 0) {
      // a counter: butcher block top, cabinet front
      S(0, 2, 20, 18);
      bevel(p, 0, 0, 20, 8, r('trim'), 3, 1);
      bevel(p, 0, 8, 20, 12, r('wood'), 2, 1);
      p.rect(9, 10, 2, 8, c('wood', 1)).set(7, 13, c('metal', 4)).set(12, 13, c('metal', 4));
    } else if (i === 1) {
      // a cabinet with a flour sack on it
      bevel(p, 0, 0, 20, 20, r('wood'), 3, 1);
      p.frame(3, 3, 14, 14, c('wood', 1));
      blob(p, 10, 8, 6, 5, [c('paper', 2), c('paper', 3), c('paper', 4)], 0, 2);
      micro(p, 5, 7, 'FLOUR', c('wood', 0));
    } else if (i === 2) {
      // a sink
      bevel(p, 0, 0, 20, 20, r('metal'), 3, 1);
      p.rect(3, 3, 14, 12, c('metal', 1)).rect(4, 4, 12, 10, c('liquid', 3)).rect(9, 1, 2, 4, c('metal', 4));
    } else {
      // shelves of jars
      bevel(p, 0, 0, 20, 20, r('wood'), 2, 1);
      for (const y of [2, 10]) {
        p.rect(0, y + 7, 20, 1, c('wood', 4));
        for (let x = 2; x < 18; x += 5) p.rect(x, y + 1, 4, 6, c('glass', 3)).rect(x, y + 3, 4, 4, c(['accent', 'liquid', 'floor2'][(x + y) % 3], 2));
      }
    }
  } else if (style === 'cellar') {
    if (i === 0) {
      // a barrel
      S(3, 1, 15, 18);
      blob(p, 10, 10, 8, 9, r('wood'), 1, 5);
      p.rect(2, 4, 16, 1, c('metal', 1)).rect(2, 15, 16, 1, c('metal', 1));
    } else if (i === 1) {
      // a crate, stencilled
      bevel(p, 1, 1, 18, 18, r('wood'), 3, 1);
      p.line(2, 2, 17, 17, c('wood', 1)).line(17, 2, 2, 17, c('wood', 1));
      micro(p, 3, 8, 'NOT TEA', c('dark', 0));
    } else if (i === 2) {
      // sacks
      blob(p, 6, 11, 6, 7, [c('trim', 1), c('trim', 2), c('trim', 3)], 0, 2);
      blob(p, 14, 12, 6, 6, [c('trim', 1), c('trim', 2), c('trim', 3), c('trim', 4)], 0, 3);
      p.line(5, 5, 7, 5, c('trim', 0));
    } else {
      // a wine rack (it is root beer)
      p.rect(0, 0, 20, 20, c('wood', 1));
      for (let y = 2; y < 20; y += 6) for (let x = 2; x < 20; x += 6) p.disc(x + 2, y + 2, 2.2, c('rootbeer', 1)).set(x + 1, y + 1, c('rootbeer', 3));
    }
  } else if (style === 'parlor') {
    if (i === 0) {
      // a table with a lace runner
      S(0, 2, 20, 16);
      bevel(p, 0, 1, 20, 16, r('wood'), 3, 1);
      p.rect(4, 1, 12, 16, c('paper', 4));
      for (let y = 2; y < 17; y += 3) p.set(4, y, c('paper', 2)).set(15, y, c('paper', 2));
    } else if (i === 1) {
      // a bookcase
      p.rect(0, 0, 20, 20, c('wood', 1));
      for (const y of [1, 10]) for (let x = 1; x < 19; x += 3) p.rect(x, y, 2, 8, c(['accent', 'wall', 'trim', 'floor2'][x % 4], 2 + (x % 2)));
    } else if (i === 2) {
      // a grandfather clock
      p.rect(4, 0, 12, 20, c('wood', 1)).rect(5, 1, 10, 18, c('wood', 2));
      p.disc(10, 6, 4, c('paper', 4)).ring(10, 6, 4, c('trim', 3)).line(10, 6, 10, 3, c('ink', 0)).line(10, 6, 7, 6, c('ink', 0));
      p.rect(9, 11, 2, 6, c('trim', 3)).disc(10, 16, 1.6, c('trim', 4));
    } else {
      // a china hutch
      bevel(p, 0, 0, 20, 20, r('wood'), 2, 1);
      for (let x = 2; x < 18; x += 6) p.disc(x + 2, 6, 2.5, c('paper', 4)).ring(x + 2, 6, 2.5, c('accent', 3));
      p.rect(2, 12, 16, 6, c('wood', 1));
    }
  } else {
    if (i === 0) {
      // a pipe junction
      p.rect(0, 7, 20, 6, c('metal', 2)).rect(0, 7, 20, 1, c('metal', 4)).rect(7, 0, 6, 20, c('metal', 2)).rect(7, 0, 1, 20, c('metal', 4));
      p.disc(10, 10, 4, c('trim', 3)).disc(10, 10, 2, c('trim', 1));
    } else if (i === 1) {
      // a copper tank
      S(2, 2, 16, 16);
      blob(p, 10, 10, 8, 8, r('trim'), 0, 4);
      p.rect(2, 9, 16, 1, c('trim', 0)).disc(10, 5, 1.5, c('trim', 4));
    } else if (i === 2) {
      // a gauge panel
      bevel(p, 0, 0, 20, 20, r('metal'), 2, 1);
      p.disc(6, 7, 3.5, c('paper', 4)).line(6, 7, 8, 5, c('accent', 2)).disc(14, 7, 3.5, c('paper', 4)).line(14, 7, 12, 9, c('accent', 2));
      p.rect(3, 13, 14, 3, c('dark', 1)).set(5, 14, c('green', 4)).set(9, 14, c('red', 3));
    } else {
      // crates of empties
      bevel(p, 0, 0, 20, 20, r('wood'), 3, 1);
      for (let y = 2; y < 18; y += 5) for (let x = 2; x < 18; x += 5) p.disc(x + 2, y + 2, 1.8, c('glass', 2)).set(x + 1, y + 1, c('glass', 3));
    }
  }
  return p;
}

/** A swinging door (kitchen doors only push one way): an arrow says which. */
function swingDoor(base: Pixels, dir: 'e' | 'w' | 'n' | 's'): Pixels {
  const p = on(base);
  const horiz = dir === 'e' || dir === 'w';
  if (horiz) p.rect(8, 0, 4, 20, c('wood', 3)).rect(8, 0, 1, 20, c('wood', 5)).rect(9, 8, 2, 4, c('metal', 4));
  else p.rect(0, 8, 20, 4, c('wood', 3)).rect(0, 8, 20, 1, c('wood', 5)).rect(8, 9, 4, 2, c('metal', 4));
  const a = c('accent', 3);
  const arrow: Record<string, [number, number][]> = {
    e: [
      [14, 10],
      [13, 9],
      [13, 11],
      [12, 8],
      [12, 12],
    ],
    w: [
      [5, 10],
      [6, 9],
      [6, 11],
      [7, 8],
      [7, 12],
    ],
    n: [
      [10, 5],
      [9, 6],
      [11, 6],
      [8, 7],
      [12, 7],
    ],
    s: [
      [10, 14],
      [9, 13],
      [11, 13],
      [8, 12],
      [12, 12],
    ],
  };
  for (const [x, y] of arrow[dir]) p.set(x, y, a);
  if (horiz) p.rect(dir === 'e' ? 3 : 14, 10, 4, 1, a);
  else p.rect(10, dir === 's' ? 3 : 14, 1, 4, a);
  return p;
}

/** A belt (two frames, the chevrons crawl along). */
function belt(dir: 'e' | 'w' | 'n' | 's', frame: number): Pixels {
  const p = px();
  const horiz = dir === 'e' || dir === 'w';
  p.rect(0, 0, 20, 20, c('metal', 1));
  if (horiz) p.rect(0, 2, 20, 16, c('dark', 1)).rect(0, 2, 20, 1, c('metal', 3)).rect(0, 17, 20, 1, c('metal', 3));
  else p.rect(2, 0, 16, 20, c('dark', 1)).rect(2, 0, 1, 20, c('metal', 3)).rect(17, 0, 1, 20, c('metal', 3));
  const k = c('hazard', 3);
  for (let i = 0; i < 2; i++) {
    const o = ((i * 10 + frame * 5) % 20) - 2;
    for (let j = -3; j <= 3; j++) {
      const a = o + 3 - Math.abs(j);
      if (dir === 'e') p.set(a, 10 + j, k);
      if (dir === 'w') p.set(19 - a, 10 + j, k);
      if (dir === 's') p.set(10 + j, a, k);
      if (dir === 'n') p.set(10 + j, 19 - a, k);
    }
  }
  return p;
}

/** A timed panel in stage 0 shut, 1 lowering, 2 open, 3 rising. */
function panel(style: Style, base: Pixels, stage: number, phase: 'a' | 'b'): Pixels {
  const p = on(base);
  const h = [20, 8, 0, 8][stage];
  const tone = phase === 'a' ? 'accent' : 'trim';
  // the slot in the floor it rises from
  p.rect(1, 17, 18, 2, c('dark', 0)).rect(1, 17, 18, 1, c(tone, 1));
  if (h) {
    const top = 20 - h;
    bevel(p, 1, top, 18, h, r(tone), 2, 1);
    for (let y = top + 2; y < 20; y += 4) p.rect(3, y, 14, 1, c(tone, 1));
    if (style === 'parlor' && h === 20) p.disc(10, 7, 3, c('paper', 4)).line(10, 7, 10, 5, c('ink', 0)).line(10, 7, 12, 7, c('ink', 0));
    else if (h === 20) micro(p, phase === 'a' ? 9 : 9, 3, phase === 'a' ? '1' : '2', c(tone, 4));
  }
  return p;
}

/** A riser (dough proofing, foam, a shutter) at stage 0 low, 1 rising, 2 shut. */
function riser(style: Style, base: Pixels, stage: number): Pixels {
  const p = on(base);
  const ramp = style === 'kitchen' ? [c('paper', 1), c('paper', 2), c('paper', 3), c('paper', 4)] : style === 'cellar' ? [c('foam', 0), c('foam', 1), c('foam', 2), c('paper', 4)] : r('trim');
  if (style === 'kitchen' || style === 'cellar') {
    // a bowl of dough (or a tub of foam) that grows
    if (stage === 0) blob(p, 10, 14, 6, 3, ramp, 0, 3);
    if (stage === 1) blob(p, 10, 12, 8, 6, ramp, 0, 3);
    if (stage === 2) {
      blob(p, 10, 10, 10, 10, ramp, 0, 3);
      p.set(6, 6, c('paper', 4)).set(13, 8, ramp[0]).set(8, 13, ramp[0]);
    }
    p.rect(3, 16, 14, 4, c('wood', 2)).rect(3, 16, 14, 1, c('wood', 4));
  } else {
    const h = [3, 10, 20][stage];
    bevel(p, 0, 20 - h, 20, h, ramp, 2, 1);
    if (stage === 2) for (let y = 3; y < 20; y += 5) p.rect(2, y, 16, 1, ramp[0]);
  }
  return p;
}

/** An opener (ice that thaws, a door on a timer) at stage 0 shut, 1 going, 2 open. */
function opener(style: Style, base: Pixels, stage: number): Pixels {
  const p = on(base);
  if (stage === 2) {
    if (style === 'cellar') p.rect(4, 12, 12, 4, c('glass', 2)).rect(5, 12, 6, 1, c('glass', 3));
    return p;
  }
  if (style === 'cellar') {
    // a block of ice, cracking as it thaws
    bevel(p, 0, stage, 20, 20 - stage, r('glass'), 2, 1);
    p.line(4, 4, 8, 9, c('glass', 3)).line(8, 9, 6, 15, c('glass', 3));
    if (stage === 1) p.line(12, 2, 15, 10, c('glass', 0)).line(15, 10, 11, 18, c('glass', 0)).rect(2, 17, 16, 3, c('glass', 3));
  } else {
    // a door with a kitchen timer on it
    bevel(p, 0, 0, 20, 20, r('wood'), 2, 1);
    p.disc(10, 8, 4, c('paper', 4)).ring(10, 8, 4, c('accent', 2)).line(10, 8, 10, 5, c('ink', 0));
    if (stage === 1) p.line(10, 8, 13, 8, c('accent', 3)).rect(2, 14, 16, 2, c('hazard', 3));
  }
  return p;
}

/** A hot floor (a burner, a steam grate, a live wire plate) at stage 0 off, 1 warming, 2 on. */
function hot(style: Style, base: Pixels, stage: number): Pixels {
  const p = on(base);
  const glow = [c('dark', 1), c('hazard', 1), c('hazard', 4)][stage];
  if (style === 'kitchen' || style === 'parlor') {
    p.ring(10, 10, 7, c('metal', 1)).ring(10, 10, 5, glow).ring(10, 10, 3, glow).ring(10, 10, 6, c('metal', 2));
    if (stage === 2) p.ring(10, 10, 4, c('hazard', 3)).disc(10, 10, 1.5, c('hazard', 3));
  } else if (style === 'cellar') {
    p.rect(2, 2, 16, 16, c('metal', 1));
    for (let y = 4; y < 17; y += 3) p.rect(3, y, 14, 1, glow);
    if (stage === 2) blob(p, 10, 6, 6, 5, [c('foam', 0), c('foam', 1), c('foam', 2)], 0, 2);
  } else {
    p.rect(2, 2, 16, 16, c('metal', 2)).frame(2, 2, 16, 16, c('metal', 4));
    p.line(5, 4, 9, 10, glow).line(9, 10, 7, 11, glow).line(7, 11, 13, 16, glow);
    if (stage === 2) p.line(4, 4, 8, 10, c('hazard', 3)).line(12, 16, 16, 12, c('hazard', 3)).rect(1, 1, 2, 2, c('hazard', 4)).rect(17, 17, 2, 2, c('hazard', 4));
  }
  return p;
}

/** A spout: a solid thing that gives birth to whatever this room's monster 10..13 is. */
function spout(style: Style, base: Pixels, dir: 'e' | 'w' | 's' | 'n'): Pixels {
  const p = on(base);
  const m = { e: [16, 8], w: [0, 8], s: [8, 16], n: [8, 0] }[dir];
  if (style === 'kitchen') {
    // an oven, door toward the way it fires
    bevel(p, 0, 0, 20, 20, r('metal'), 2, 1);
    p.rect(3, 3, 14, 14, c('dark', 0)).rect(5, 5, 10, 10, c('hazard', 2)).rect(6, 6, 8, 3, c('hazard', 4));
  } else if (style === 'cellar') {
    // a keg on its side
    blob(p, 10, 10, 9, 8, r('wood'), 1, 5);
    p.rect(3, 4, 1, 12, c('metal', 1)).rect(16, 4, 1, 12, c('metal', 1));
  } else if (style === 'parlor') {
    // a teapot on a trivet
    blob(p, 10, 11, 7, 6, [c('paper', 2), c('paper', 3), c('paper', 4)], 0, 2);
    p.ring(10, 11, 7, c('accent', 2)).disc(10, 4, 1.5, c('accent', 3));
  } else {
    // a capper on the bottling line
    bevel(p, 0, 0, 20, 20, r('metal'), 3, 1);
    p.rect(6, 2, 8, 9, c('trim', 2)).rect(8, 11, 4, 4, c('metal', 1)).disc(10, 16, 2, c('accent', 3));
  }
  p.rect(m[0], m[1], 4, 4, c('dark', 0)).rect(m[0] + 1, m[1] + 1, 2, 2, c('hazard', 3));
  return p;
}

/** A spoon latch: a door held shut by a little wooden-spoon latch. */
function latch(base: Pixels, open: boolean): Pixels {
  const p = on(base);
  if (open) {
    p.rect(0, 0, 3, 20, c('wood', 1)).rect(17, 0, 3, 20, c('wood', 1)).rect(1, 18, 18, 2, c('dark', 1));
    return p;
  }
  bevel(p, 0, 0, 20, 20, r('wood'), 3, 2);
  p.rect(3, 3, 14, 6, c('wood', 2)).rect(3, 11, 14, 6, c('wood', 2));
  // the latch: a spoon-shaped keyhole
  p.rect(12, 8, 6, 4, c('metal', 3)).disc(14, 10, 1.6, c('dark', 0)).rect(14, 10, 4, 1, c('dark', 0));
  return p;
}

/** A mousetrap: hidden (just floor), armed (you can see it) or sprung. */
function trap(base: Pixels, state: 'armed' | 'sprung'): Pixels {
  const p = on(base);
  p.rect(3, 6, 14, 9, c('wood', 3)).rect(3, 6, 14, 1, c('wood', 5)).rect(3, 14, 14, 1, c('wood', 1));
  if (state === 'armed') p.rect(5, 7, 1, 7, c('metal', 4)).rect(5, 7, 7, 1, c('metal', 4)).rect(12, 9, 3, 3, c('yellow', 2));
  else p.rect(13, 7, 1, 7, c('metal', 4)).rect(7, 13, 7, 1, c('metal', 4)).set(9, 10, c('paper', 4)).set(10, 9, c('paper', 4));
  return p;
}

/** The stair Doc Leo comes down by, and the dumbwaiter's empty hatch. */
function stairs(base: Pixels): Pixels {
  const p = on(base);
  for (let i = 0; i < 5; i++) p.rect(2 + i, 2 + i * 3, 16 - i * 2, 3, c('wood', 4 - (i % 3)));
  p.rect(2, 17, 16, 1, c('dark', 1));
  return p;
}

/** A 3x5-font sign cut into `blocks` blocks (5 characters a block), on a board of `board`. */
export function signBlocks(lines: string[], blocks: number, base: Pixels, board = 'paper'): Pixels[] {
  const W = blocks * 20;
  const p = new Pixels(W, 20);
  for (let i = 0; i < blocks; i++) p.blit(base, i * 20, 0);
  p.rect(2, 1, W - 3, 19, c('dark', 0));
  p.rect(1, 0, W - 3, 19, c(board, 3)).rect(1, 0, W - 3, 1, c(board, 4)).frame(1, 0, W - 3, 19, c('wood', 1));
  const top = Math.round((19 - lines.length * 6) / 2) + 1;
  lines.forEach((t, i) => {
    if (t.length * 4 - 1 > W - 4) throw new Error(`Sign line too long: ${t}`);
    micro(p, Math.round((W - (t.length * 4 - 1)) / 2), top + i * 6, t, c('ink', 0));
  });
  return Array.from({ length: blocks }, (_, i) => p.crop(i * 20, 0, 20, 20));
}

/** The jokes on the walls, per set: [name, lines, blocks]. */
const SIGNS: Record<Style, [string, string[], number][]> = {
  kitchen: [
    ['signRedcoats', ['NO REDCOATS', 'BEYOND THIS', 'POINT'], 3],
    ['signLean', ['LEAN ON', 'THINGS'], 2],
    ['signShh', ['WHAT', 'RECIPE?'], 2],
    ['signDough', ['DOUGH', 'RISING'], 2],
  ],
  cellar: [
    ['signNorth', ['NORTH SIDE', 'OF THE TREE', 'ONLY'], 3],
    ['signCold', ['KEEP', 'COOL'], 2],
    ['signGerald', ['DO NOT', 'FEED', 'GERALD'], 2],
    ['signNotHere', ['NOTHING', 'DOWN', 'HERE'], 2],
  ],
  parlor: [
    ['signTuesday', ['TAKEN ON A', 'TUESDAY'], 3],
    ['signStir', ['STIR', 'COUNTER', 'CLOCKWISE'], 3],
    ['signTea', ['TEA IS', 'FOR', 'HARBORS'], 2],
    ['signCount', ['COUNT', 'AGAIN'], 2],
  ],
  works: [
    ['signFizz', ['FIZZ', 'WORKS'], 2],
    ['signKite', ['MIND THE', 'KITE'], 2],
    ['signBoil', ['BOIL', 'TWICE'], 2],
    ['signThirteen', ['THIRTEEN', 'OF', 'SOMETHING'], 3],
  ],
};

// ------------------------------------------------------------------ the set

export interface TileSet {
  style: Style;
  tiles: BlockSet;
  /** Sign names in this set, and how many blocks wide each is (its blocks are name0, name1...). */
  signs: Map<string, number>;
}

const DIRS = ['e', 'w', 's', 'n'] as const;
const GRAV_OF = { e: GRAV.e, w: GRAV.w, s: GRAV.s, n: GRAV.n };
const BORN = { e: MON.bornE, w: MON.bornW, s: MON.bornS, n: MON.bornN };
/** Solid sides of a swing door that lets you through toward `dir`. */
const DOOR_SOLID = {
  e: SOLID & ~SOLLEF,
  w: SOLID & ~SOLRIG,
  s: SOLID & ~SOLTOP,
  n: SOLID & ~SOLBOT,
};

export function buildTileSet(style: Style): TileSet {
  const t = new BlockSet(150, false);
  const fl = floorPx(style, false);
  const fl2 = floorPx(style, true);
  // the fixed numbers: void and the three things Doc Leo can carry
  // beyond the kitchen: the old foundations, dark stone laid in courses
  const vd = px().map((x, y) => {
    const row = Math.floor(y / 5);
    return y % 5 === 4 || (x + (row % 2) * 5) % 10 === 9 ? c('dark', 0) : (x * 3 + y * 7) % 11 === 0 ? c('dark', 2) : c('dark', 1);
  });
  t.add('void', vd, { solid: SOLID });
  t.add('chicken', on(fl, chickenItem()), { obj: true, touch: 'floor' });
  t.add('kazoo', on(fl, kazoo()), { obj: true, touch: 'floor' });
  t.add('tricorn', on(fl, tricorn()), { obj: true, touch: 'floor' });
  // the two eggs (carried, they go in the save): the rotten one costs thirteen points to pick
  // up (the smell), the pastry one is worth a life (and plays the music box)
  t.add('eggRotten', on(fl, eggRotten()), { obj: true, touch: 'floor', score: -13 });
  t.add('eggFaberge', on(fl, eggFaberge()), { obj: true, touch: 'floor', effect: 1, eamt: 1, score: 1776 });

  t.add('floor', fl);
  t.add('floor2', fl2);
  t.add('wall', wallTop(style), { solid: SOLID });
  t.add('wallFace', wallFace(style), { solid: SOLID });
  // Ebenezer's false walls: the same pictures, and nothing there
  t.add('fwall', wallTop(style));
  t.add('fwallFace', wallFace(style));
  // a very clean pane of glass: a floor you cannot cross
  const glass = on(fl);
  glass.line(13, 3, 16, 6, c('glass', 3)).line(14, 3, 17, 6, c('glass', 2)).set(4, 14, c('glass', 3));
  t.add('glass', glass, { solid: SOLID });
  for (let i = 0; i < 4; i++) t.add(`prop${i}`, prop(style, i, fl), { solid: SOLID });

  for (const d of DIRS) t.add(`door_${d}`, swingDoor(fl, d), { solid: DOOR_SOLID[d] });
  for (const d of DIRS) {
    t.add(`belt_${d}`, belt(d, 0), { grav: GRAV_OF[d], next: `belt_${d}_1`, ntime: 3 });
    t.add(`belt_${d}_1`, belt(d, 1), { grav: GRAV_OF[d], next: `belt_${d}`, ntime: 3 });
  }
  // greased boards: floor that is gravity (a false floor), with the faintest sheen
  for (const d of DIRS) {
    const g = on(fl);
    g.set(15, 15, c('floor', 5)).set(16, 14, c('floor', 5));
    t.add(`grease_${d}`, g, { grav: GRAV_OF[d] });
  }

  t.add('spoon', on(fl, spoon()), { effect: CTR.keys, eamt: 1, score: 10, touch: 'floor' });
  t.add('latchOpen', latch(fl, true));
  t.add('latch', latch(fl, false), { solid: SOLID, effect: CTR.keys, eamt: -1, touch: 'latchOpen' });
  t.add('cap', on(fl, cap()), { score: 50, touch: 'floor' });
  t.add('float', on(fl, float()), { score: 250, touch: 'floor' });
  t.add('pie', on(fl, pie()), { effect: 1, eamt: 1, score: 100, touch: 'floor' });
  t.add('trapSprung', trap(fl, 'sprung'));
  t.add('trapArmed', trap(fl, 'armed'), { hp: TRAP_DAMAGE, touch: 'trapSprung' });
  t.add('trapHidden', on(fl), { hp: TRAP_DAMAGE, touch: 'trapSprung' });
  t.add('stairs', stairs(fl));

  // timed panels: phase a starts shut, phase b starts open, so one opens as the other shuts
  const { panel: P, warn: Wn } = TIMING;
  const chain = (ph: 'a' | 'b', order: number[]) => {
    const name = (s: number) => `panel_${ph}${s}`;
    const ticks = [P, Wn, P, Wn];
    order.forEach((s, i) => {
      const next = order[(i + 1) % order.length];
      t.add(name(s), panel(style, fl, s, ph), { solid: s === 2 ? 0 : SOLID, next: name(next), ntime: ticks[s] });
    });
  };
  chain('a', [0, 1, 2, 3]);
  chain('b', [2, 3, 0, 1]);

  t.add('riser0', riser(style, fl, 0), { next: 'riser1', ntime: TIMING.riser[style] });
  t.add('riser1', riser(style, fl, 1), { next: 'riser2', ntime: 18 });
  t.add('riser2', riser(style, fl, 2), { solid: SOLID });
  t.add('opener0', opener(style, fl, 0), { solid: SOLID, next: 'opener1', ntime: TIMING.opener[style] });
  t.add('opener1', opener(style, fl, 1), { solid: SOLID, next: 'opener2', ntime: 18 });
  t.add('opener2', opener(style, fl, 2));

  const H = TIMING.hot;
  t.add('hot0', hot(style, fl, 0), { next: 'hot1', ntime: H.off });
  t.add('hot1', hot(style, fl, 1), { next: 'hot2', ntime: H.warm });
  t.add('hot2', hot(style, fl, 2), { hp: HOT_DAMAGE, next: 'hot0', ntime: H.on });

  for (const d of DIRS) t.add(`spout_${d}`, spout(style, fl, d), { solid: SOLID, birthMon: BORN[d], birthTime: TIMING.spout });

  // the ingredients, each on its own little rug, glowing
  for (const n of SET_INGREDIENTS[style]) {
    const rug = on(fl);
    rug.rect(2, 3, 16, 15, c('accent', 1)).frame(2, 3, 16, 15, c('accent', 3));
    t.add(`ing${n}`, on(rug, ingredient(n, 0)), { effect: CTR.ingredients, eamt: 1, score: 1000, next: `ing${n}b`, ntime: 6 });
    t.add(`ing${n}b`, on(rug, ingredient(n, 1)), { effect: CTR.ingredients, eamt: 1, score: 1000, next: `ing${n}`, ntime: 6 });
  }

  // the Vault's door: twelve keyholes round a wheel (with flour on the knob). It takes twelve
  // ingredients (counter 3) and refuses fewer; open, it hands them straight back.
  const vault = (open: boolean) => {
    const p = on(fl);
    if (open) {
      p.rect(0, 0, 3, 20, c('metal', 1)).rect(17, 0, 3, 20, c('metal', 1));
      p.disc(18, 10, 2, c('metal', 3));
      return p;
    }
    p.rect(0, 0, 20, 20, c('metal', 1));
    p.disc(10, 10, 9, c('metal', 3)).disc(10, 10, 8, c('metal', 2));
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      p.set(10 + Math.cos(a) * 6.5, 10 + Math.sin(a) * 6.5, c('dark', 0));
    }
    p.disc(10, 10, 2.5, c('trim', 3)).set(9, 9, c('paper', 4)).set(10, 9, c('paper', 4));
    return p;
  };
  t.add('vaultDone', vault(true));
  t.add('vaultOpen', vault(true), { effect: CTR.ingredients, eamt: 12, touch: 'vaultDone' });
  t.add('vault', vault(false), { solid: SOLID, effect: CTR.ingredients, eamt: -12, touch: 'vaultOpen' });

  const signs = new Map<string, number>();
  for (const [name, lines, n] of SIGNS[style]) {
    signBlocks(lines, n, wallFace(style)).forEach((b, i) => t.add(`${name}${i}`, b, { solid: SOLID }));
    signs.set(name, n);
  }
  // a hole knocked through, for secret passages that should look like one once found
  const crack = on(wallFace(style));
  crack.line(6, 4, 9, 10, c('dark', 0)).line(9, 10, 7, 16, c('dark', 0)).line(9, 10, 13, 12, c('dark', 0));
  t.add('fwallCrack', crack);
  void outline;
  void blank;
  void SOLTOP;
  void SOLBOT;
  return { style, tiles: t, signs };
}
