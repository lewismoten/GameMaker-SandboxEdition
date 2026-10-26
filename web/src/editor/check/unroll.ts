// A map as the player goes through it. Game-Maker's maps wrap (walk off the right edge and you
// come in on the left, x mod 100), so a level can run on past an edge and seem bigger than its
// 100 x 100 blocks. Unroll follows the hero tick by tick in unwrapped blocks (x can go past 99 or
// below 0), from the bots' play (the walkthrough, the explorer), and keeps every screen it shows:
// - a jump (the explorer going back to a place it saved, a new way in) picks up on the lap where
//   that block was first seen, so the pieces join up;
// - walking onto a block first seen a lap away means that way goes round forever: it is folded
//   to one lap, cut where the least is seen, and its two edges meet.
// A map the hero never walks off reads as it is, and result() says so (undefined). No DOM.
import { MLEN, MWID } from '../../formats/map';
import { SCRNBLEN, SCRNBWID, type World } from '../../engine/world';

/** More blocks than this between two ticks is a jump, not a walk. */
const STEP = 4;
/** Past this many laps across or down (a bot left walking round), the way counts as going round forever. */
const MOST_LAPS = 3;

/** A box of blocks: x, y, width, height. */
export type UnrolledBox = [number, number, number, number];

/** A map as the player sees it, in unwrapped blocks: block (x, y) is the map's (x mod 100, y mod 100). */
export interface Unrolled {
  box: UnrolledBox;
  /** That way goes round forever: the box is one lap of it, and its two edges are the same place. */
  loops: [x: boolean, y: boolean];
  /** Only when the box is more than a lap across or down (a level that winds on): each row's [from, to) runs seen, x relative to the box. */
  runs?: [number, number][][];
}

const mod = (v: number, n: number) => ((v % n) + n) % n;
/** The step from `a` to `b` going the short way round. */
const near = (d: number, n: number) => mod(d + n / 2, n) - n / 2;

export class Unroll {
  /** Each block's lap the first time the hero stood on it, x and y (NaN: never). */
  private readonly lapX = new Float64Array(MLEN * MWID).fill(NaN);
  private readonly lapY = new Float64Array(MLEN * MWID).fill(NaN);
  /** The screens seen, by unwrapped top-left and size. */
  private readonly views = new Set<string>();
  private last: { x: number; y: number; ux: number; uy: number } | undefined;
  private off = false;
  private readonly loop: [boolean, boolean] = [false, false];

  /** The next tick starts afresh (a new scene, or a run from somewhere else). */
  cut(): void {
    this.last = undefined;
  }

  /**
   * One tick: the hero's block (`hx`, `hy`) and the screen's top-left (`vx`, `vy`) and size, all
   * as the engine has them (0 to 99).
   */
  look(hx: number, hy: number, vx: number, vy: number, vw: number, vh: number): void {
    const cell = mod(hy, MWID) * MLEN + mod(hx, MLEN);
    let ux: number;
    let uy: number;
    const l = this.last;
    const dx = l ? near(hx - l.x, MLEN) : 0;
    const dy = l ? near(hy - l.y, MWID) : 0;
    if (l && Math.abs(dx) <= STEP && Math.abs(dy) <= STEP) {
      ux = l.ux + dx;
      uy = l.uy + dy;
      const kx = Math.round((ux - mod(ux, MLEN)) / MLEN);
      const ky = Math.round((uy - mod(uy, MWID)) / MWID);
      if (!Number.isNaN(this.lapX[cell])) {
        if (this.lapX[cell] !== kx) this.loop[0] = true;
        if (this.lapY[cell] !== ky) this.loop[1] = true;
      }
    } else {
      // a jump: back where it was first seen, or a new place on the first lap
      const kx = Number.isNaN(this.lapX[cell]) ? 0 : this.lapX[cell];
      const ky = Number.isNaN(this.lapY[cell]) ? 0 : this.lapY[cell];
      ux = mod(hx, MLEN) + kx * MLEN;
      uy = mod(hy, MWID) + ky * MWID;
    }
    if (Number.isNaN(this.lapX[cell])) {
      this.lapX[cell] = Math.round((ux - mod(ux, MLEN)) / MLEN);
      this.lapY[cell] = Math.round((uy - mod(uy, MWID)) / MWID);
    }
    if (ux < 0 || uy < 0 || ux >= MLEN || uy >= MWID) this.off = true;
    if (Math.abs(ux) >= MOST_LAPS * MLEN) this.loop[0] = true;
    if (Math.abs(uy) >= MOST_LAPS * MWID) this.loop[1] = true;
    this.last = { x: hx, y: hy, ux, uy };
    // the screen next to the hero (a screen the hero isn't in is the sim's view drifting: skipped)
    const sx = ux + near(vx - hx, MLEN);
    const sy = uy + near(vy - hy, MWID);
    if (ux < sx || uy < sy || ux >= sx + vw || uy >= sy + vh) return;
    this.views.add(`${sx},${sy},${vw},${vh}`);
  }

  /** One tick of the engine: its hero and the screen it shows (and the next column or row while part way scrolled). */
  lookAt(w: World): void {
    this.look(
      w.chr.x[0],
      w.chr.y[0],
      w.mx,
      w.my,
      SCRNBLEN + (w.scroll.nx || w.scroll.littleShiftx ? 1 : 0),
      SCRNBWID + (w.scroll.ny || w.scroll.littleShifty ? 1 : 0),
    );
  }

  /** Every screen seen, as a box on the map itself (the edges are as far as it goes): for a map the hero never walks off. */
  seenBox(): UnrolledBox | undefined {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const v of this.views) {
      const [sx, sy, w, h] = v.split(',').map(Number);
      x0 = Math.min(x0, Math.max(0, sx));
      y0 = Math.min(y0, Math.max(0, sy));
      x1 = Math.max(x1, Math.min(MLEN, sx + w));
      y1 = Math.max(y1, Math.min(MWID, sy + h));
    }
    return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : undefined;
  }

  /** The map as the player sees it, or undefined when the hero never went off an edge (the map reads as it is). */
  result(): Unrolled | undefined {
    if (!this.off && !this.loop[0] && !this.loop[1]) return undefined;
    const seen = new Set<number>();
    // keyed in a wide-open frame: x and y each fit 16 bits round an offset
    const BIAS = 1 << 14;
    const key = (x: number, y: number) => (x + BIAS) * 65536 + (y + BIAS);
    for (const v of this.views) {
      const [sx, sy, w, h] = v.split(',').map(Number);
      for (let y = sy; y < sy + h; y++) for (let x = sx; x < sx + w; x++) seen.add(key(x, y));
    }
    const raw = [...seen].map((k) => [Math.floor(k / 65536) - BIAS, (k % 65536) - BIAS]);
    if (!raw.length) return undefined;
    // a way also goes round forever when one row (or column) was seen all the way round, though
    // the hero never walked the whole lap: a street whose two ends meet
    const allRound = (along: 0 | 1, n: number) => {
      const lines = new Map<number, Set<number>>();
      for (const c of raw) {
        const at = c[1 - along];
        let line = lines.get(at);
        if (!line) lines.set(at, (line = new Set()));
        line.add(mod(c[along], n));
      }
      return [...lines.values()].some((l) => l.size === n);
    };
    const lx = this.loop[0] || allRound(0, MLEN);
    const ly = this.loop[1] || allRound(1, MWID);
    const folded = new Set(raw.map(([x, y]) => key(lx ? mod(x, MLEN) : x, ly ? mod(y, MWID) : y)));
    const cells = [...folded].map((k) => [Math.floor(k / 65536) - BIAS, (k % 65536) - BIAS]);
    // a folded way is cut where the fewest blocks are seen, so the most of it stays in one piece
    const cutAt = (axis: 0 | 1, n: number) => {
      const count = new Array<number>(n).fill(0);
      for (const c of cells) count[c[axis]]++;
      let best = 0;
      for (let i = 1; i < n; i++) if (count[i] < count[best]) best = i;
      return best;
    };
    const cx = lx ? cutAt(0, MLEN) : 0;
    const cy = ly ? cutAt(1, MWID) : 0;
    for (const c of cells) {
      if (lx) c[0] = mod(c[0] - cx, MLEN) + cx;
      if (ly) c[1] = mod(c[1] - cy, MWID) + cy;
    }
    const x0 = lx ? cx : Math.min(...cells.map((c) => c[0]));
    const y0 = ly ? cy : Math.min(...cells.map((c) => c[1]));
    const w = lx ? MLEN : Math.max(...cells.map((c) => c[0])) - x0 + 1;
    const h = ly ? MWID : Math.max(...cells.map((c) => c[1])) - y0 + 1;
    const out: Unrolled = { box: [x0, y0, w, h], loops: [lx, ly] };
    if (w > MLEN || h > MWID) {
      const rows: number[][] = Array.from({ length: h }, () => []);
      for (const [x, y] of cells) rows[y - y0].push(x - x0);
      out.runs = rows.map((r) => {
        const runs: [number, number][] = [];
        for (const x of r.sort((a, b) => a - b)) {
          const last = runs[runs.length - 1];
          if (last && last[1] === x) last[1] = x + 1;
          else runs.push([x, x + 1]);
        }
        return runs;
      });
    }
    return out;
  }
}

/** True where block (x, y) of the box is drawn: everywhere, unless the box winds on past a lap (then where it was seen). */
export function unrolledShows(u: Unrolled, x: number, y: number): boolean {
  if (!u.runs) return true;
  const row = u.runs[y - u.box[1]];
  const rx = x - u.box[0];
  return !!row?.some(([a, b]) => rx >= a && rx < b);
}

/**
 * Where a map block (`x`, `y`, 0 to 99) sits in the box: the lap that puts it inside (and drawn),
 * else the one nearest the box's middle.
 */
export function unrolledAt(u: Unrolled, x: number, y: number): { x: number; y: number } {
  const [bx, by, bw, bh] = u.box;
  const laps = (v: number, from: number, size: number, n: number) => {
    const out: number[] = [];
    for (let k = Math.floor((from - v) / n) - 1; k <= Math.ceil((from + size - v) / n) + 1; k++) out.push(v + k * n);
    return out;
  };
  let best: { x: number; y: number } | undefined;
  let score = Infinity;
  for (const ux of laps(x, bx, bw, MLEN))
    for (const uy of laps(y, by, bh, MWID)) {
      const inside = ux >= bx && uy >= by && ux < bx + bw && uy < by + bh;
      const s = (inside ? 0 : 1e6) + (inside && unrolledShows(u, ux, uy) ? 0 : 1e3) + Math.hypot(ux - (bx + bw / 2), uy - (by + bh / 2));
      if (s < score) ((score = s), (best = { x: ux, y: uy }));
    }
  return best!;
}
