// Parts and sheets for laser kits (laserSvg.ts): a Part is one flat piece drawn on its own small sheet (so the spacing
// check in laserClearance.ts stays fast), with named elements; packRows lays parts out in rows on a bed-sized sheet.
// Cuts are red outlines kept apart from the engraving; kerf is applied here (parts grow by half a kerf, holes shrink).
import { lineText, type FontName } from './laserPixels';
import { tooClose, type Close, type Element } from './laserClearance';
import { HAIRLINE, LaserSheet, type Pt } from './laserSvg';
import { offsetPoly } from './laserJoints';

/** The Glowforge bed's usable area in mm, and the room left between parts on a sheet. */
export const BED = { w: 495, h: 279 } as const;
export const PART_GAP = 4;
const PAD = 2;

export class Part {
  readonly sheet: LaserSheet;
  readonly elements: Element[] = [];
  readonly texts: { text: string; capMm: number }[] = [];
  constructor(
    readonly name: string,
    readonly w: number,
    readonly h: number,
    readonly kerf: number,
  ) {
    this.sheet = new LaserSheet(w + 2 * PAD, h + 2 * PAD);
  }
  private el(label: string, add: () => void) {
    const from = this.sheet.items.length;
    add();
    this.elements.push({ name: label, from, to: this.sheet.items.length });
  }
  private shift = (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [x + PAD, y + PAD] as Pt);
  /** The part's outline: grown by half a kerf. */
  outline(pts: readonly Pt[]) {
    this.el('outline', () => this.sheet.add({ op: 'cut', k: 'poly', pts: this.shift(offsetPoly(pts, this.kerf / 2)) }));
  }
  /** A hole or slot through the part: shrunk by half a kerf. */
  hole(label: string, pts: readonly Pt[]) {
    this.el(`hole ${label}`, () => this.sheet.add({ op: 'cut', k: 'poly', pts: this.shift(offsetPoly(pts, -this.kerf / 2)) }));
  }
  holeRound(label: string, cx: number, cy: number, r: number) {
    this.el(`hole ${label}`, () => this.sheet.add({ op: 'cut', k: 'circle', cx: cx + PAD, cy: cy + PAD, r: r - this.kerf / 2 }));
  }
  outlineRound(cx: number, cy: number, r: number) {
    this.el('outline', () => this.sheet.add({ op: 'cut', k: 'circle', cx: cx + PAD, cy: cy + PAD, r: r + this.kerf / 2 }));
  }
  /** Engraving: convex polygons only (the preview and spacing check assume it). */
  engrave(label: string, shapes: readonly (readonly Pt[])[]) {
    this.el(label, () => shapes.forEach((pts) => this.sheet.add({ op: 'engrave', k: 'poly', pts: this.shift(pts) })));
  }
  engraveRound(label: string, cx: number, cy: number, r: number) {
    this.el(label, () => this.sheet.add({ op: 'engrave', k: 'circle', cx: cx + PAD, cy: cy + PAD, r }));
  }
  text(s: string, font: FontName, cx: number, cy: number, px: number) {
    this.el(`text ${s}`, () => {
      const r = lineText(this.sheet, s, font, cx + PAD, cy + PAD, px);
      this.texts.push({ text: s, capMm: r.h });
    });
  }
  /** Pairs of elements nearer than `gap` mm (holes: `holeGap`). */
  close(gap = 1, holeGap = 1.5): Close[] {
    return tooClose(this.sheet, this.elements, gap, holeGap);
  }
  get size() {
    return { w: this.w + 2 * PAD, h: this.h + 2 * PAD };
  }
  /** Compensated outline and hairline bounds, relative to the nominal origin; mitered corners exceed half a kerf. */
  get cutBounds() {
    const it = this.sheet.items[this.elements.find((e) => e.name === 'outline')!.from];
    const points =
      it.k === 'poly'
        ? it.pts
        : it.k === 'circle'
          ? [
              [it.cx - it.r, it.cy - it.r],
              [it.cx + it.r, it.cy + it.r],
            ]
          : [];
    const x = Math.min(...points.map(([x]) => x)) - PAD - HAIRLINE / 2;
    const y = Math.min(...points.map(([, y]) => y)) - PAD - HAIRLINE / 2;
    return { x, y, w: Math.max(...points.map(([x]) => x)) - PAD - x + HAIRLINE / 2, h: Math.max(...points.map(([, y]) => y)) - PAD - y + HAIRLINE / 2 };
  }
}

export interface Placed {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  turn?: 0 | 90;
}

/** Library stock, long edge horizontal. Margins also keep the 12 in edge inside the 279 mm engraving height. */
export const STOCK = {
  '6x12': { w: 304.8, h: 152.4 },
  '8x12': { w: 304.8, h: 203.2 },
  '12x12': { w: 304.8, h: 304.8 },
  '12x20': { w: 508, h: 304.8 },
} as const;
export type StockSize = keyof typeof STOCK;
export const STOCK_MARGIN = { x: 6.5, y: 12.9 } as const;

/** Copy a part at its nominal bounding box, including a quarter turn, without SVG transforms. */
export function placePart(sheet: LaserSheet, part: Part, at: Placed) {
  sheet.place(part.sheet, at.x + (at.turn === 90 ? part.h + PAD : -PAD), at.y - PAD, undefined, at.turn);
}

/** Deterministic rectangle nesting with rotation. Try several orders, keep fewest sheets then smallest occupied area.
 * Hole nesting is caller-supplied; these boxes must already include every guest. No claim of globally optimal packing.
 */
export function packStock(parts: readonly Part[], size: StockSize, gap = 2) {
  const stock = STOCK[size];
  const w = stock.w - 2 * STOCK_MARGIN.x;
  const h = stock.h - 2 * STOCK_MARGIN.y;
  type Rect = { x: number; y: number; w: number; h: number };
  type Bin = { free: Rect[]; entries: { part: Part; at: Placed }[] };
  const contains = (a: Rect, b: Rect) => a.x <= b.x && a.y <= b.y && a.x + a.w >= b.x + b.w && a.y + a.h >= b.y + b.h;
  const split = (free: Rect[], cut: Rect) => {
    const next: Rect[] = [];
    for (const r of free) {
      if (cut.x >= r.x + r.w || cut.x + cut.w <= r.x || cut.y >= r.y + r.h || cut.y + cut.h <= r.y) next.push(r);
      else {
        if (cut.x > r.x) next.push({ ...r, w: cut.x - r.x });
        if (cut.x + cut.w < r.x + r.w) next.push({ ...r, x: cut.x + cut.w, w: r.x + r.w - cut.x - cut.w });
        if (cut.y > r.y) next.push({ ...r, h: cut.y - r.y });
        if (cut.y + cut.h < r.y + r.h) next.push({ ...r, y: cut.y + cut.h, h: r.y + r.h - cut.y - cut.h });
      }
    }
    return next.filter((r, i) => !next.some((q, j) => i !== j && contains(q, r) && (!contains(r, q) || j < i)));
  };
  let best: Bin[] | undefined;
  let bestScore = Infinity;
  for (let order = 0; order < 4; order++) {
    for (const mode of [0, 1]) {
      const metric = (p: Part) => [p.w * p.h, Math.max(p.w, p.h), p.w, p.h][order];
      const sorted = [...parts].sort((a, b) => metric(b) - metric(a) || a.name.localeCompare(b.name));
      const bins: Bin[] = [];
      for (const part of sorted) {
        const bounds = part.cutBounds;
        let chosen: { bin: Bin; rect: Rect; turn: 0 | 90; score: number } | undefined;
        for (let bi = 0; bi <= bins.length && !chosen; bi++) {
          if (bi === bins.length) bins.push({ free: [{ x: 0, y: 0, w: w + gap, h: h + gap }], entries: [] });
          const bin = bins[bi];
          for (const r of bin.free) {
            for (const turn of [0, 90] as const) {
              const rw = (turn ? bounds.h : bounds.w) + gap;
              const rh = (turn ? bounds.w : bounds.h) + gap;
              if (rw > r.w + 1e-8 || rh > r.h + 1e-8) continue;
              const score = mode ? r.w * r.h - rw * rh : Math.min(r.w - rw, r.h - rh);
              if (!chosen || score < chosen.score) chosen = { bin, rect: { x: r.x, y: r.y, w: rw, h: rh }, turn, score };
            }
          }
          if (!chosen && !bin.entries.length) throw new Error(`${part.name} does not fit ${size} with the cutter margins`);
        }
        const c = chosen!;
        c.bin.free = split(c.bin.free, c.rect);
        c.bin.entries.push({
          part,
          at: {
            name: part.name,
            x: STOCK_MARGIN.x + c.rect.x - (c.turn ? part.h - bounds.y - bounds.h : bounds.x),
            y: STOCK_MARGIN.y + c.rect.y - (c.turn ? bounds.x : bounds.y),
            w: c.turn ? part.h : part.w,
            h: c.turn ? part.w : part.h,
            turn: c.turn,
          },
        });
      }
      const occupied = bins.reduce((a, b) => a + Math.max(...b.entries.map(({ at }) => at.x + at.w)) * Math.max(...b.entries.map(({ at }) => at.y + at.h)), 0);
      const score = bins.length * stock.w * stock.h * 100 + occupied;
      if (score < bestScore) {
        best = bins;
        bestScore = score;
      }
    }
  }
  return best!.map((bin) => {
    const sheet = new LaserSheet(stock.w, stock.h);
    bin.entries.forEach(({ part, at }) => placePart(sheet, part, at));
    return { sheet, placed: bin.entries.map(({ at }) => at) };
  });
}

/** Rows of parts on one sheet (left to right, each row below the last). Throws if it does not fit the bed. */
export function packRows(title: string, rows: Part[][], w = BED.w, gap = PART_GAP): { sheet: LaserSheet; placed: Placed[]; w: number; h: number } {
  const placed: Placed[] = [];
  let y = gap;
  let maxW = 0;
  const bits: [Part, number, number][] = [];
  for (const row of rows) {
    let x = gap;
    let rh = 0;
    for (const p of row) {
      bits.push([p, x, y]);
      placed.push({ name: p.name, x: x + PAD, y: y + PAD, w: p.w, h: p.h });
      x += p.size.w + gap;
      rh = Math.max(rh, p.size.h);
    }
    maxW = Math.max(maxW, x);
    y += rh + gap;
  }
  if (maxW > w || y > BED.h) throw new Error(`${title}: ${maxW.toFixed(0)} x ${y.toFixed(0)} mm does not fit the ${w} x ${BED.h} mm bed`);
  const sheet = new LaserSheet(Math.ceil(maxW), Math.ceil(y));
  for (const [p, x, yy] of bits) sheet.place(p.sheet, x, yy);
  return { sheet, placed, w: sheet.w, h: sheet.h };
}
