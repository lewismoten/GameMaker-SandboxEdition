// Stage 3's diagonal leg, "The Score" (its own palette, s3r.pal, the sound card's with cream
// paper): the song the FM chip is playing, written out as five staves of music laid corner to
// corner over the card's red board. Each staff is cream paper with its five black lines; the
// measure numbers count the staves left. Sharps spark, rests let mites out, and one tie (a
// black slur over a strip of paper) carries the ship to the next staff a lap early. The course
// starts at a treble clef and ends at the final double bar line, the way out.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, bevel, blob, micro, shadeAt } from '../art/draw';
import type { Pal } from '../art/pal';
import type { StageArt } from './tiles';
import type { DiagTrack } from '../stages/diagTrack';
import { DiagBlocks, tAt, type DiagCell } from './diagBlocks';
import { digit } from './cable';

export type ScoreMark = 'sharp' | 'rest' | 'tie' | 'arrow' | `digit${number}`;

const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** The ramp this leg adds to the sound card's palette. */
export function scoreRamps(p: Pal): void {
  p.ramp('paper', 5, [120, 104, 76], [255, 250, 232], [236, 224, 190]);
}

/** The card's red board between the staves. */
function board(p: Pal, px: number, py: number, lift = 0): number {
  const w = ((px + py) % 4 === 0 ? 0.15 : 0) + ((px - py + 40) % 4 === 0 ? 0.1 : 0);
  return shadeAt(p.r('base'), 1, 3, 0.3 + w + lift, px, py);
}

/** Where the five staff lines sit across a staff of width w. */
const lineAt = (e: number, w: number) => {
  for (let k = 1; k <= 5; k++) if (Math.abs(e - (w * k) / 6) < 0.13) return true;
  return false;
};

function colorAt(p: Pal, k: DiagTrack, T: number, px: number, py: number, c: DiagCell, mark?: ScoreMark): number {
  const S = mod(T - 0.5, k.lanes * k.pitch);
  const lane = Math.floor(S / k.pitch);
  const h = S - lane * k.pitch;
  if (h < k.board || c.bare(lane)) {
    if (mark === 'tie' && h < k.board) {
      // a strip of paper across the board with a black slur arcing over it
      const q = h / k.board;
      if (q < 0.06 || q > 0.94) return p.c('ink', 0);
      // a run of slurs: a black arch a block long, over and over
      const arc = Math.abs(q - 0.35 - 0.3 * Math.abs(Math.sin((Math.PI * mod(px - py, 20)) / 20)));
      return arc < 0.06 ? p.c('ink', 0) : shadeAt(p.r('paper'), 2, 4, 0.6, px, py);
    }
    return board(p, px, py, h < 0.6 && !c.bare(mod(lane - 1, k.lanes)) ? -0.3 : 0);
  }
  const w = k.pitch - k.board;
  const e = h - k.board;
  if (e < 0.12 || e > w - 0.12) return p.c('ink', 0);
  if (lineAt(e, w)) return p.c('ink', 0);
  // cream paper, a little shaded toward its edges
  return shadeAt(p.r('paper'), 2, 4, 0.75 - Math.abs(e - w / 2) / w, px, py);
}

/** A bold arrow along the staff, red, outlined. */
function arrow(t: Pixels, flat: boolean, fill: number, edge: number): void {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 8; i++) pts.push(flat ? [6 + i * 0.8, 3 + i * 0.8] : [5 + i, 5], flat ? [6 + i * 0.8, 16 - i * 0.8] : [14, 5 + i]);
  for (const [x, y] of pts) t.rect(Math.round(x) - 2, Math.round(y) - 2, 5, 5, edge);
  for (const [x, y] of pts) t.rect(Math.round(x) - 1, Math.round(y) - 1, 3, 3, fill);
}

export function scoreBlocks(bs: BlockSet, p: Pal, k: DiagTrack): DiagBlocks<ScoreMark> {
  const paint = (c: DiagCell, mark?: ScoreMark) => {
    const t = new Pixels(20, 20).map((x, y) => colorAt(p, k, tAt(c, x, y), x, y, c, mark));
    if (mark === 'arrow') arrow(t, c.flat, p.c('red', 2), p.c('paper', 4));
    if (mark?.startsWith('digit')) digit(t, Number(mark.slice(5)), p.c('red', 2), p.c('paper', 4));
    if (mark === 'sharp') {
      // a sharp, glowing hot: it spits sparks
      for (const x of [7, 12]) t.rect(x, 3, 2, 15, p.c('fire', 5));
      for (const y of [7, 12]) t.line(4, y + 1, 16, y - 1, p.c('fire', 5)).line(4, y + 2, 16, y, p.c('fire', 4));
    }
    if (mark === 'rest') {
      // a quarter rest, torn open: mites inside
      for (const [x, y] of [
        [8, 3],
        [10, 6],
        [8, 9],
        [10, 12],
        [8, 15],
      ])
        t.rect(x, y, 4, 3, p.c('ink', 0));
      blob(t, 10, 10, 2, 2, p.r('cyan'), 2, 5);
    }
    return t;
  };
  const props = (c: DiagCell, mark?: ScoreMark) => ({
    ...(mark !== 'tie' && c.ground ? { solid: SOLID } : {}),
    ...(mark === 'sharp' ? { birth: 'zap', birthTime: 10 } : {}),
    ...(mark === 'rest' ? { birth: 'crawl', birthTime: 40 } : {}),
  });
  return new DiagBlocks(bs, k, paint, props, 'st');
}

/** The look the pickups are drawn over: the middle of a staff on the slant. */
export function scoreArt(p: Pal, k: DiagTrack): StageArt {
  const at: DiagCell = { x: 0, y: 0, t: k.board + 7, flat: false, bare: () => false, ground: false };
  const mid = () => new Pixels(20, 20).map((x, y) => colorAt(p, k, tAt(at, x, y), x, y, at));
  return { pal: p, floor: mid, edge: mid, floors: 1, edges: 1 };
}

const boardPic = (p: Pal) => new Pixels(20, 20).map((x, y) => board(p, x, y));

/** The page's ends over the kink: a treble clef where the course starts, the final double bar where it ends. */
export function scoreEnd(p: Pal, rows: number, which: 'clef' | 'fine'): Pixels {
  const H = rows * 20;
  const big = new Pixels(60, H);
  for (let r = 0; r < rows; r++) for (let c = 0; c < 3; c++) big.blit(boardPic(p), c * 20, r * 20);
  bevel(big, 2, 2, 56, H - 4, p.r('paper'), 3, 2);
  const ink = p.c('ink', 0);
  if (which === 'clef') {
    // a treble clef: the tall stroke, its loop round the G line and the curl at the foot
    big.rect(30, 8, 3, H - 20, ink);
    for (let a = 0; a < Math.PI * 2; a += 0.05) big.rect(Math.round(30 + Math.cos(a) * 10), Math.round(H * 0.6 + Math.sin(a) * 12), 3, 3, ink);
    for (let a = 0; a < Math.PI; a += 0.05) big.rect(Math.round(25 + Math.cos(a) * 6), Math.round(H - 14 + Math.sin(a) * 4), 2, 2, ink);
    for (let a = -Math.PI / 2; a < Math.PI / 2; a += 0.05) big.rect(Math.round(31 + Math.cos(a) * 6), Math.round(14 + Math.sin(a) * 6), 2, 2, ink);
  } else {
    // the final bar: a thin line, a thick one, and FINE
    big.rect(14, 6, 3, H - 12, ink).rect(22, 6, 9, H - 12, ink);
    micro(big, 36, H / 2 - 2, 'FINE', p.c('red', 2));
  }
  return big;
}

/** The parts on the red board between the staves: little capacitors, resistors, solder pads. */
export function scoreParts(p: Pal): [string, number, number, Pixels][] {
  const out: [string, number, number, Pixels][] = [];
  const cap = boardPic(p);
  blob(cap, 9.5, 9.5, 7, 7, p.r('blue'), 1, 4);
  cap.line(6, 9, 13, 9, p.c('blue', 0));
  out.push(['cap', 1, 1, cap]);
  const res = boardPic(p);
  res.rect(1, 8, 4, 4, p.c('steel', 4)).rect(15, 8, 4, 4, p.c('steel', 4));
  bevel(res, 4, 6, 12, 8, p.r('trim'), 3, 1);
  res.rect(7, 6, 2, 8, p.c('red', 1)).rect(11, 6, 2, 8, p.c('ink', 0));
  out.push(['res', 1, 1, res]);
  const pads = boardPic(p);
  const r = rng(13);
  for (let i = 0; i < 3; i++) {
    const x = 3 + Math.floor(r() * 13);
    const y = 3 + Math.floor(r() * 13);
    pads.rect(x - 1, y - 1, 4, 4, p.c('steel', 5)).rect(x, y, 2, 2, p.c('steel', 2));
  }
  out.push(['pads', 1, 1, pads]);
  const chip = new Pixels(40, 40);
  for (let r2 = 0; r2 < 2; r2++) for (let c2 = 0; c2 < 2; c2++) chip.blit(boardPic(p), c2 * 20, r2 * 20);
  for (let y = 5; y < 36; y += 4) chip.rect(2, y, 4, 2, p.c('steel', 5)).rect(34, y, 4, 2, p.c('steel', 5));
  bevel(chip, 5, 2, 30, 36, p.r('deep'), 1, 1);
  micro(chip, 9, 16, 'DAC', p.c('label', 3));
  out.push(['chip', 2, 2, chip]);
  return out;
}
