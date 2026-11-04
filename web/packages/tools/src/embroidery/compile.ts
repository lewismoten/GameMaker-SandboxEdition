// Turns a vector Design into a Pattern: for each color block, every item gets its underlay and then its top stitching, with
// jumps and trims between separate pieces, lock stitches where the thread is cut, a color stop between blocks, and no
// stitch longer than the cap (long runs are cut into pieces).
import { area, dist, evenly, inset, inside } from './geom';
import { tatami } from './fill';
import { satin, satinUnderlay } from './satin';
import { DEFAULTS, type Design, type FillItem, type Item, type Params, type Pattern, type Pt, type Stitch } from './types';

class Needle {
  readonly out: Stitch[] = [];
  private at: Pt | undefined;
  private before: Pt | undefined;
  constructor(private readonly p: Params) {}

  get pos(): Pt | undefined {
    return this.at;
  }

  /** Sews to `to`, in pieces no longer than the stitch cap. */
  stitchTo(to: Pt): void {
    const from = this.at;
    if (!from) throw new Error('stitchTo before moveTo');
    const n = Math.ceil(dist(from, to) / this.p.maxStitch);
    for (let k = 1; k <= n; k++) this.out.push({ x: from[0] + ((to[0] - from[0]) * k) / n, y: from[1] + ((to[1] - from[1]) * k) / n, cmd: 'stitch' });
    this.before = from;
    this.at = to;
  }

  /** Gets to `to`: a plain stitch when it is within `join` mm (and `ok`), else a trim and a jump, with lock stitches around the cut. */
  moveTo(to: Pt, join: number, ok: (a: Pt, b: Pt) => boolean = () => true): boolean {
    const from = this.at;
    if (from && dist(from, to) <= join && ok(from, to)) {
      this.stitchTo(to);
      return false;
    }
    if (from) {
      this.lock();
      this.out.push({ x: from[0], y: from[1], cmd: 'trim' });
    }
    this.out.push({ x: to[0], y: to[1], cmd: 'jump' });
    this.at = to;
    this.before = undefined;
    return true;
  }

  /** Tie-off: two tiny stitches back along the stitching just sewn and out again (not out across the design). */
  private lock(): void {
    if (this.at && this.before) this.tie(this.at, this.before);
  }

  /** Two short out-and-back stitches from `a` toward `b`, which lie along stitching already there or about to be. */
  private tie(a: Pt, b: Pt): void {
    const l = Math.min(0.6, dist(a, b) / 2);
    if (l < 0.1) return;
    const e: Pt = [a[0] + ((b[0] - a[0]) / dist(a, b)) * l, a[1] + ((b[1] - a[1]) / dist(a, b)) * l];
    for (const q of [e, a, e, a]) this.out.push({ x: q[0], y: q[1], cmd: 'stitch' });
  }

  colorChange(): void {
    const a = this.at;
    if (a) {
      this.lock();
      this.out.push({ x: a[0], y: a[1], cmd: 'trim' }, { x: a[0], y: a[1], cmd: 'color' });
    }
    this.at = undefined;
  }

  end(): void {
    const a = this.at;
    if (a) {
      this.lock();
      this.out.push({ x: a[0], y: a[1], cmd: 'trim' }, { x: a[0], y: a[1], cmd: 'end' });
    }
  }

  /** Sews the points in order, starting by getting to the first. */
  sew(pts: Pt[], join: number, ok?: (a: Pt, b: Pt) => boolean): void {
    if (!pts.length) return;
    if (this.moveTo(pts[0], join, ok) && pts.length > 1) this.tie(pts[0], pts[1]);
    for (let i = 1; i < pts.length; i++) this.stitchTo(pts[i]);
  }
}

const JOIN_ITEMS = 3;

function fillItem(n: Needle, it: FillItem, p: Params): void {
  const polys = p.fillGrow ? it.polys.map((q) => inset(q, -p.fillGrow)) : it.polys;
  const big = polys.reduce((s, q) => s + Math.abs(area(q)), 0);
  const within = (a: Pt, b: Pt) => inside(polys, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  // underlay: walk just inside the edge, then (for a shape big enough) loose rows across the top rows
  for (const q of polys) {
    const walk = evenly(inset(q, 0.7), p.underlayRun, true);
    n.sew(walk, JOIN_ITEMS);
  }
  if (big > 60) {
    const under = polys.map((q) => inset(q, 0.9));
    for (const c of tatami(under, it.angle + 90, 2.2, p.fillLength)) n.sew(c, p.maxStitch, within);
  }
  for (const c of tatami(polys, it.angle, p.fillSpacing, p.fillLength)) n.sew(c, p.maxStitch, within);
}

function item(n: Needle, it: Item, p: Params): void {
  if (it.kind === 'fill') return fillItem(n, it, p);
  if (it.kind === 'run') return n.sew(evenly(it.path, p.underlayRun, it.closed), JOIN_ITEMS);
  const width = it.width + p.pullComp;
  for (const u of satinUnderlay(it.path, width, p.underlayRun, !!it.closed)) n.sew(u, JOIN_ITEMS);
  for (const lane of satin(it.path, width, p.satinDensity, !!it.closed, p.maxSatin)) n.sew(lane, JOIN_ITEMS);
}

/** Compiles the design to stitches, ending with an 'end' command; the threads are the blocks' threads in order. */
export function compile(design: Design, params: Partial<Params> = {}): Pattern {
  const p = { ...DEFAULTS, ...params };
  const n = new Needle(p);
  design.blocks.forEach((b, i) => {
    if (i) n.colorChange();
    for (const it of b.items) item(n, it, p);
  });
  n.end();
  return { name: design.name, threads: design.blocks.map((b) => b.thread), stitches: n.out };
}
