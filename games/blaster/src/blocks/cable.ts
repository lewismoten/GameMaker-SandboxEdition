// The ribbon cable's blocks (stage 5's palette): gray insulation ridges and copper wires,
// drawn from the track value t so the slanted lanes join up across block edges, plus the
// red wire, chevrons, painted wire numbers and the splices (gaps in a ridge).
//
// A block on the slant shows t from its corner value c to c + 2 (t grows by one block
// right or down); on the kink it shows c to c + 1 down the block, so the lanes lie flat.
// The ridge is drawn half a block below where its solid cells start, so a ship pressed to it
// on the slant (whose turned picture has a pointed nose) just touches it.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../../web/src/formats/blocks';
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';
import { Pixels } from '../../../kit/pixels';
import { BlockSet, shadeAt } from '../art/draw';
import type { Pal } from '../art/pal';
import type { StageArt } from './tiles';
import { PITCH, RED, RIDGE, WIRES } from '../stages/cableTrack';

export type Mark = 'chevron' | 'gap' | `digit${number}`;
type Slope = 'slant' | 'flat';

const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;
const LAP = PITCH * WIRES;
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** One pixel at track value T (any real; it repeats every 100). */
function colorAt(p: Pal, T: number, px: number, py: number, gap: boolean): number {
  const S = mod(T - 0.5, LAP);
  const wire = Math.floor(S / PITCH);
  const h = S - wire * PITCH;
  // a ridge belongs to the wire below it; the red wire's two ridges are red
  const redRidge = wire === RED || wire === (RED + 1) % WIRES;
  if (h < RIDGE && !gap) {
    const r = h / RIDGE;
    if (r < 0.07 || r > 0.93) return p.c('ink', 0);
    // a round ridge lit from the upper left, with a highlight
    const lit = 0.62 - 0.55 * (r - 0.5) * 2 + 0.4 * Math.exp(-(((r - 0.27) / 0.11) ** 2));
    return redRidge ? shadeAt(p.r('red'), 0, 4, lit, px, py) : shadeAt(p.r('gray'), 1, 6, lit, px, py);
  }
  const red = Math.floor(S / PITCH) === RED;
  if (gap && h < RIDGE) {
    // a splice: the ridge cut away, gold staples at its two edges
    const edge = h < 0.35 || h > RIDGE - 0.35;
    if (edge) return (px + py) % 4 < 2 ? p.c('gold', 4) : p.c('ink', 0);
    return shadeAt(p.r('gray'), 0, 1, 0.4, px, py);
  }
  // the lane: dark, with the ridge's shadow along its top and copper strands down its middle
  if (h < RIDGE + 0.9) return red ? p.c('red', 0) : p.c('gray', 0);
  // three thin copper strands, a little way in from each side and down the middle
  const strand = [6, 11.5, 17].some((c) => Math.abs(h - c) < 0.11);
  if (red) return strand ? p.c('red', 3) : shadeAt(p.r('red'), 0, 1, 0.3, px, py);
  return strand ? p.c('fire', 2) : shadeAt(p.r('gray'), 0, 1, 0.5, px, py);
}

/** The bare block whose corner has track value c. */
function cell(p: Pal, c: number, slope: Slope, gap = false): Pixels {
  const t = new Pixels(20, 20);
  t.map((x, y) => colorAt(p, c + (slope === 'slant' ? (x + y + 1) / 20 : (y + 0.5) / 20), x, y, gap));
  return t;
}

/** Paints a chevron pointing along the lane (up and to the right, or right on the kink). */
function chevron(t: Pixels, slope: Slope, color: number): void {
  for (let i = 0; i < 7; i++)
    for (const w of [0, 1]) {
      if (slope === 'slant') {
        t.set(7 + i, 5 + w, color).set(14 - w, 5 + i, color);
        t.set(3 + i, 9 + w, color).set(10 - w, 9 + i, color);
      } else {
        t.set(4 + i - w, 3 + i, color).set(4 + i - w, 17 - i, color);
        t.set(10 + i - w, 3 + i, color).set(10 + i - w, 17 - i, color);
      }
    }
}

/** Paints a wire number, two pixels to a font pixel, outlined. */
function digit(t: Pixels, n: number, fill: number, edge: number): void {
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < 8 && y < 8 && (FONT8X8[(48 + n) * 8 + y] & (1 << x)) !== 0;
  for (let y = -1; y < 9; y++)
    for (let x = -1; x < 9; x++) {
      const lit = on(x, y);
      const near = !lit && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1));
      if (lit || near) t.rect(2 + x * 2, 2 + y * 2, 2, 2, lit ? fill : edge);
    }
}

/** The cable's blocks, made as the map asks for them; blocks that look the same are one. */
export class CableBlocks {
  private seen = new Map<string, string>();
  constructor(
    readonly bs: BlockSet,
    readonly p: Pal,
  ) {}

  /** The block for corner value c on this slope, with an optional mark. Returns its name. */
  name(c: number, slope: Slope, mark?: Mark): string {
    const p = this.p;
    const gap = mark === 'gap';
    const pic = cell(p, c, slope, gap);
    const red = Math.floor(mod(c + 1, LAP) / PITCH) === RED;
    if (mark === 'chevron') chevron(pic, slope, red ? p.c('red', 4) : p.c('gold', 3));
    if (mark?.startsWith('digit')) digit(pic, Number(mark.slice(5)), red ? p.c('gray', 7) : p.c('gold', 4), p.c('ink', 0));
    const solid = !gap && mod(c, PITCH) < RIDGE;
    const key = `${solid ? 1 : 0}:${pic.px.join(',')}`;
    let name = this.seen.get(key);
    if (!name) {
      name = `cab${this.seen.size}`;
      this.bs.add(name, pic, solid ? { solid: SOLID } : {});
      this.seen.set(key, name);
    }
    return name;
  }
}

/** The look the pickups, launch pad and gate are drawn over: the middle of a copper wire. */
export function cableArt(p: Pal): StageArt {
  return { pal: p, floor: () => cell(p, 11, 'slant'), edge: () => cell(p, 11, 'slant'), floors: 1, edges: 1 };
}
