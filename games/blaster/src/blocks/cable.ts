// The ribbon cable's blocks (its own palette, s5r.pal): a flat gray cable of many thin
// wires stuck side by side, a red stripe along pin 1, coiled over green motherboard. Where it
// turns it is folded over (a crease, the folded lip, and the red edge on the other side). All of
// it is drawn from the track value t (diagBlocks.ts). On the slant the cable's edges are drawn
// half a block below where the solid board starts, so the turned ship (whose nose is pointed)
// just touches them.
//
// Also here: splits in the insulation with colored wires showing (one kind sparks), nicks
// (one kind lets Crosstalk crawl out), tape splices across the board between two coils, the
// black plugs at the cable's ends, and parts on the board: chips, capacitors, resistors, a
// crystal, solder pads and traces.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../../web/src/formats/blocks';
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, bevel, blob, micro, shadeAt } from '../art/draw';
import type { Pal } from '../art/pal';
import type { StageArt } from './tiles';
import { CABLE_TRACK } from '../stages/cableTrack';
import { DiagBlocks, tAt, type DiagCell } from './diagBlocks';

export type Mark = 'tear' | 'spark' | 'nick' | 'crawl' | 'splice' | 'chevron' | `digit${number}`;

const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;
const { board: BOARD, pitch: PITCH, lanes: COILS, kink: KINK } = CABLE_TRACK;
const LAP = PITCH * COILS;
const mod = (n: number, m: number) => ((n % m) + m) % m;
/** How wide one wire of the cable is, in t. */
const WIRE = 0.5;
/** Where the split in the insulation runs across the cable (t within the coil). */
const SPLIT: [number, number] = [12.2, 14.8];
/** The colors of the wires inside: a rainbow ribbon under the gray. */
const INNER = ['red', 'gold', 'cyan', 'slime', 'fire', 'virus'];

function weave(p: Pal, px: number, py: number): number {
  const w = ((px + py) % 4 === 0 ? 0.15 : 0) + ((px - py + 40) % 4 === 0 ? 0.1 : 0);
  return shadeAt(p.r('base'), 1, 3, 0.4 + w, px, py);
}

interface Look {
  /** Is coil k bare board at this block? */
  bare: (coil: number) => boolean;
  mark?: Mark;
  /**
   * On the kink (flat) the cable has been folded over, so its back is up and the red wire
   * is along its bottom edge instead of its top.
   */
  flat: boolean;
  /** The block just past a fold: the crease and the folded-over lip down its left side. */
  lip: boolean;
}

/** One pixel at track value T. */
function colorAt(p: Pal, T: number, px: number, py: number, look: Look): number {
  const S = mod(T - 0.5, LAP);
  const coil = Math.floor(S / PITCH);
  const h = S - coil * PITCH;
  const mark = look.mark;
  if (h < BOARD || look.bare(coil)) {
    if (mark === 'splice' && h < BOARD) {
      // gray tape across the board: woven cloth, crinkled across, its edges dark
      if (h < 0.15 || h > BOARD - 0.15) return p.c('ink', 0);
      const crinkle = Math.sin((px - py) * 0.45 + Math.sin(px * 0.3) * 2) * 0.25;
      const cloth = (px + py * 3) % 4 === 0 ? -0.15 : 0;
      return shadeAt(p.r('ins'), 3, 7, 0.55 + crinkle + cloth, px, py);
    }
    // the board, in the cable's shadow just past it
    const shade = h < 0.7 && !look.bare(mod(coil - 1, COILS));
    return shade ? shadeAt(p.r('base'), 0, 1, 0.4, px, py) : weave(p, px, py);
  }
  const k = h - BOARD;
  const width = PITCH - BOARD;
  if (k < 0.08 || k > width - 0.08) return p.c('ink', 0);
  if (look.lip && px < 4) return px === 0 ? p.c('ink', 0) : px < 3 ? p.c('ins', 7) : p.c('ins', 1);
  if ((mark === 'tear' || mark === 'spark') && h > SPLIT[0] && h < SPLIT[1]) {
    // split open: the edges of the gray curl back, and the colored wires show
    const edge = Math.min(h - SPLIT[0], SPLIT[1] - h);
    if (edge < 0.18) return p.c('ink', 0);
    if (edge < 0.32) return p.c('ins', 7);
    const wire = Math.floor((h - BOARD) / WIRE);
    const q = (h - BOARD) / WIRE - wire;
    if (q < 0.18) return p.c('ink', 0);
    const ramp = INNER[wire % INNER.length];
    if (mark === 'spark' && (px * 7 + py * 3) % 11 === 0) return p.c('steel', 6);
    return shadeAt(p.r(ramp), 1, p.r(ramp).length - 1, 0.25 + 0.6 * Math.sin(Math.PI * q), px, py);
  }
  // many thin wires side by side: each a little round ridge, lit from the upper left
  const wire = Math.floor(k / WIRE);
  const q = k / WIRE - wire;
  const groove = q < 0.14;
  const lit = 0.3 + 0.55 * Math.sin(Math.PI * Math.min(1, q * 1.15)) + (q > 0.2 && q < 0.42 ? 0.22 : 0);
  // a broad sheen down the cable
  const sheen = 0.18 * Math.exp(-(((k - 3.5) / 1.6) ** 2));
  if (wire === (look.flat ? Math.floor(width / WIRE) - 1 : 0)) return groove ? p.c('red', 0) : shadeAt(p.r('red'), 1, 4, lit + sheen, px, py);
  if (groove) return p.c('ins', 0);
  // a mid gray, so the BLASTER's bright hull and shots stand out on it
  return shadeAt(p.r('ins'), 1, 5, lit * 0.85 + sheen, px, py);
}

function cell(p: Pal, c: DiagCell, look: Look): Pixels {
  // (on the kink the ship slides flat along the cable's top edge, so there the edges sit
  // exactly on the block lines: half a block up from the slant's, a small step at each bend)
  return new Pixels(20, 20).map((x, y) => colorAt(p, tAt(c, x, y), x, y, look));
}

/** A printed arrow along the cable (up and to the right, or right on the kink). */
export function chevron(t: Pixels, flat: boolean, color: number): void {
  for (let i = 0; i < 6; i++)
    if (!flat)
      t.set(8 + i, 6, color)
        .set(13, 6 + i, color)
        .set(8 + i, 7, color)
        .set(12, 6 + i, color);
    else
      t.set(7 + i, 4 + i, color)
        .set(7 + i, 15 - i, color)
        .set(8 + i, 4 + i, color)
        .set(8 + i, 15 - i, color);
}

/** A big printed digit, outlined, two pixels to a font pixel. */
export function digit(t: Pixels, n: number, fill: number, edge: number): void {
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < 8 && y < 8 && (FONT8X8[(48 + n) * 8 + y] & (1 << x)) !== 0;
  for (let y = -1; y < 9; y++)
    for (let x = -1; x < 9; x++) {
      const lit = on(x, y);
      const near = !lit && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1));
      if (lit || near) t.rect(2 + x * 2, 2 + y * 2, 2, 2, lit ? fill : edge);
    }
}

/** A nick: a small cut through the gray with copper in the bottom of it. */
function nick(p: Pal, t: Pixels, crawl: boolean): void {
  for (let i = -4; i <= 4; i++) {
    const w = 3 - Math.abs(i) * 0.6;
    for (let j = -Math.ceil(w); j <= Math.ceil(w); j++) {
      const x = 10 + i + j;
      const y = 10 - i + j;
      t.set(x, y, Math.abs(j) >= w - 0.5 ? p.c('ink', 0) : p.c('fire', 3 + (i & 1)));
    }
  }
  if (crawl) blob(t, 10, 10, 2, 2, p.r('virus'), 1, 4);
}

/** The cable's blocks, made as the map asks for them. */
export function cableBlocks(bs: BlockSet, p: Pal): DiagBlocks<Mark> {
  const paint = (c: DiagCell, mark?: Mark) => {
    // the folds: into the kink at its first column, and back out at the map's left edge
    const look: Look = { bare: c.bare, mark, flat: c.flat, lip: c.x === KINK || c.x === 0 };
    const pic = cell(p, c, look);
    if (mark === 'chevron') chevron(pic, c.flat, p.c('ins', 1));
    if (mark?.startsWith('digit')) digit(pic, Number(mark.slice(5)), p.c('ins', 1), p.c('ins', 6));
    if (mark === 'nick' || mark === 'crawl') nick(p, pic, mark === 'crawl');
    return pic;
  };
  const props = (c: DiagCell, mark?: Mark) => ({
    ...(mark !== 'splice' && c.ground ? { solid: SOLID } : {}),
    ...(mark === 'spark' ? { birth: 'zap', birthTime: 9 } : {}),
    ...(mark === 'crawl' ? { birth: 'crawl', birthTime: 40 } : {}),
  });
  return new DiagBlocks(bs, CABLE_TRACK, paint, props, 'cab');
}

/** The look the pickups are drawn over: the middle of the cable on the slant. */
export function cableArt(p: Pal): StageArt {
  const at: DiagCell = { x: 0, y: 0, t: BOARD + 6, flat: false, bare: () => false, ground: false };
  const mid = () => cell(p, at, { bare: () => false, flat: false, lip: false });
  return { pal: p, floor: mid, edge: mid, floors: 1, edges: 1 };
}

/** A plain block of board (for parts to sit on). */
const boardPic = (p: Pal) => new Pixels(20, 20).map((x, y) => weave(p, x, y));

/**
 * A black IDC plug crimped over the cable's end, seen from above on the kink: `rows` blocks
 * tall, three wide, two rows of pin holes down its face, a triangle at pin 1 (the bottom: on
 * the kink the cable is folded over, so the red wire runs along its bottom edge), and the
 * cable coming out of its `side`.
 */
export function plugPic(p: Pal, rows: number, side: 'L' | 'R'): Pixels {
  const H = rows * 20;
  const big = new Pixels(60, H);
  for (let r = 0; r < rows; r++)
    big
      .blit(boardPic(p), 0, r * 20)
      .blit(boardPic(p), 20, r * 20)
      .blit(boardPic(p), 40, r * 20);
  // its shadow on the board, then the body
  big.rect(8, 6, 50, H - 8, p.c('base', 0));
  bevel(big, 4, 2, 50, H - 8, p.r('plug'), 1, 2);
  // the strain relief bar across the cable side
  const bx = side === 'R' ? 40 : 6;
  bevel(big, bx, 4, 10, H - 12, p.r('plug'), 2, 1);
  // two rows of pin holes, one every 10 pixels (so the middle rows repeat)
  const px0 = side === 'R' ? 14 : 24;
  for (let y = 10; y < H - 12; y += 10)
    for (const x of [px0, px0 + 8]) {
      big.rect(x, y, 5, 5, p.c('ink', 0));
      big.rect(x + 1, y + 1, 3, 3, p.c('trim', 2));
      big.set(x + 1, y + 1, p.c('trim', 5));
    }
  // pin 1
  for (let i = 0; i < 4; i++) big.rect(px0 + 3 - i, H - 8 - i, 1 + i * 2, 1, p.c('ins', 7));
  return big;
}

/** The parts on the board, each `[name, w, h, picture]` in blocks. */
export function boardParts(p: Pal): [string, number, number, Pixels][] {
  const out: [string, number, number, Pixels][] = [];
  const on = (w: number, h: number) => {
    const big = new Pixels(w * 20, h * 20);
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) big.blit(boardPic(p), c * 20, r * 20);
    return big;
  };
  // a chip with legs down both sides
  const chip = (label: string) => {
    const big = on(2, 2);
    for (let y = 5; y < 36; y += 4) big.rect(2, y, 4, 2, p.c('steel', 5)).rect(34, y, 4, 2, p.c('steel', 5));
    bevel(big, 5, 2, 30, 36, p.r('deep'), 1, 1);
    big.ring(10, 7, 1.5, p.c('deep', 3));
    micro(big, 9, 16, label.slice(0, 4), p.c('ins', 6));
    micro(big, 9, 22, label.slice(4), p.c('ins', 6));
    return big;
  };
  out.push(['chipA', 2, 2, chip('74LS245')]);
  out.push(['chipB', 2, 2, chip('IDE 1F0')]);
  // an electrolytic capacitor, seen from above, its vent cross on top
  const cap = on(1, 1);
  blob(cap, 9.5, 9.5, 8, 8, p.r('label'), 0, 4);
  cap.line(5, 9, 14, 9, p.c('label', 1)).line(9, 5, 9, 14, p.c('label', 1));
  for (let y = 3; y < 17; y++) cap.set(3, y, p.c('ins', 6));
  out.push(['cap', 1, 1, cap]);
  // a resistor across two pads
  const res = on(1, 1);
  res.rect(1, 8, 4, 4, p.c('steel', 4)).rect(15, 8, 4, 4, p.c('steel', 4));
  bevel(res, 4, 6, 12, 8, p.r('gold'), 2, 1);
  for (const [x, c] of [
    [6, 'red'],
    [9, 'deep'],
    [12, 'fire'],
  ] as [number, string][])
    res.rect(x, 6, 2, 8, p.c(c, 2));
  out.push(['res', 1, 1, res]);
  // a crystal can
  const xtal = on(2, 1);
  bevel(xtal, 3, 4, 34, 12, p.r('steel'), 4, 2);
  micro(xtal, 9, 8, '14.31', p.c('deep', 0));
  out.push(['xtal', 2, 1, xtal]);
  // solder points and vias
  const pads = on(1, 1);
  const r = rng(5);
  for (let i = 0; i < 4; i++) {
    const x = 3 + Math.floor(r() * 13);
    const y = 3 + Math.floor(r() * 13);
    pads.rect(x - 1, y - 1, 4, 4, p.c('steel', 5)).rect(x, y, 2, 2, p.c('steel', 2));
  }
  out.push(['pads', 1, 1, pads]);
  // a trace running with the cable, corner to corner (it joins up block to block)
  const trace = on(1, 1);
  for (let i = 0; i < 20; i++) trace.rect(i, 19 - i, 2, 1, p.c('trim', 3)).set(i, 18 - i, p.c('trim', 5));
  out.push(['trace', 1, 1, trace]);
  return out;
}
