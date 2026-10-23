// "Make an edge set": from a fill block (grass) and the ground round it (dirt), paints the 12
// edge and corner blocks of a 3x3 terrain set plus its 4 inner corners, the 'edges' kind the
// map's terrain brush uses (map/tools/autotile.ts lists the same order). The border can wave
// (the same wave on every block, so neighbors meet) and get a darker outline from the fill's
// own palette ramp.
import { BLEN } from '../../../formats/blocks';

/** The 12 blocks made, in the terrain template's order (without the fill, which is slot 4). */
export const EDGE_SLOTS = [
  'Top-left corner',
  'Top edge',
  'Top-right corner',
  'Left edge',
  'Right edge',
  'Bottom-left corner',
  'Bottom edge',
  'Bottom-right corner',
  'Inner corner, gap top-left',
  'Inner corner, gap top-right',
  'Inner corner, gap bottom-left',
  'Inner corner, gap bottom-right',
] as const;

/** Which sides are open (outside) for each slot: [top, right, bottom, left], or a gap corner. */
const OPEN: { t?: 1; r?: 1; b?: 1; l?: 1; gap?: 'tl' | 'tr' | 'bl' | 'br' }[] = [
  { t: 1, l: 1 },
  { t: 1 },
  { t: 1, r: 1 },
  { l: 1 },
  { r: 1 },
  { b: 1, l: 1 },
  { b: 1 },
  { b: 1, r: 1 },
  { gap: 'tl' },
  { gap: 'tr' },
  { gap: 'bl' },
  { gap: 'br' },
];

export interface EdgeOptions {
  /** How far the outside comes in, in pixels (1..9). */
  depth: number;
  /** A gentle wave along the border. */
  wavy: boolean;
  /** Turns a fill pixel into its outline shade (one step darker), or undefined for none. */
  outline?: (c: number) => number;
}

/** The border's depth at position p along an edge (period BLEN, so blocks side by side meet). */
function border(p: number, o: EdgeOptions): number {
  return o.depth + (o.wavy ? Math.round(Math.sin((2 * Math.PI * (p + 0.5)) / BLEN) * Math.min(2, o.depth / 2)) : 0);
}

/** True where slot `k` shows the outside block. */
export function isOutside(k: number, x: number, y: number, o: EdgeOptions): boolean {
  const s = OPEN[k];
  const R = BLEN - 1;
  if (s.gap) {
    const [gx, gy] = [s.gap[1] === 'l' ? x : R - x, s.gap[0] === 't' ? y : R - y];
    return gx < border(s.gap[0] === 't' ? y : R - y, o) && gy < border(s.gap[1] === 'l' ? x : R - x, o);
  }
  return (!!s.t && y < border(x, o)) || (!!s.b && R - y < border(x, o)) || (!!s.l && x < border(y, o)) || (!!s.r && R - x < border(y, o));
}

/** The 12 edge and corner pictures, in EDGE_SLOTS order. */
export function makeEdgeSet(fill: Uint8Array, outside: Uint8Array, o: EdgeOptions): Uint8Array[] {
  return OPEN.map((_, k) => {
    const out = new Uint8Array(BLEN * BLEN);
    for (let y = 0; y < BLEN; y++)
      for (let x = 0; x < BLEN; x++) {
        const i = y * BLEN + x;
        if (isOutside(k, x, y, o)) out[i] = outside[i];
        else {
          const edge = o.outline && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            return nx >= 0 && ny >= 0 && nx < BLEN && ny < BLEN && isOutside(k, nx, ny, o);
          });
          out[i] = edge ? o.outline!(fill[i]) : fill[i];
        }
      }
    return out;
  });
}

/** The first run of 12 blocks (from `from`) that are blank (one color), or -1. */
export function freeRun(blocks: { pixels: Uint8Array }[], from = 1, need = EDGE_SLOTS.length): number {
  let run = 0;
  for (let i = from; i < blocks.length; i++) {
    const px = blocks[i].pixels;
    run = px.every((v) => v === px[0]) ? run + 1 : 0;
    if (run === need) return i - need + 1;
  }
  return -1;
}
