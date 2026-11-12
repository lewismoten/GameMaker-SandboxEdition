// A small laser-cutter SVG builder: sizes in real millimeters, and one color per operation, the way the Glowforge app
// groups steps (the person picks Cut, Score or Engrave for each color): cut is red outline strokes, engrave is blue filled
// shapes, and score is magenta thin strokes, kept for paper kits (folds); nothing on wood or acrylic uses it. Everything is
// absolute millimeter coordinates (no transforms, no fonts: text is pixel shapes from laserPixels.ts), so the file opens
// the same everywhere.
export const CUT = '#ff0000';
export const SCORE = '#ff00ff';
export const ENGRAVE = '#0000ff';
export const HAIRLINE = 0.1;
export type Pt = readonly [number, number];
export type Op = 'cut' | 'score' | 'engrave';

export type Item =
  | { op: Op; k: 'circle'; cx: number; cy: number; r: number }
  | { op: Op; k: 'poly'; pts: Pt[] }
  | { op: 'engrave'; k: 'ring'; cx: number; cy: number; r0: number; r1: number };

const n = (v: number) => String(Math.round(v * 1000) / 1000);
const poly = (pts: readonly Pt[]) => `M${pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}Z`;
const circle = (cx: number, cy: number, r: number) => `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0Z`;

export class LaserSheet {
  readonly items: Item[] = [];
  constructor(
    readonly w: number,
    readonly h: number,
  ) {}
  add(item: Item): this {
    this.items.push(item);
    return this;
  }
  /** Copy another sheet's items onto this one, moved by (dx, dy) millimeters. */
  place(other: LaserSheet, dx: number, dy: number, only?: Op[], turn: 0 | 90 = 0): this {
    const point = ([x, y]: Pt): Pt => (turn === 90 ? [dx - y, dy + x] : [dx + x, dy + y]);
    for (const it of other.items) {
      if (only && !only.includes(it.op)) continue;
      if (it.k === 'poly') this.items.push({ ...it, pts: it.pts.map(point) });
      else {
        const [cx, cy] = point([it.cx, it.cy]);
        this.items.push({ ...it, cx, cy });
      }
    }
    return this;
  }
  count(op: Op) {
    return this.items.filter((i) => i.op === op).length;
  }

  svg(title: string): string {
    const by = (op: Op) => this.items.filter((i) => i.op === op);
    const stroke = (op: 'cut' | 'score') =>
      by(op)
        .map((i) => (i.k === 'circle' ? `<circle cx="${n(i.cx)}" cy="${n(i.cy)}" r="${n(i.r)}"/>` : i.k === 'poly' ? `<path d="${poly(i.pts)}"/>` : ''))
        .join('');
    const eng = by('engrave');
    const fillD = eng.map((i) => (i.k === 'poly' ? poly(i.pts) : i.k === 'circle' ? circle(i.cx, i.cy, i.r) : '')).join('');
    const rings = eng.map((i) => (i.k === 'ring' ? `<path fill-rule="evenodd" d="${circle(i.cx, i.cy, i.r1)}${circle(i.cx, i.cy, i.r0)}"/>` : '')).join('');
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${n(this.w)}mm" height="${n(this.h)}mm" viewBox="0 0 ${n(this.w)} ${n(this.h)}">\n` +
      `<title>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>\n` +
      `<g id="cut" fill="none" stroke="${CUT}" stroke-width="${HAIRLINE}">${stroke('cut')}</g>\n` +
      (by('score').length ? `<g id="score" fill="none" stroke="${SCORE}" stroke-width="${HAIRLINE}">${stroke('score')}</g>\n` : '') +
      `<g id="engrave" fill="${ENGRAVE}" stroke="none">${fillD ? `<path d="${fillD}"/>` : ''}${rings}</g>\n</svg>\n`
    );
  }
}
