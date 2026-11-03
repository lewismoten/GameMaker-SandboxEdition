// Parts and sheets for laser kits (laserSvg.ts): a Part is one flat piece drawn on its own small sheet (so the spacing
// check in laserClearance.ts stays fast), with named elements; packRows lays parts out in rows on a bed-sized sheet.
// Cuts are red outlines kept apart from the engraving; kerf is applied here (parts grow by half a kerf, holes shrink).
import { lineText, type FontName } from './laserPixels';
import { tooClose, type Close, type Element } from './laserClearance';
import { LaserSheet, type Pt } from './laserSvg';
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
}

export interface Placed {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
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
