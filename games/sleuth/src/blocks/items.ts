// The evidence and tools Ada carries: their inventory pictures, and the object blocks that
// hold them on the floor (touching one adds to its counter: one piece of evidence, or the
// lens's and the lantern's charge, and leaves the floor behind). Also the safe's four dial
// symbols (mask, raven, rose, moon) and the safe door.
import { Pixels } from '../../../kit/pixels';
import { BlockSet, type BlockDef } from './blockset';
import { micro, microC, pool } from '../art/draw';
import { c, ink, ramp as r } from '../art/pal';
import { CTR } from '../ids';
import { T, boards, clone, flagstones, rug } from './painters';

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
      p.rect(8, 1, 4, 3, c('gray', 5));
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
      p.ring(10, 3, 2, c('gray', 4));
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
      p.line(9, 9, 14, 14, c('gray', 6)).line(10, 9, 15, 14, c('gray', 5));
      p.rect(8, 7, 3, 2, c('gold', 3));
      p.rect(14, 14, 5, 6, c('paper', 4));
      micro(p, 15, 15, '1', c('black', 0));
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
  const p = T(c('gray', 1));
  p.rect(0, 0, 20, 20, c('black', 1)).frame(0, 0, 20, 20, c('gray', 3));
  p.disc(10, 10, 9, c('gray', 4));
  p.disc(10, 10, 8, c('gray', 2));
  symbol(p, 4, 4, s, c('gold', 4), c('gray', 2));
  p.rect(9, 0, 2, 2, c('velvet', 5));
  return p;
}

export function safeDoor(open: boolean, holds = false): Pixels {
  const p = T(c('black', 0));
  p.frame(0, 0, 20, 20, c('gray', 3));
  if (!open) {
    p.rect(1, 1, 18, 18, c('gray', 2)).frame(3, 3, 14, 14, c('gray', 4));
    p.disc(13, 10, 2, c('gold', 3));
    microC(p, 9, 7, 'VC', c('gold', 2));
  } else {
    p.rect(1, 1, 18, 18, c('black', 1));
    p.rect(0, 0, 3, 20, c('gray', 3));
    if (holds) {
      p.rect(5, 6, 11, 11, c('paper', 3)).rect(6, 5, 11, 11, c('paper', 5)).rect(8, 7, 7, 2, c('black', 1));
      for (let i = 0; i < 3; i++) p.rect(8, 10 + i * 2, 7, 1, c('black', 3));
    }
  }
  return p;
}
