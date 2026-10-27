// Stage 1's diagonal leg, "Copper Traces" (its own palette, s1r.pal, the motherboard's with
// the cable's grays): four wide buses of copper traces laid corner to corner over green solder
// mask, bending flat at the kink the way real traces turn, in 45-degree steps. Each bus is a
// band of lighter mask outlined in white silkscreen with five thin gold traces along it, so the
// gold is an accent, not the whole screen; on it sit silkscreen part names (R12, C7, U3...),
// solder pads, a test point, a patch of cross-hatched copper fill, numbers and arrows. Between
// the buses, darker mask with etched pits and the board's parts. Where a trace is pitted it
// spits sparks (a via) or lets Bit Mites out (a crack), and in one place a silver jumper wire
// bridges the mask to the next bus. The course starts at a gold edge pad and ends in a black
// chipset chip's leg, the way out.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../../web/src/formats/blocks';
import { Pixels } from '../../../kit/pixels';
import { BlockSet, bevel, blob, micro, shadeAt } from '../art/draw';
import type { Pal } from '../art/pal';
import type { StageArt } from './tiles';
import type { DiagTrack } from '../stages/diagTrack';
import { DiagBlocks, tAt, type DiagCell } from './diagBlocks';
import { digit } from './cable';

export type TraceMark = 'via' | 'crack' | 'jumper' | 'chevron' | 'pad' | 'hatch' | 'tp' | `digit${number}` | `silk${string}`;

const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** The solder mask's weave. */
function mask(p: Pal, px: number, py: number, lift = 0): number {
  const w = ((px + py) % 4 === 0 ? 0.15 : 0) + ((px - py + 40) % 4 === 0 ? 0.1 : 0);
  return shadeAt(p.r('base'), 1, 3, 0.35 + w + lift, px, py);
}

function colorAt(p: Pal, k: DiagTrack, T: number, px: number, py: number, c: DiagCell, mark?: TraceMark): number {
  const S = mod(T - 0.5, k.lanes * k.pitch);
  const lane = Math.floor(S / k.pitch);
  const h = S - lane * k.pitch;
  if (h < k.board || c.bare(lane)) {
    if (mark === 'jumper' && h < k.board) {
      // a silver jumper wire across the mask, two strands, its ends soldered
      const q = h / k.board;
      if (q < 0.08 || q > 0.92) return shadeAt(p.r('steel'), 3, 6, 0.6, px, py);
      const strand = (px - py + 40) % 10;
      return strand < 4 ? shadeAt(p.r('steel'), 3, 6, 0.3 + strand * 0.18, px, py) : mask(p, px, py, -0.2);
    }
    // the mask between the buses (the board's parts sit on it), with etched pits
    if ((px * 3 + py * 5) % 31 === 0) return p.c('base', 0);
    return mask(p, px, py, h < 0.6 && !c.bare(mod(lane - 1, k.lanes)) ? -0.3 : 0);
  }
  const w = k.pitch - k.board;
  const e = h - k.board;
  if (e < 0.1 || e > w - 0.1) return p.c('ink', 0);
  // the lane's white silkscreen outline
  if (Math.abs(e - 0.45) < 0.1 || Math.abs(e - (w - 0.45)) < 0.1) return p.c('gray', 6);
  if (mark === 'hatch') {
    // bare copper poured as a fill: cross-hatched
    return (px + py) % 4 === 0 || (px - py + 40) % 4 === 0 ? p.c('trim', 4) : p.c('trim', 1);
  }
  // a bus of copper traces along the lane, gold over a lighter mask
  const lanes = 5;
  const q = ((e - 0.7) / (w - 1.4)) * lanes;
  const f = q - Math.floor(q);
  if (q > 0 && q < lanes && f > 0.36 && f < 0.64) return shadeAt(p.r('trim'), 2, 5, 0.3 + (f < 0.45 ? 0.5 : 0.2), px, py);
  return mask(p, px, py, 0.35);
}

/** A bold silkscreen arrow along the trace (up and to the right, or right on the kink), outlined. */
function arrow(t: Pixels, flat: boolean, fill: number, edge: number): void {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 8; i++) pts.push(flat ? [6 + i * 0.8, 3 + i * 0.8] : [5 + i, 5], flat ? [6 + i * 0.8, 16 - i * 0.8] : [14, 5 + i]);
  for (const [x, y] of pts) t.rect(Math.round(x) - 2, Math.round(y) - 2, 5, 5, edge);
  for (const [x, y] of pts) t.rect(Math.round(x) - 1, Math.round(y) - 1, 3, 3, fill);
}

/** The pit of a via (it sparks) or a crack in the copper (a Bit Mite crawls out). */
function pit(p: Pal, t: Pixels, crack: boolean): void {
  if (crack) {
    for (let i = -5; i <= 5; i++) {
      const x = 10 + i;
      const y = 10 - i + (i & 1 ? 1 : -1);
      t.rect(x, y, 2, 2, p.c('ink', 0)).set(x, y + 2, p.c('trim', 1));
    }
    blob(t, 10, 10, 2, 2, p.r('virus'), 1, 4);
  } else {
    blob(t, 9.5, 9.5, 5, 5, p.r('steel'), 2, 6);
    t.disc(9.5, 9.5, 2.5, p.c('ink', 0));
    t.set(9, 9, p.c('fire', 5));
  }
}

export function traceBlocks(bs: BlockSet, p: Pal, k: DiagTrack): DiagBlocks<TraceMark> {
  const paint = (c: DiagCell, mark?: TraceMark) => {
    const t = new Pixels(20, 20).map((x, y) => colorAt(p, k, tAt(c, x, y), x, y, c, mark));
    // silkscreen on the copper: white, outlined dark
    if (mark === 'chevron') arrow(t, c.flat, p.c('gray', 7), p.c('trim', 1));
    if (mark?.startsWith('digit')) digit(t, Number(mark.slice(5)), p.c('gray', 7), p.c('trim', 1));
    if (mark === 'via' || mark === 'crack') pit(p, t, mark === 'crack');
    if (mark === 'pad') {
      // a solder pad pair with their vias
      for (const x of [5, 13]) t.rect(x - 2, 7, 5, 6, p.c('steel', 5)).rect(x, 9, 1, 2, p.c('ink', 0));
    }
    if (mark === 'tp') {
      // a test point: a ring and its label
      t.ring(10, 12, 3.5, p.c('gray', 7));
      t.rect(9, 11, 3, 3, p.c('trim', 5));
      micro(t, 3, 2, 'TP', p.c('gray', 7));
    }
    if (mark?.startsWith('silk')) {
      // a part's name in white silkscreen, with its outline
      const name = mark.slice(4);
      t.rect(1, 5, name.length * 4 + 3, 9, p.c('base', 1)).frame(1, 5, name.length * 4 + 3, 9, p.c('gray', 7));
      micro(t, 3, 7, name, p.c('gray', 7));
    }
    return t;
  };
  const props = (c: DiagCell, mark?: TraceMark) => ({
    ...(mark !== 'jumper' && c.ground ? { solid: SOLID } : {}),
    ...(mark === 'via' ? { birth: 'zap', birthTime: 11 } : {}),
    ...(mark === 'crack' ? { birth: 'crawl', birthTime: 44 } : {}),
  });
  return new DiagBlocks(bs, k, paint, props, 'cu');
}

/** The look the pickups are drawn over: the middle of the copper on the slant. */
export function traceArt(p: Pal, k: DiagTrack): StageArt {
  const at: DiagCell = { x: 0, y: 0, t: k.board + 6, flat: false, bare: () => false, ground: false };
  const mid = () => new Pixels(20, 20).map((x, y) => colorAt(p, k, tAt(at, x, y), x, y, at));
  return { pal: p, floor: mid, edge: mid, floors: 1, edges: 1 };
}

const maskPic = (p: Pal) => new Pixels(20, 20).map((x, y) => mask(p, x, y));

/** The gold edge pad the course starts from, `rows` blocks tall and three wide, its via holes in a row. */
export function edgePad(p: Pal, rows: number): Pixels {
  const H = rows * 20;
  const big = new Pixels(60, H);
  for (let r = 0; r < rows; r++) for (let c = 0; c < 3; c++) big.blit(maskPic(p), c * 20, r * 20);
  bevel(big, 4, 4, 52, H - 8, p.r('trim'), 4, 2);
  for (let y = 14; y < H - 12; y += 12) {
    big.disc(18, y, 3.5, p.c('trim', 1)).disc(18, y, 2, p.c('ink', 0));
    big.disc(36, y + 6, 3.5, p.c('trim', 1)).disc(36, y + 6, 2, p.c('ink', 0));
  }
  micro(big, 8, 8, 'J1', p.c('gray', 7));
  return big;
}

/** The chip the course ends in: a black package, its silver legs along the left where the trace comes in. */
export function chipEnd(p: Pal, rows: number): Pixels {
  const H = rows * 20;
  const big = new Pixels(60, H);
  for (let r = 0; r < rows; r++) for (let c = 0; c < 3; c++) big.blit(maskPic(p), c * 20, r * 20);
  big.rect(16, 6, 42, H - 8, p.c('base', 0));
  bevel(big, 12, 2, 44, H - 8, p.r('deep'), 1, 2);
  for (let y = 8; y < H - 10; y += 6) big.rect(2, y, 10, 3, p.c('steel', 5)).rect(2, y, 10, 1, p.c('steel', 6));
  big.disc(22, 10, 2.5, p.c('deep', 3));
  micro(big, 24, H / 2 - 6, '82C206', p.c('gray', 6));
  micro(big, 24, H / 2, '1994', p.c('gray', 4));
  return big;
}
