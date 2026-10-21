// The Paragon Theatre's background blocks (PARAGON.BBL), seen from above: boards, carpet,
// marble, paneled walls, velvet seats, the stage and its set, the rooms backstage, the
// evidence, the safe's three dials, and the dark under the stage that only shows where
// Ada's lantern has been.
import { Pixels, rng } from '../kit/pixels';
import { BlockSet, SOLID, type BlockDef } from './blockset';
import { blob, micro, microC, pool, shadeAt, speckle } from './draw';
import { c, ink, ramp as r } from './pal';
import { CTR } from './ids';

export const T = (fill = 0) => new Pixels(20, 20, fill);
export const clone = (p: Pixels) => {
  const q = T();
  q.px.set(p.px);
  return q;
};

// ---------------------------------------------------------------- floors

/** Planks running left to right, 5 pixels wide, ends staggered. */
export function planks(lo: number, hi: number, seed: number, rampName = 'wood'): Pixels {
  const p = T();
  const R = rng(seed);
  const w = r(rampName);
  for (let row = 0; row < 4; row++) {
    const cut = Math.floor(R() * 16) + 2;
    const base = lo + Math.floor(R() * (hi - lo + 1));
    for (let y = row * 5; y < row * 5 + 5; y++)
      for (let x = 0; x < 20; x++) {
        let k = base;
        if (y === row * 5) k = lo - 1;
        else if ((x * 7 + y * 3 + seed) % 11 === 0) k = base + 1;
        else if ((x * 5 + y + seed) % 13 === 0) k = base - 1;
        if (x === cut && y !== row * 5) k = lo - 1;
        p.set(x, y, w[Math.max(0, Math.min(w.length - 1, k))]);
      }
  }
  return p;
}

export const boards = (seed = 1) => planks(2, 3, seed);
export const stageBoards = (seed = 2) => planks(5, 6, seed);
export const pitBoards = (seed = 3) => planks(1, 1, seed);

export function carpet(seed = 0): Pixels {
  const p = speckle(T(), 0, 0, 20, 20, r('velvet'), 2, 1, 40 + seed, 0.15);
  // a gold lattice, the Paragon's pattern
  for (let i = 0; i < 20; i++) {
    const a = (i + seed * 5) % 20;
    if (i % 2 === 0) p.set(a, i, c('velvet', 3)).set(19 - a, i, c('velvet', 3));
  }
  p.set(9, 9, c('gold', 1)).set(10, 10, c('gold', 1)).set(9, 10, c('gold', 0)).set(10, 9, c('gold', 0));
  return p;
}

export function marble(): Pixels {
  const p = T();
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const light = x < 10 === y < 10;
      const vein = Math.abs(Math.sin((x + y * 0.6) * 0.7) * 3) < 0.25;
      p.set(x, y, light ? c('tile', vein ? 2 : 4) : c('black', vein ? 2 : 1));
    }
  return p;
}

export function rug(base = 'plum'): Pixels {
  const p = T(c(base, 1));
  for (let i = 0; i < 20; i++) {
    p.set(i, 1, c(base, 2)).set(i, 18, c(base, 2));
    p.set(1, i, c(base, 2)).set(18, i, c(base, 2));
  }
  for (let y = 3; y < 17; y++) for (let x = 3; x < 17; x++) if ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0) p.set(x, y, c(base, 2));
  p.disc(10, 10, 2, c('gold', 1));
  return p;
}

export function flagstones(seed = 5): Pixels {
  const p = speckle(T(), 0, 0, 20, 20, r('grey'), 2, 1, seed, 0.2);
  for (let x = 0; x < 20; x++) p.set(x, 9, c('grey', 0)).set(x, 19, c('grey', 0));
  for (let y = 0; y < 9; y++) p.set(seed % 2 ? 6 : 13, y, c('grey', 0));
  for (let y = 10; y < 19; y++) p.set(seed % 2 ? 15 : 4, y, c('grey', 0));
  return p;
}

// ---------------------------------------------------------------- walls

export function wallTop(): Pixels {
  const p = speckle(T(), 0, 0, 20, 20, r('panel'), 0, 1, 9, 0.12);
  return p;
}

/** A paneled wall seen face on: molding, an inset panel and a baseboard. */
export function wallFace(seed = 0): Pixels {
  const p = T(c('panel', 3));
  for (let x = 0; x < 20; x++) {
    p.set(x, 0, c('panel', 1)).set(x, 1, c('gold', 1)).set(x, 2, c('panel', 4));
    p.set(x, 17, c('panel', 1)).set(x, 18, c('panel', 2)).set(x, 19, c('black', 0));
  }
  p.frame(3, 5, 14, 10, c('panel', 2));
  for (let y = 6; y < 14; y++) p.set(4, y, c('panel', 4));
  for (let x = 4; x < 16; x++) p.set(x, 6, c('panel', 4));
  if (seed % 2) p.set(10, 9, c('panel', 2));
  return p;
}

export function sconce(): Pixels {
  const p = wallFace();
  pool(p, 10, 8, 7, 6, r('glow'), 0, 2);
  p.rect(9, 9, 2, 5, c('gold', 2)).rect(8, 13, 4, 1, c('gold', 3));
  blob(p, 10, 7, 2, 3, r('glow'), 2, 4);
  return p;
}

/** A stone wall face (under the stage). */
export function stoneFace(): Pixels {
  const p = T(c('grey', 3));
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const row = Math.floor(y / 5);
      const edge = y % 5 === 4 || (x + (row % 2) * 5) % 10 === 9;
      p.set(x, y, edge ? c('grey', 1) : shadeAt(r('grey'), 2, 4, ((x * 13 + y * 7) % 10) / 10, x, y));
    }
  return p;
}

export function legs(): Pixels {
  const p = T();
  for (let x = 0; x < 20; x++) for (let y = 0; y < 20; y++) p.set(x, y, c('black', [0, 1, 2, 1, 0][x % 5]));
  return p;
}

/** The painted castle backdrop: 3 blocks wide, a moonlit tower and battlements. */
export function backdrop(part: number): Pixels {
  const big = new Pixels(60, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 60; x++) big.set(x, y, shadeAt(r('navy'), 0, 2, y / 20, x, y));
  blob(big, 46, 6, 4, 4, r('paper'), 3, 5);
  big.disc(48, 5, 3, c('navy', 1));
  const R = rng(4);
  for (let i = 0; i < 14; i++) big.set(Math.floor(R() * 60), Math.floor(R() * 10), c('paper', 5));
  // battlements and a tower
  for (let x = 0; x < 60; x++) {
    const h = 13 + (x % 8 < 4 ? -2 : 0);
    for (let y = h; y < 20; y++) big.set(x, y, c('black', 1));
  }
  big.rect(18, 3, 10, 17, c('black', 1));
  for (let x = 17; x < 29; x += 3) big.rect(x, 1, 2, 2, c('black', 1));
  big.rect(22, 7, 2, 3, c('glow', 2));
  big.rect(38, 15, 2, 2, c('glow', 1));
  return big.crop(part * 20, 0, 20, 20);
}

// ---------------------------------------------------------------- doors & signs

/** A doorway in a wall (seen from above): the floor through it, posts, a name plate. */
export function doorway(label: string, floor = boards(4)): Pixels {
  const p = clone(floor);
  p.rect(0, 0, 3, 20, c('panel', 1)).rect(17, 0, 3, 20, c('panel', 1));
  p.rect(0, 0, 3, 1, c('gold', 1)).rect(17, 0, 3, 1, c('gold', 1));
  // the door leaf swung open against the left post
  p.rect(3, 1, 2, 16, c('panel', 4));
  p.set(4, 9, c('gold', 3));
  if (label) {
    const w = Math.max(9, label.length * 4 + 1);
    const x0 = 10 - Math.floor(w / 2);
    p.rect(x0, 1, w, 7, c('paper', 4)).frame(x0, 1, w, 7, c('gold', 1));
    microC(p, 10, 2, label, c('black', 0));
  }
  return p;
}

/** A closed door: solid leaf, brass knob, a plate. */
export function closedDoor(label: string, color = 'panel'): Pixels {
  const p = T(c(color, 3));
  p.rect(0, 0, 2, 20, c('panel', 1)).rect(18, 0, 2, 20, c('panel', 1));
  p.frame(4, 9, 12, 9, c(color, 2));
  p.set(15, 12, c('gold', 4)).set(15, 13, c('gold', 2));
  if (label) {
    const w = Math.max(9, label.length * 4 + 1);
    const x0 = 10 - Math.floor(w / 2);
    p.rect(x0, 1, w, 7, c('paper', 4)).frame(x0, 1, w, 7, c('gold', 1));
    microC(p, 10, 2, label, c('black', 0));
  }
  return p;
}

/** A paper note pinned on a wall face, three short lines of writing. */
export function wallNote(lines: string[], paper = 'paper', inkName = 'black'): Pixels {
  const p = wallFace();
  p.rect(1, 2, 18, 17, c(paper, 4)).frame(1, 2, 18, 17, c(paper, 2));
  p.set(10, 2, c('velvet', 4));
  lines.forEach((l, i) => micro(p, 2, 4 + i * 5, l, c(inkName, 0)));
  return p;
}

/** A chalkboard on the wall with chalk writing. */
export function chalkboard(lines: string[]): Pixels {
  const p = wallFace();
  p.rect(0, 2, 20, 17, c('wood', 1)).rect(1, 3, 18, 15, c('green', 0));
  lines.forEach((l, i) => micro(p, 2, 4 + i * 5, l, c('paper', 4)));
  return p;
}

// ---------------------------------------------------------------- furniture

/** A theatre seat from above: the back at the top, the cushion, arms. */
export function seat(): Pixels {
  const p = carpet(1);
  p.rect(1, 2, 18, 6, c('velvet', 1)).rect(2, 3, 16, 4, c('velvet', 3));
  p.rect(2, 8, 16, 9, c('velvet', 4)).rect(3, 9, 14, 6, c('velvet', 5));
  p.rect(0, 4, 2, 13, c('wood', 1)).rect(18, 4, 2, 13, c('wood', 1));
  p.rect(0, 4, 2, 1, c('gold', 2)).rect(18, 4, 2, 1, c('gold', 2));
  return p;
}

export function rail(): Pixels {
  const p = carpet(2);
  p.rect(0, 0, 20, 7, c('wood', 0));
  p.rect(0, 7, 20, 2, c('gold', 3)).rect(0, 9, 20, 1, c('gold', 1));
  p.rect(4, 7, 2, 8, c('gold', 2)).rect(14, 7, 2, 8, c('gold', 2));
  return p;
}

export function footlight(bright: number): Pixels {
  const p = stageBoards(7);
  p.rect(0, 12, 20, 8, c('black', 1)).rect(0, 12, 20, 1, c('gold', 2));
  for (const x of [5, 15]) {
    pool(p, x, 10, 6 + bright, 6, r('glow'), 0, 1 + bright);
    blob(p, x, 13, 3, 2, r('glow'), 1 + bright, 3 + bright);
  }
  return p;
}

export function table(top: Pixels | undefined, w = 'wood'): Pixels {
  const p = top ? clone(top) : boards(9);
  p.rect(1, 3, 18, 14, c(w, 2)).rect(1, 3, 18, 1, c(w, 4)).rect(1, 16, 18, 1, c(w, 0));
  return p;
}

// ---------------------------------------------------------------- items (inventory pictures)

/** Evidence lies on the floor; its picture is also the inventory icon. */
function onFloor(floor: Pixels, draw: (p: Pixels) => void): Pixels {
  const p = clone(floor);
  draw(p);
  return p;
}

export const ITEM = {
  lens: (f: Pixels) =>
    onFloor(f, (p) => {
      p.line(11, 11, 17, 17, c('wood', 1)).line(12, 11, 18, 17, c('wood', 2));
      p.disc(8, 8, 6, c('gold', 2));
      p.disc(8, 8, 5, c('teal', 3));
      p.disc(7, 7, 2, c('ghost', 2));
      p.set(5, 6, ink('white'));
    }),
  checklist: (f: Pixels) =>
    onFloor(f, (p) => {
      p.rect(4, 2, 12, 16, c('wood', 3)).rect(5, 4, 10, 13, c('paper', 5));
      p.rect(8, 1, 4, 3, c('grey', 5));
      for (let i = 0; i < 4; i++) p.rect(6, 6 + i * 3, 6, 1, c('black', 1)).set(13, 6 + i * 3, c('velvet', 4));
      p.line(12, 12, 13, 13, c('velvet', 5)).line(13, 13, 15, 10, c('velvet', 5));
    }),
  stub: (f: Pixels) =>
    onFloor(f, (p) => {
      p.rect(4, 7, 12, 7, c('paper', 4)).frame(4, 7, 12, 7, c('paper', 2));
      for (let y = 7; y < 14; y += 2) p.set(15, y, c('wood', 2));
      micro(p, 5, 8, 'F-9', c('velvet', 2));
    }),
  chart: (f: Pixels) =>
    onFloor(f, (p) => {
      p.rect(2, 3, 16, 14, c('paper', 5)).frame(2, 3, 16, 14, c('paper', 1));
      for (let y = 6; y < 16; y += 2) for (let x = 4; x < 17; x += 2) p.set(x, y, c('velvet', 3));
      p.rect(13, 13, 3, 3, c('navy', 2)).set(14, 14, ink('blue'));
      p.rect(4, 4, 12, 1, c('black', 1));
    }),
  policy: (f: Pixels) =>
    onFloor(f, (p) => {
      p.rect(4, 2, 12, 16, c('paper', 4)).frame(4, 2, 12, 16, c('teal', 1));
      p.rect(6, 4, 8, 2, c('teal', 2));
      for (let i = 0; i < 4; i++) p.rect(6, 8 + i * 2, 8, 1, c('black', 2));
      micro(p, 6, 13, '$', c('green', 2));
      p.disc(13, 15, 2, c('velvet', 3));
    }),
  lantern: (f: Pixels) =>
    onFloor(f, (p) => {
      pool(p, 10, 11, 9, 8, r('glow'), 0, 1);
      p.rect(6, 6, 8, 11, c('black', 1)).rect(7, 7, 6, 8, c('glow', 3)).rect(9, 9, 2, 4, c('glow', 4));
      p.rect(5, 16, 10, 2, c('black', 1)).rect(7, 4, 6, 2, c('black', 1));
      p.ring(10, 3, 2, c('grey', 4));
    }),
  ledger: (f: Pixels) =>
    onFloor(f, (p) => {
      p.rect(2, 4, 16, 12, c('green', 1)).rect(3, 5, 6, 10, c('paper', 4)).rect(11, 5, 6, 10, c('paper', 4));
      p.rect(9, 4, 2, 12, c('green', 0));
      for (let i = 0; i < 4; i++) p.rect(4, 6 + i * 2, 4, 1, c('black', 2)).rect(12, 6 + i * 2, 4, 1, c('black', 2));
      micro(p, 12, 12, '13', c('velvet', 3));
    }),
  cuesheet: (f: Pixels) =>
    onFloor(f, (p) => {
      p.rect(4, 2, 12, 16, c('paper', 5)).frame(4, 2, 12, 16, c('paper', 2));
      micro(p, 5, 3, 'CUE', c('black', 0));
      for (let i = 0; i < 3; i++) p.rect(6, 9 + i * 2, 8, 1, c('black', 2));
      p.line(5, 15, 14, 9, c('velvet', 4));
    }),
  umbrella: (f: Pixels) =>
    onFloor(f, (p) => {
      p.line(3, 17, 15, 3, c('black', 1)).line(4, 17, 16, 3, c('black', 2));
      p.line(5, 15, 15, 5, c('navy', 1)).line(6, 16, 16, 6, c('navy', 2));
      p.ring(3, 17, 2, c('wood', 3));
      // the trick dagger hidden in its folds: a bright, blunt blade
      p.line(9, 9, 14, 14, c('grey', 6)).line(10, 9, 15, 14, c('grey', 5));
      p.rect(8, 7, 3, 2, c('gold', 3));
      p.rect(14, 16, 5, 3, c('paper', 4));
      micro(p, 15, 16, '1', c('black', 0));
    }),
  manuscript: (f: Pixels) =>
    onFloor(f, (p) => {
      p.rect(3, 2, 14, 16, c('paper', 3)).rect(4, 1, 14, 16, c('paper', 5));
      p.rect(6, 3, 10, 3, c('black', 1));
      for (let i = 0; i < 5; i++) p.rect(6, 8 + i * 2, 9, 1, c('black', 3));
      p.rect(4, 1, 1, 16, c('velvet', 3));
    }),
  key: (f: Pixels) =>
    onFloor(f, (p) => {
      p.ring(6, 10, 3, c('gold', 4)).ring(6, 10, 2, c('gold', 2));
      p.rect(9, 9, 8, 2, c('gold', 3)).rect(14, 11, 2, 3, c('gold', 3)).rect(11, 11, 1, 2, c('gold', 3));
    }),
};

/**
 * The things Ada can carry, first in every block set: PLAYGAME keeps the inventory as block
 * numbers, so the green room's blocks put the same pictures at the same numbers and F2
 * shows the right things wherever she is.
 */
export const ITEMS = ['lens', 'checklist', 'stub', 'chart', 'policy', 'lantern', 'ledger', 'cuesheet', 'umbrella', 'safe_ms'] as const;

export function itemPictures(): Pixels[] {
  const B = boards(1);
  return [
    ITEM.lens(B),
    ITEM.checklist(B),
    ITEM.stub(B),
    ITEM.chart(B),
    ITEM.policy(rug('plum')),
    ITEM.lantern(B),
    ITEM.ledger(B),
    ITEM.cuesheet(B),
    ITEM.umbrella(flagstones(5)),
    safeDoor(true, true),
  ];
}

export function addItems(bs: BlockSet, live: boolean): void {
  const pics = itemPictures();
  const ev = (score: number, touch: string): BlockDef => ({ obj: true, effect: CTR.evidence, eamt: 1, score, touch });
  const defs: BlockDef[] = [
    { obj: true, effect: CTR.lens, eamt: 40, score: 50, touch: 'boards' },
    ev(100, 'boards'),
    ev(250, 'boards'),
    ev(100, 'boards'),
    ev(100, 'rug'),
    { obj: true, effect: CTR.lantern, eamt: 400, score: 50, touch: 'boards' },
    ev(100, 'boards'),
    ev(100, 'boards'),
    ev(250, 'litfloor'),
    ev(100, 'safe_empty'),
  ];
  ITEMS.forEach((name, i) => bs.add(name, pics[i], live ? defs[i] : {}));
}

// ---------------------------------------------------------------- the safe's dials

export const SYMBOLS = ['mask', 'raven', 'rose', 'moon'] as const;

/** A symbol drawn in a 12x12 box at (x, y). */
export function symbol(p: Pixels, x: number, y: number, s: (typeof SYMBOLS)[number], col: number, hi: number): void {
  if (s === 'mask') {
    p.rect(x + 1, y + 2, 10, 7, col).rect(x + 3, y + 9, 6, 2, col);
    p.rect(x + 3, y + 4, 2, 2, hi)
      .rect(x + 7, y + 4, 2, 2, hi)
      .rect(x + 4, y + 9, 4, 1, hi);
  } else if (s === 'raven') {
    p.rect(x + 2, y + 4, 7, 4, col)
      .rect(x + 7, y + 2, 3, 3, col)
      .rect(x + 10, y + 3, 2, 1, hi);
    p.rect(x + 1, y + 7, 3, 2, col)
      .rect(x + 4, y + 8, 1, 3, col)
      .rect(x + 6, y + 8, 1, 3, col);
    p.set(x + 8, y + 3, hi);
  } else if (s === 'rose') {
    p.disc(x + 6, y + 4, 3, col);
    p.ring(x + 6, y + 4, 1, hi);
    p.rect(x + 6, y + 7, 1, 5, hi).rect(x + 3, y + 9, 3, 1, hi);
  } else {
    p.disc(x + 6, y + 6, 5, col);
    p.disc(x + 8, y + 5, 4, hi);
  }
}

export function dial(s: (typeof SYMBOLS)[number]): Pixels {
  const p = T(c('grey', 1));
  p.rect(0, 0, 20, 20, c('black', 1)).frame(0, 0, 20, 20, c('grey', 3));
  p.disc(10, 10, 9, c('grey', 4));
  p.disc(10, 10, 8, c('grey', 2));
  symbol(p, 4, 4, s, c('gold', 4), c('grey', 2));
  p.rect(9, 0, 2, 2, c('velvet', 5));
  return p;
}

export function safeDoor(open: boolean, holds = false): Pixels {
  const p = T(c('black', 0));
  p.frame(0, 0, 20, 20, c('grey', 3));
  if (!open) {
    p.rect(1, 1, 18, 18, c('grey', 2)).frame(3, 3, 14, 14, c('grey', 4));
    p.disc(13, 10, 2, c('gold', 3));
    microC(p, 9, 7, 'VC', c('gold', 2));
  } else {
    p.rect(1, 1, 18, 18, c('black', 1));
    p.rect(0, 0, 3, 20, c('grey', 3));
    if (holds) {
      p.rect(5, 6, 11, 11, c('paper', 3)).rect(6, 5, 11, 11, c('paper', 5)).rect(8, 7, 7, 2, c('black', 1));
      for (let i = 0; i < 3; i++) p.rect(8, 10 + i * 2, 7, 1, c('black', 3));
    }
  }
  return p;
}

// ---------------------------------------------------------------- the set

/** Shared: draws an object on a base block. */
const on = (base: Pixels, draw: (p: Pixels) => void) => {
  const p = clone(base);
  draw(p);
  return p;
};

export function buildTheatreBlocks(): BlockSet {
  const bs = new BlockSet(150, false);
  const add = (name: string, p: Pixels, d: BlockDef = {}) => bs.add(name, p, d);
  const S = { solid: SOLID };
  addItems(bs, true);

  // Floors
  const B = boards(1);
  add('boards', B);
  add('boards2', boards(6));
  const ST = stageBoards(2);
  add('stage', ST);
  add(
    'stage2',
    on(ST, (p) => p.rect(8, 9, 5, 2, c('glow', 2)).rect(9, 8, 2, 4, c('glow', 2))),
  ); // spike tape
  const CP = carpet(0);
  add('carpet', CP);
  add('marble', marble());
  add('pit', pitBoards(3));
  const RG = rug('plum');
  add('rug', RG);
  add('rug2', rug('green'));
  add('litfloor', flagstones(5));
  add('litfloor2', flagstones(6));

  // Walls
  add('void', T(0), S);
  add('walltop', wallTop(), S);
  add('wall', wallFace(0), S);
  add('wall2', wallFace(1), S);
  add('sconce', sconce(), S);
  add('litwall', stoneFace(), S);
  for (let i = 0; i < 3; i++) add(`backdrop${i}`, backdrop(i), S);
  add('legs', legs(), S);

  // Doors and gates
  add('door_crane', doorway('STAR'));
  add('door_lila', doorway('LILA'));
  add('door_chorus', doorway('CAST'));
  add('door_props', doorway('PROPS'));
  add('door_watch', doorway('WATCH'));
  add('doorway', doorway('', CP));
  add('door_booth', doorway('BOOTH', B));
  add('office_open', doorway('CRANE'));
  // Locked: a key from the ring opens it for good (the key is used up).
  add('office_locked', closedDoor('CRANE'), { ...S, effect: CTR.keys, eamt: -1, touch: 'office_open', score: 25 });
  // The green room door counts the evidence: it takes it as Ada pushes and gives it back
  // when she pushes again (the second push swings it open), so nothing is lost.
  add('green_open', doorway('GREEN', B));
  for (const [act, need] of [
    [1, 4],
    [2, 8],
  ]) {
    add(
      `green_ajar${act}`,
      on(closedDoor('GREEN', 'green'), (p) => p.rect(15, 9, 3, 11, c('glow', 3)).rect(16, 9, 1, 11, c('glow', 4))),
      { ...S, effect: CTR.evidence, eamt: need, touch: 'green_open' },
    );
    add(`green_shut${act}`, closedDoor('GREEN', 'green'), { ...S, effect: CTR.evidence, eamt: -need, touch: `green_ajar${act}` });
  }
  add('pitdoor_shut', closedDoor('PIT', 'panel'), S);
  add('pitdoor', doorway('PIT', B));
  add(
    'shutter',
    on(wallFace(), (p) => {
      p.rect(1, 3, 18, 15, c('grey', 2));
      for (let y = 4; y < 18; y += 2) p.rect(1, y, 18, 1, c('grey', 1));
      p.rect(4, 8, 12, 5, c('paper', 4));
      microC(p, 10, 8, 'SHUT', c('velvet', 2));
    }),
    S,
  );
  add('cloak_open', doorway('COATS', B));
  add(
    'rope',
    on(CP, (p) => {
      p.rect(2, 6, 3, 12, c('gold', 2)).rect(15, 6, 3, 12, c('gold', 2));
      p.disc(3, 6, 2, c('gold', 4)).disc(16, 6, 2, c('gold', 4));
      for (let x = 4; x < 16; x++) p.rect(x, 8 + Math.round(Math.sin(((x - 4) / 11) * Math.PI) * 3), 1, 2, c('velvet', 5));
    }),
    S,
  );
  const stairs = T();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) stairs.set(x, y, c('wood', y % 5 === 0 ? 0 : 1 + Math.floor((19 - y) / 5)));
  add('stairs', stairs);
  add(
    'boarded',
    on(stairs, (p) => {
      p.rect(0, 3, 20, 4, c('wood', 4)).rect(0, 12, 20, 4, c('wood', 3));
      p.set(2, 5, c('grey', 5)).set(17, 5, c('grey', 5)).set(2, 14, c('grey', 5)).set(17, 14, c('grey', 5));
    }),
    S,
  );
  add(
    'glassdoor',
    on(T(c('rain', 1)), (p) => {
      p.frame(0, 0, 20, 20, c('gold', 2)).frame(1, 1, 18, 18, c('gold', 1));
      for (let i = 0; i < 6; i++) p.line(3 + i * 3, 2, 1 + i * 3, 17, c('rain', 3));
      p.rect(14, 8, 2, 4, c('gold', 4));
    }),
    S,
  );
  add(
    'stagedoor',
    on(closedDoor('STAGE', 'grey'), (p) => {
      for (let x = 0; x < 20; x++) p.set(x, 11 + Math.floor(x / 4), c('glow', 4)).set(x, 12 + Math.floor(x / 4), c('black', 0));
    }),
    S,
  );
  add(
    'pitgate',
    on(carpet(3), (p) => {
      p.rect(0, 7, 3, 3, c('gold', 3)).rect(17, 7, 3, 3, c('gold', 3));
      p.line(3, 8, 9, 2, c('gold', 2));
    }),
  );

  // Seats, rail, footlights
  add('seat', seat(), S);
  add('rail', rail(), S);
  add('footlight', footlight(0), { ...S, next: 'footlight2', ntime: 9 });
  add('footlight2', footlight(1), { ...S, next: 'footlight', ntime: 7 });

  // The set of THE RAVEN'S BRIDE, and the spot where Victor Crane fell
  const bierBig = new Pixels(40, 20);
  bierBig.blit(ST, 0, 0).blit(ST, 20, 0);
  bierBig.rect(2, 3, 36, 14, c('grey', 2)).rect(2, 3, 36, 2, c('grey', 4)).rect(2, 15, 36, 2, c('grey', 0));
  bierBig.rect(5, 6, 30, 8, c('velvet', 1));
  for (let x = 6; x < 34; x += 4) bierBig.set(x, 9, c('gold', 2));
  add('bier0', bierBig.crop(0, 0, 20, 20), S);
  add('bier1', bierBig.crop(20, 0, 20, 20), S);
  const tapeBig = new Pixels(40, 20);
  tapeBig.blit(ST, 0, 0).blit(ST, 20, 0);
  const tape = c('paper', 5);
  tapeBig.ring(6, 6, 4, tape);
  tapeBig.line(10, 7, 28, 8, tape).line(10, 11, 28, 12, tape);
  tapeBig.line(14, 7, 18, 2, tape).line(14, 11, 18, 17, tape);
  tapeBig.line(28, 8, 37, 4, tape).line(28, 12, 37, 16, tape);
  add('tape0', tapeBig.crop(0, 0, 20, 20));
  add('tape1', tapeBig.crop(20, 0, 20, 20));
  add(
    'goblet',
    on(ST, (p) => {
      p.disc(10, 10, 7, c('wood', 1));
      p.disc(10, 10, 6, c('wood', 3));
      p.rect(8, 5, 4, 6, c('gold', 3)).rect(9, 11, 2, 3, c('gold', 2)).rect(7, 14, 6, 1, c('gold', 3));
      p.rect(9, 6, 2, 2, c('velvet', 3));
    }),
    S,
  );
  add(
    'throne',
    on(ST, (p) => {
      p.rect(3, 1, 14, 6, c('gold', 2)).rect(4, 2, 12, 4, c('velvet', 2));
      p.rect(3, 7, 14, 11, c('velvet', 3)).rect(1, 7, 3, 11, c('gold', 2)).rect(16, 7, 3, 11, c('gold', 2));
      p.set(6, 0, c('gold', 4)).set(10, 0, c('gold', 4)).set(14, 0, c('gold', 4));
    }),
    S,
  );
  add(
    'trapdoor',
    on(ST, (p) => {
      p.frame(1, 1, 18, 18, c('wood', 0));
      p.frame(2, 2, 16, 16, c('wood', 7));
      p.rect(9, 8, 2, 4, c('grey', 4));
    }),
  );
  const ghostPole = (lit: number) =>
    on(ST, (p) => {
      if (lit) pool(p, 10, 10, 9 + lit, 9 + lit, r('ghost'), 0, lit);
      p.disc(10, 16, 4, c('black', 1));
      p.rect(9, 6, 2, 10, c('grey', 3));
      p.rect(7, 3, 6, 4, c('black', 2));
      blob(p, 10, 6, 3, 3, lit ? r('ghost') : r('grey'), lit ? 2 : 3, lit ? 3 : 5);
    });
  add('ghostlight', ghostPole(0), S);
  // At night the ghost light burns, and something drifts out of it now and then.
  add('ghostlit', ghostPole(1), { ...S, next: 'ghostlit2', ntime: 5, birthMon: 3, birthTime: 220 });
  add('ghostlit2', ghostPole(2), { ...S, next: 'ghostlit', ntime: 3 });

  // Wings: fly rail ropes, prop table
  add(
    'ropes',
    on(wallFace(), (p) => {
      p.rect(0, 3, 20, 14, c('panel', 2));
      for (let x = 2; x < 20; x += 4) p.rect(x, 3, 1, 14, c('tan', 3));
      p.rect(0, 12, 20, 2, c('grey', 4));
    }),
    S,
  );
  const propTable = new Pixels(60, 20);
  for (let i = 0; i < 3; i++) propTable.blit(B, i * 20, 0);
  propTable.rect(1, 2, 58, 15, c('wood', 1)).rect(1, 2, 58, 1, c('wood', 4)).rect(2, 3, 56, 13, c('paper', 1));
  for (let i = 0; i < 6; i++) propTable.frame(3 + i * 9, 4, 8, 10, c('paper', 4));
  propTable.rect(5, 8, 5, 2, c('gold', 3)); // a crown
  propTable.line(13, 12, 19, 6, c('grey', 5)).rect(12, 11, 3, 2, c('gold', 2)); // a sword
  propTable.rect(31, 7, 4, 4, c('gold', 2)); // a goblet
  propTable.disc(40, 9, 2, c('velvet', 4)); // a rose
  microC(propTable, 50, 6, '?', c('velvet', 2)); // the dagger's empty outline
  propTable.frame(46, 8, 9, 3, c('black', 3));
  for (let i = 0; i < 3; i++) add(`proptable${i}`, propTable.crop(i * 20, 0, 20, 20), S);
  add(
    'crate',
    on(B, (p) => {
      p.rect(2, 2, 16, 16, c('wood', 3)).frame(2, 2, 16, 16, c('wood', 1));
      p.line(2, 2, 17, 17, c('wood', 1)).line(17, 2, 2, 17, c('wood', 1));
    }),
    S,
  );

  // Backstage rooms
  const vanity = (letter?: string[]) =>
    on(wallFace(), (p) => {
      p.rect(1, 3, 18, 10, c('ghost', 1)).frame(1, 3, 18, 10, c('gold', 2));
      for (let x = 2; x < 19; x += 4) p.set(x, 2, c('glow', 4));
      p.rect(0, 13, 20, 7, c('wood', 2)).rect(0, 13, 20, 1, c('wood', 4));
      if (letter) {
        p.rect(2, 4, 16, 9, c('paper', 5));
        letter.forEach((l, i) => micro(p, 3, 4 + i * 5, l, c('navy', 0)));
      } else {
        p.disc(6, 16, 2, c('velvet', 4));
        p.rect(12, 15, 4, 3, c('gold', 3));
      }
    });
  add('vanity', vanity(), S);
  // Victor's letter, propped on Lila's mirror: blackmail, in his own hand.
  add('letter0', vanity(['SIGN', 'OR I']), S);
  add('letter1', vanity(['TELL', 'ALL-V']), S);
  add(
    'flowers',
    on(RG, (p) => {
      p.rect(7, 11, 6, 7, c('teal', 2));
      for (const [x, y, k] of [
        [7, 7, 'velvet'],
        [12, 6, 'velvet'],
        [10, 9, 'paper'],
        [5, 10, 'plum'],
        [14, 10, 'velvet'],
      ] as [number, number, string][])
        p.disc(x, y, 2, c(k, 4));
    }),
    S,
  );
  add(
    'screen',
    on(RG, (p) => {
      for (let i = 0; i < 3; i++) p.rect(1 + i * 6, 2, 5, 16, c('paper', 2 + (i % 2))).frame(1 + i * 6, 2, 5, 16, c('gold', 1));
      p.disc(9, 9, 2, c('plum', 3));
    }),
    S,
  );
  add(
    'rack',
    on(B, (p) => {
      p.rect(0, 9, 20, 1, c('grey', 4));
      const R = rng(3);
      for (let x = 1; x < 19; x += 3) p.rect(x, 4, 3, 13, c(['velvet', 'navy', 'green', 'plum', 'gold'][Math.floor(R() * 5)], 2 + Math.floor(R() * 2)));
    }),
    S,
  );
  add(
    'robe',
    on(B, (p) => {
      p.rect(0, 9, 20, 1, c('grey', 4));
      p.rect(3, 3, 14, 15, c('black', 2)).rect(3, 3, 14, 2, c('velvet', 3)).rect(9, 3, 2, 15, c('velvet', 2));
    }),
    S,
  );
  add(
    'decanter',
    on(RG, (p) => {
      p.disc(10, 10, 8, c('wood', 2));
      p.disc(8, 9, 3, c('ghost', 0)).disc(8, 10, 2, c('velvet', 2));
      p.rect(13, 8, 3, 4, c('ghost', 1)).rect(13, 10, 3, 2, c('velvet', 3));
    }),
    S,
  );
  add(
    'trunk',
    on(B, (p) => {
      p.rect(1, 3, 18, 14, c('auburn', 1)).frame(1, 3, 18, 14, c('gold', 2));
      p.rect(1, 8, 18, 1, c('gold', 2)).rect(8, 7, 4, 4, c('gold', 3));
      micro(p, 3, 11, 'VC', c('gold', 4));
    }),
    S,
  );
  add(
    'shelf',
    on(wallFace(), (p) => {
      for (const y of [3, 9, 15]) p.rect(0, y + 4, 20, 1, c('wood', 4));
      p.disc(4, 5, 2, c('paper', 5)); // a skull
      p.set(3, 5, c('black', 0)).set(5, 5, c('black', 0));
      p.rect(9, 3, 1, 4, c('grey', 5)).rect(12, 2, 2, 5, c('gold', 3));
      p.rect(3, 10, 5, 3, c('velvet', 3)).rect(11, 9, 6, 4, c('green', 2));
      p.rect(2, 16, 4, 3, c('tan', 3)).rect(9, 15, 3, 4, c('teal', 3)).rect(14, 16, 4, 3, c('plum', 3));
    }),
    S,
  );
  add(
    'shelf2',
    on(wallFace(), (p) => {
      for (const y of [3, 9, 15]) p.rect(0, y + 4, 20, 1, c('wood', 4));
      p.rect(2, 2, 6, 5, c('black', 1)).rect(3, 1, 4, 1, c('black', 1)); // a deerstalker
      p.rect(11, 3, 6, 4, c('tan', 2));
      p.rect(2, 9, 14, 3, c('grey', 4));
      p.rect(4, 15, 3, 4, c('gold', 2)).rect(12, 14, 4, 5, c('navy', 3));
    }),
    S,
  );
  add(
    'desk0',
    on(RG, (p) => {
      p.rect(0, 3, 20, 14, c('wood', 1)).rect(0, 3, 20, 1, c('wood', 3));
      p.rect(3, 5, 8, 6, c('paper', 4)).rect(14, 5, 3, 3, c('gold', 3));
    }),
    S,
  );
  add(
    'desk1',
    on(RG, (p) => {
      p.rect(0, 3, 20, 14, c('wood', 1)).rect(0, 3, 20, 1, c('wood', 3));
      p.disc(8, 9, 3, c('black', 1)).rect(13, 5, 2, 9, c('green', 3)).disc(14, 5, 2, c('glow', 3));
    }),
    S,
  );
  add(
    'bookcase',
    on(wallFace(), (p) => {
      for (const y of [2, 8, 14]) {
        p.rect(0, y + 5, 20, 1, c('wood', 4));
        for (let x = 1; x < 19; x += 2) p.rect(x, y + 1, 2, 4, c(['velvet', 'navy', 'green', 'tan'][(x + y) % 4], 2));
      }
    }),
    S,
  );
  // The playbill in Victor's office: THE RAVEN'S BRIDE, raven, rose and moon in a row.
  const bill = new Pixels(60, 20);
  for (let i = 0; i < 3; i++) bill.blit(wallFace(i), i * 20, 0);
  bill.rect(2, 2, 56, 17, c('gold', 2)).rect(3, 3, 54, 15, c('paper', 4));
  symbol(bill, 6, 5, 'raven', c('black', 0), c('velvet', 4));
  symbol(bill, 24, 5, 'rose', c('velvet', 3), c('green', 2));
  symbol(bill, 42, 5, 'moon', c('gold', 3), c('paper', 4));
  for (let i = 0; i < 3; i++) add(`bill${i}`, bill.crop(i * 20, 0, 20, 20), S);
  for (let d = 0; d < 3; d++)
    for (let s = 0; s < 4; s++) {
      // turning a dial from symbol s: +1 when it lands on the right one, -1 when it leaves it
      const right = d + 1;
      const next = (s + 1) % 4;
      const eamt = next === right ? 1 : s === right ? -1 : 0;
      add(`dial${d}${s}`, dial(SYMBOLS[s]), { ...S, touch: `dial${d}${next}`, effect: eamt ? CTR.dials : 0, eamt });
    }
  add('safe_empty', safeDoor(true));
  add('safe', safeDoor(false), { ...S, effect: CTR.dials, eamt: -3, touch: 'safe_ms', score: 200 });
  add(
    'cot',
    on(B, (p) => {
      p.rect(1, 2, 18, 16, c('grey', 1)).rect(2, 3, 16, 14, c('navy', 2)).rect(2, 3, 16, 4, c('paper', 4));
    }),
    S,
  );
  add(
    'stove',
    on(B, (p) => {
      p.disc(10, 10, 7, c('black', 1)).disc(10, 10, 4, c('black', 2));
      p.rect(9, 0, 2, 4, c('black', 1));
      p.set(8, 12, c('glow', 2)).set(11, 13, c('glow', 1));
    }),
    S,
  );

  // Lobby: box office, bar, cloakroom, booth
  add(
    'counter',
    on(B, (p) => {
      p.rect(0, 4, 20, 12, c('wood', 3)).rect(0, 4, 20, 2, c('wood', 5)).rect(0, 14, 20, 2, c('wood', 1));
      p.rect(13, 6, 5, 4, c('gold', 3)).rect(14, 7, 3, 1, c('black', 1)); // a cash register
    }),
    S,
  );
  add(
    'window',
    on(wallFace(), (p) => {
      p.rect(3, 3, 14, 12, c('rain', 2));
      for (let x = 4; x < 17; x += 3) p.rect(x, 3, 1, 12, c('gold', 3));
      p.rect(2, 14, 16, 2, c('gold', 2));
      microC(p, 10, 4, 'TIX', c('paper', 5));
    }),
    S,
  );
  // The box office count, signed at ten past nine: Agatha's alibi, on the wall.
  add('tally0', wallNote(['COUNT', '9:10', 'A.C.']), S);
  add('tally1', wallNote(['NELL', 'SAW', 'IT OK']), S);
  add(
    'bar',
    on(B, (p) => {
      p.rect(0, 2, 20, 14, c('panel', 2)).rect(0, 2, 20, 3, c('gold', 2)).rect(0, 15, 20, 1, c('panel', 0));
      p.rect(4, 6, 2, 5, c('green', 3)).rect(10, 7, 3, 3, c('ghost', 1)).rect(15, 6, 2, 5, c('auburn', 2));
    }),
    S,
  );
  add(
    'bottles',
    on(wallFace(), (p) => {
      for (const y of [5, 12]) p.rect(0, y + 5, 20, 1, c('wood', 4));
      for (let x = 1; x < 19; x += 3) {
        p.rect(x, 5, 2, 5, c(['green', 'auburn', 'gold', 'teal'][x % 4], 2));
        p.rect(x, 12, 2, 5, c(['tan', 'green', 'velvet', 'auburn'][x % 4], 2));
      }
    }),
    S,
  );
  // Sam's chalkboard of bar tabs: Edgar Bliss bought two gin fizzes in the interval.
  add('chalk0', chalkboard(['BAR', 'TABS', '-----']), S);
  add('chalk1', chalkboard(['BLISS', 'FIZZ', '9:05']), S);
  add('chalk2', chalkboard(['BLISS', 'FIZZ', '9:15']), S);
  add(
    'coats',
    on(B, (p) => {
      p.rect(0, 4, 20, 1, c('grey', 4));
      const R = rng(8);
      for (let x = 0; x < 20; x += 4) p.rect(x + 1, 5, 3, 12, c(['tan', 'black', 'navy', 'grey', 'auburn'][Math.floor(R() * 5)], 1 + Math.floor(R() * 2)));
      for (let x = 2; x < 20; x += 4) p.rect(x, 13, 2, 3, c('paper', 4));
    }),
    S,
  );
  add(
    'board',
    on(B, (p) => {
      p.rect(0, 3, 20, 14, c('black', 1)).rect(0, 3, 20, 1, c('grey', 4));
      for (let x = 2; x < 19; x += 3) {
        p.rect(x, 5, 1, 9, c('grey', 2));
        p.rect(x - 1, 6 + ((x * 7) % 7), 3, 2, c('gold', 3));
      }
      p.set(3, 15, c('velvet', 5)).set(6, 15, c('green', 4)).set(9, 15, c('glow', 4));
    }),
    S,
  );
  add(
    'spot',
    on(B, (p) => {
      p.disc(10, 10, 6, c('black', 1));
      p.rect(4, 4, 12, 4, c('black', 2));
      p.disc(10, 13, 3, c('ghost', 2));
    }),
    S,
  );
  add(
    'poster0',
    on(wallFace(), (p) => {
      p.rect(2, 2, 16, 17, c('black', 1)).frame(2, 2, 16, 17, c('gold', 3));
      symbol(p, 4, 4, 'raven', c('velvet', 4), c('gold', 4));
      microC(p, 10, 13, 'THE', c('gold', 4));
    }),
    S,
  );
  add(
    'poster1',
    on(wallFace(1), (p) => {
      p.rect(2, 2, 16, 17, c('black', 1)).frame(2, 2, 16, 17, c('gold', 3));
      microC(p, 10, 4, 'RAVEN', c('velvet', 5));
      microC(p, 10, 10, 'BRIDE', c('velvet', 5));
    }),
    S,
  );
  add(
    'palm',
    on(marble(), (p) => {
      p.disc(10, 13, 5, c('auburn', 1));
      for (let a = 0; a < 7; a++) {
        const ang = (a / 7) * Math.PI * 2;
        p.line(10, 10, 10 + Math.cos(ang) * 9, 10 + Math.sin(ang) * 8, c('green', 2 + (a % 2)));
      }
    }),
    S,
  );

  const LF = flagstones(5);
  add('key', ITEM.key(B), { effect: CTR.keys, eamt: 1, score: 25, touch: 'boards' });
  add(
    'stub_hidden',
    on(B, (p) => p.rect(0, 0, 20, 3, c('wood', 0))),
    { effect: CTR.lens, eamt: -1, touch: 'stub' },
  );
  // Under the stage: black until the lantern has been there.
  add('dark', T(0), { effect: CTR.lantern, eamt: -1, touch: 'litfloor' });
  add('dark2', T(0), { effect: CTR.lantern, eamt: -1, touch: 'litfloor2' });
  add('darkwall', T(0), { ...S, effect: CTR.lantern, eamt: -1, touch: 'litwall' });
  add('umb_dark', T(0), { effect: CTR.lantern, eamt: -1, touch: 'umbrella' });
  const hole = on(LF, (p) => {
    p.disc(10, 12, 5, c('black', 0));
    p.rect(5, 12, 11, 6, c('black', 0));
  });
  add('rathole', hole, { birthMon: 5, birthTime: 160 });
  add('rathole_dark', T(0), { effect: CTR.lantern, eamt: -1, touch: 'rathole', birthMon: 5, birthTime: 160 });
  add(
    'pillar',
    on(LF, (p) => {
      p.rect(4, 0, 12, 20, c('wood', 1)).rect(5, 0, 2, 20, c('wood', 3)).rect(4, 0, 12, 2, c('grey', 2));
    }),
    S,
  );
  add('pillar_dark', T(0), { ...S, effect: CTR.lantern, eamt: -1, touch: 'pillar' });
  add(
    'trapstairs',
    on(stairs, (p) => pool(p, 10, 2, 10, 6, r('ghost'), 0, 1)),
  );
  return bs;
}

export { c, r };
