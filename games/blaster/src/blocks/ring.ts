// Stage 2's diagonal leg, "The Ring Buffer" (its own palette, s2r.pal, Memory Lane's): four
// rows of memory laid corner to corner over the SIMM's blue board, each a lane of eight bit
// tracks with a lit bit here and there and glowing teal rails along its edges. A ring buffer
// wraps: the course reads from TAIL, comes round the wrap at each kink onto the next row, and
// ends at HEAD, the way out. Where a bit is stuck it sparks, a leak lets mites out, and one
// pointer (a dotted cyan link) jumps a row a lap early.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, bevel, blob, micro, outlined, shadeAt } from '../art/draw';
import type { Pal } from '../art/pal';
import type { StageArt } from './tiles';
import type { DiagTrack } from '../stages/diagTrack';
import { DiagBlocks, tAt, type DiagCell } from './diagBlocks';
import { digit } from './cable';
import { dram } from './ram';

export type RingMark = 'stuck' | 'leak' | 'link' | 'arrow' | `digit${number}`;

const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** The SIMM's board between the rows: blue, with its fine cell grid. */
function board(p: Pal, px: number, py: number, lift = 0): number {
  if (px % 5 === 2 && py % 5 === 2) return p.c('base', 3);
  return shadeAt(p.r('base'), 0, 1, 0.5 + lift + ((px * 3 + py) % 7 === 0 ? 0.15 : 0), px, py);
}

function colorAt(p: Pal, k: DiagTrack, T: number, px: number, py: number, c: DiagCell, mark?: RingMark): number {
  const S = mod(T - 0.5, k.lanes * k.pitch);
  const lane = Math.floor(S / k.pitch);
  const h = S - lane * k.pitch;
  if (h < k.board || c.bare(lane)) {
    if (mark === 'link' && h < k.board) {
      // a pointer: a dotted cyan link across the board, in the lane's direction of travel
      const q = h / k.board;
      if (q < 0.1 || q > 0.9) return p.c('cyan', 4);
      return (px + py) % 4 < 2 ? p.c('cyan', 3) : board(p, px, py, -0.25);
    }
    return board(p, px, py, h < 0.6 && !c.bare(mod(lane - 1, k.lanes)) ? -0.35 : 0);
  }
  const w = k.pitch - k.board;
  const e = h - k.board;
  if (e < 0.1 || e > w - 0.1) return p.c('ink', 0);
  // the rails: glowing teal edges
  if (e < 0.5 || e > w - 0.5) return p.c('glow', 3);
  // eight bit tracks across the row, dark navy, a lit bit now and then
  const bit = Math.floor(((e - 0.5) / (w - 1)) * 8);
  const q = ((e - 0.5) / (w - 1)) * 8 - bit;
  if (q < 0.1) return p.c('base', 0);
  if ((px * 7 + py * 3 + bit * 5) % 29 === 0) return p.c('glow', 4);
  return shadeAt(p.r('base'), 2, 4, 0.3 + (bit & 1 ? 0.15 : 0) + 0.25 * Math.sin(Math.PI * q), px, py);
}

/** A bold arrow along the row (up and to the right, or right on the kink), teal, outlined. */
function arrow(t: Pixels, flat: boolean, fill: number, edge: number): void {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 8; i++) pts.push(flat ? [6 + i * 0.8, 3 + i * 0.8] : [5 + i, 5], flat ? [6 + i * 0.8, 16 - i * 0.8] : [14, 5 + i]);
  for (const [x, y] of pts) t.rect(Math.round(x) - 2, Math.round(y) - 2, 5, 5, edge);
  for (const [x, y] of pts) t.rect(Math.round(x) - 1, Math.round(y) - 1, 3, 3, fill);
}

export function ringBlocks(bs: BlockSet, p: Pal, k: DiagTrack): DiagBlocks<RingMark> {
  const paint = (c: DiagCell, mark?: RingMark) => {
    const t = new Pixels(20, 20).map((x, y) => colorAt(p, k, tAt(c, x, y), x, y, c, mark));
    if (mark === 'arrow') arrow(t, c.flat, p.c('glow', 4), p.c('base', 0));
    if (mark?.startsWith('digit')) digit(t, Number(mark.slice(5)), p.c('glow', 4), p.c('base', 0));
    if (mark === 'stuck') {
      // a stuck bit: a red-hot cell
      blob(t, 9.5, 9.5, 5, 5, p.r('red'), 1, 4);
      t.rect(8, 8, 4, 4, p.c('fire', 6));
    }
    if (mark === 'leak') {
      // a leak: a hole in the row, gold mites inside
      blob(t, 9.5, 9.5, 5.5, 4.5, p.r('deep'), 0, 1, -0.5);
      t.set(8, 9, p.c('gold', 4)).set(11, 10, p.c('gold', 3));
    }
    return t;
  };
  const props = (c: DiagCell, mark?: RingMark) => ({
    ...(mark !== 'link' && c.ground ? { solid: SOLID } : {}),
    ...(mark === 'stuck' ? { birth: 'zap', birthTime: 10 } : {}),
    ...(mark === 'leak' ? { birth: 'crawl', birthTime: 42 } : {}),
  });
  return new DiagBlocks(bs, k, paint, props, 'rb');
}

/** The look the pickups are drawn over: the middle of a row on the slant. */
export function ringArt(p: Pal, k: DiagTrack): StageArt {
  const at: DiagCell = { x: 0, y: 0, t: k.board + 7, flat: false, bare: () => false, ground: false };
  const mid = () => new Pixels(20, 20).map((x, y) => colorAt(p, k, tAt(at, x, y), x, y, at));
  return { pal: p, floor: mid, edge: mid, floors: 1, edges: 1 };
}

const boardPic = (p: Pal) => new Pixels(20, 20).map((x, y) => board(p, x, y));

/** A pointer plate over the kink: TAIL where the course starts, HEAD where it ends (the way out). */
export function pointer(p: Pal, rows: number, name: 'TAIL' | 'HEAD'): Pixels {
  const H = rows * 20;
  const big = new Pixels(60, H);
  for (let r = 0; r < rows; r++) for (let c = 0; c < 3; c++) big.blit(boardPic(p), c * 20, r * 20);
  bevel(big, 4, 4, 52, H - 8, p.r('trim'), 3, 2);
  big.rect(8, 8, 44, H - 16, p.c('base', 0));
  // the arrow it points with, and its name
  const mid = H / 2;
  for (let i = 0; i < 12; i++) big.rect(name === 'TAIL' ? 40 + i : 18 - i, mid - 12 + i, 1, 24 - i * 2, p.c('glow', 3));
  outlined(big, 12, 14, name, p.c('gold', 4), p.c('ink', 0), 1);
  micro(big, 14, H - 22, name === 'TAIL' ? 'READ' : 'WRITE', p.c('glow', 3));
  return big;
}

/** The parts on the board between the rows: DRAM chips, little capacitors, gold test pads. */
export function ringParts(p: Pal): [string, number, number, Pixels][] {
  const art: StageArt = { pal: p, floor: () => boardPic(p), edge: () => boardPic(p), floors: 1, edges: 1 };
  const out: [string, number, number, Pixels][] = [];
  out.push(['dramA', 2, 3, dram(art, '41256')]);
  out.push(['dramB', 2, 3, dram(art, '44C256')]);
  const cap = boardPic(p);
  bevel(cap, 5, 7, 10, 6, p.r('gold'), 2, 1);
  cap.rect(3, 9, 2, 2, p.c('steel', 5)).rect(15, 9, 2, 2, p.c('steel', 5));
  out.push(['cap', 1, 1, cap]);
  const pads = boardPic(p);
  const r = rng(9);
  for (let i = 0; i < 3; i++) {
    const x = 3 + Math.floor(r() * 13);
    const y = 3 + Math.floor(r() * 13);
    pads.rect(x - 1, y - 1, 4, 4, p.c('trim', 5)).rect(x, y, 2, 2, p.c('trim', 2));
  }
  out.push(['pads', 1, 1, pads]);
  return out;
}
