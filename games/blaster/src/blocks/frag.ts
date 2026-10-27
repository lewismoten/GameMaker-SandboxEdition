// Stage 4's diagonal leg, "Fragmented File" (its own palette, s4r.pal, the hard disk's): Mom's
// recipe file, scattered over the platter in four fragments, and the BLASTER follows it from
// its directory entry to its end. Each fragment is a lane of bright sectors laid corner to
// corner, the magnetic track rings along it and the data written as dashes, over the dark
// unformatted gap between the tracks. Bad sectors spark, lost clusters let mites out, and one
// gold cluster link (the FAT's pointer to the next fragment) jumps a lane a lap early. The
// course starts at RECIPES.TXT's directory entry and ends at EOF, the way out.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, bevel, blob, micro, shadeAt } from '../art/draw';
import type { Pal } from '../art/pal';
import type { StageArt } from './tiles';
import type { DiagTrack } from '../stages/diagTrack';
import { DiagBlocks, tAt, type DiagCell } from './diagBlocks';
import { digit } from './cable';

export type FragMark = 'bad' | 'lost' | 'link' | 'arrow' | `digit${number}`;

const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** The dark gap between the tracks. */
function gap(p: Pal, px: number, py: number, lift = 0): number {
  return shadeAt(p.r('deep'), 0, 2, 0.4 + lift + ((px * 5 + py * 3) % 17 === 0 ? 0.25 : 0), px, py);
}

function colorAt(p: Pal, k: DiagTrack, T: number, px: number, py: number, c: DiagCell, mark?: FragMark): number {
  const S = mod(T - 0.5, k.lanes * k.pitch);
  const lane = Math.floor(S / k.pitch);
  const h = S - lane * k.pitch;
  if (h < k.board || c.bare(lane)) {
    if (mark === 'link' && h < k.board) {
      // the FAT's pointer: a gold chain across the gap
      const q = h / k.board;
      if (q < 0.06 || q > 0.94) return p.c('trim', 2);
      const link = mod(px - py, 10);
      const ring = Math.abs(q - 0.5) < 0.22 && (link < 2 || link > 7);
      return ring || Math.abs(Math.abs(q - 0.5) - 0.22) < 0.05 ? shadeAt(p.r('trim'), 3, 6, 0.6, px, py) : gap(p, px, py, -0.2);
    }
    return gap(p, px, py, h < 0.6 && !c.bare(mod(lane - 1, k.lanes)) ? -0.3 : 0);
  }
  const w = k.pitch - k.board;
  const e = h - k.board;
  if (e < 0.1 || e > w - 0.1) return p.c('ink', 0);
  if (e < 0.45 || e > w - 0.45) return p.c('base', 7);
  // bright chrome tracks, ringed along their length, the data written as dark dashes
  const ring = Math.sin(e * 2.2) * 0.12;
  const dash = Math.floor(e) % 3 === 1 && mod(px - py, 6) < 3;
  if (dash) return p.c('base', 2);
  return shadeAt(p.r('base'), 3, 6, 0.5 + ring, px, py);
}

/** A bold arrow along the track, red, outlined. */
function arrow(t: Pixels, flat: boolean, fill: number, edge: number): void {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 8; i++) pts.push(flat ? [6 + i * 0.8, 3 + i * 0.8] : [5 + i, 5], flat ? [6 + i * 0.8, 16 - i * 0.8] : [14, 5 + i]);
  for (const [x, y] of pts) t.rect(Math.round(x) - 2, Math.round(y) - 2, 5, 5, edge);
  for (const [x, y] of pts) t.rect(Math.round(x) - 1, Math.round(y) - 1, 3, 3, fill);
}

export function fragBlocks(bs: BlockSet, p: Pal, k: DiagTrack): DiagBlocks<FragMark> {
  const paint = (c: DiagCell, mark?: FragMark) => {
    const t = new Pixels(20, 20).map((x, y) => colorAt(p, k, tAt(c, x, y), x, y, c, mark));
    if (mark === 'arrow') arrow(t, c.flat, p.c('glow', 2), p.c('ink', 0));
    if (mark?.startsWith('digit')) digit(t, Number(mark.slice(5)), p.c('glow', 2), p.c('ink', 0));
    if (mark === 'bad') {
      // a bad sector: scorched, a red X
      blob(t, 9.5, 9.5, 7, 7, p.r('deep'), 0, 2);
      for (let i = 3; i < 17; i++) t.rect(i, i, 2, 2, p.c('glow', 3)).rect(i, 19 - i - 1, 2, 2, p.c('glow', 3));
    }
    if (mark === 'lost') {
      // a lost cluster: a hole in the track, mites inside
      blob(t, 9.5, 9.5, 5.5, 4.5, p.r('deep'), 0, 1, -0.5);
      t.set(8, 9, p.c('slime', 4)).set(11, 10, p.c('slime', 3));
    }
    return t;
  };
  const props = (c: DiagCell, mark?: FragMark) => ({
    ...(mark !== 'link' && c.ground ? { solid: SOLID } : {}),
    ...(mark === 'bad' ? { birth: 'zap', birthTime: 9 } : {}),
    ...(mark === 'lost' ? { birth: 'crawl', birthTime: 40 } : {}),
  });
  return new DiagBlocks(bs, k, paint, props, 'fr');
}

/** The look the pickups are drawn over: the middle of a track on the slant. */
export function fragArt(p: Pal, k: DiagTrack): StageArt {
  const at: DiagCell = { x: 0, y: 0, t: k.board + 7, flat: false, bare: () => false, ground: false };
  const mid = () => new Pixels(20, 20).map((x, y) => colorAt(p, k, tAt(at, x, y), x, y, at));
  return { pal: p, floor: mid, edge: mid, floors: 1, edges: 1 };
}

const gapPic = (p: Pal) => new Pixels(20, 20).map((x, y) => gap(p, x, y));

/** The file's ends over the kink: its directory entry where the course starts, EOF where it ends. */
export function fragEnd(p: Pal, rows: number, which: 'dir' | 'eof'): Pixels {
  const H = rows * 20;
  const big = new Pixels(60, H);
  for (let r = 0; r < rows; r++) for (let c = 0; c < 3; c++) big.blit(gapPic(p), c * 20, r * 20);
  bevel(big, 3, 3, 54, H - 6, p.r('label'), 3, 2);
  const ink = p.c('ink', 0);
  if (which === 'dir') {
    micro(big, 8, 10, 'RECIPES', ink);
    micro(big, 8, 17, '.TXT', ink);
    micro(big, 8, 28, '13 KB', p.c('base', 2));
    for (let y = 40; y < H - 10; y += 8) big.rect(8, y, 42, 2, p.c('label', 1));
  } else {
    micro(big, 22, H / 2 - 6, 'EOF', p.c('glow', 3));
    micro(big, 14, H / 2 + 2, 'FFFF', ink);
  }
  return big;
}

/** The parts in the gap between the tracks: dust, a stray scratch, a sector number. */
export function fragParts(p: Pal): [string, number, number, Pixels][] {
  const out: [string, number, number, Pixels][] = [];
  const dust = gapPic(p);
  const r = rng(17);
  for (let i = 0; i < 4; i++) dust.rect(3 + Math.floor(r() * 14), 3 + Math.floor(r() * 14), 2, 1, p.c('gray', 3));
  out.push(['dust', 1, 1, dust]);
  const num = gapPic(p);
  micro(num, 3, 8, 'S' + String(12 + Math.floor(r() * 80)), p.c('deep', 4));
  out.push(['num', 1, 1, num]);
  const scratch = gapPic(p);
  scratch.line(2, 17, 17, 4, p.c('deep', 4));
  out.push(['scratch', 1, 1, scratch]);
  return out;
}
