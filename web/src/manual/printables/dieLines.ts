// Die lines for the print-shop pieces (disk labels, CD labels, retail boxes): where the blade cuts,
// where the card folds, how far the art runs past the cut (the bleed) and the line important
// things stay inside (the safe zone), all in inches. Drawn on a canvas at any dpi (the die-cut
// image, alone or over the art), or written as an SVG with each kind on its own layer.

/** A point in inches from the sheet's top left. */
export type Pt = [x: number, y: number];

/** An outline: a polygon (corners `r` round), or a circle. */
export type Shape = { kind: 'poly'; pts: Pt[]; closed: boolean; r?: number } | { kind: 'circle'; cx: number; cy: number; r: number };

export interface DieLines {
  /** The sheet, in inches. */
  w: number;
  h: number;
  /** Closed outlines the blade cuts round; their insides are the pieces (the bleed runs outside them). */
  cuts: Shape[];
  /** Cuts that are only a slit (open lines). */
  slits: Pt[][];
  /** Fold lines. */
  folds: Pt[][];
  /** Lines important things stay inside. */
  safe: Shape[];
  /** How far the art runs past the cuts, in inches (0 for none). */
  bleed: number;
}

/** The print-shop's resolution: every downloaded image is this many pixels to the inch. */
export const DPI = 300;
/** The usual printers' bleed and safe margin: 1/8 inch. */
export const BLEED = 0.125;
export const SAFE = 0.125;

/** What a sheet shows: the art, the die cut, or the art with the die lines over it. */
export type SheetView = 'art' | 'die' | 'both';

/** A sheet's size in pixels at `dpi`: the art and its die cut are always this same size. */
export function pixelSize(die: Pick<DieLines, 'w' | 'h'>, dpi = DPI): [number, number] {
  return [Math.round(die.w * dpi), Math.round(die.h * dpi)];
}

export const rect = (x: number, y: number, w: number, h: number, r = 0): Shape => ({
  kind: 'poly',
  pts: [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ],
  closed: true,
  r,
});

/** The colors: cut red, fold green (dashed), safe cyan (dashed), bleed a gray band. */
export const DIE_INK = { cut: '#e4002b', fold: '#00a651', safe: '#1aa3e0', bleed: 'rgba(120, 120, 120, 0.35)' } as const;

function trace(g: CanvasRenderingContext2D | Path2D, s: Shape): void {
  if (s.kind === 'circle') {
    g.moveTo(s.cx + s.r, s.cy);
    g.arc(s.cx, s.cy, s.r, 0, Math.PI * 2);
    return;
  }
  const { pts, r = 0 } = s;
  if (r > 0 && s.closed) {
    const n = pts.length;
    const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const start = mid(pts[n - 1], pts[0]);
    g.moveTo(...start);
    for (let i = 0; i < n; i++) g.arcTo(...pts[i], ...mid(pts[i], pts[(i + 1) % n]), r);
    g.closePath();
    return;
  }
  g.moveTo(...pts[0]);
  for (const p of pts.slice(1)) g.lineTo(...p);
  if (s.closed) g.closePath();
}

function line(g: CanvasRenderingContext2D, pts: Pt[]): void {
  g.beginPath();
  g.moveTo(...pts[0]);
  for (const p of pts.slice(1)) g.lineTo(...p);
  g.stroke();
}

/** The bleed: a band `bleed` wide outside every cut. */
function bleedBand(die: DieLines, dpi: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  [c.width, c.height] = pixelSize(die, dpi);
  const g = c.getContext('2d')!;
  g.scale(dpi, dpi);
  g.lineJoin = 'miter';
  g.strokeStyle = DIE_INK.bleed;
  g.lineWidth = die.bleed * 2;
  for (const s of die.cuts) {
    g.beginPath();
    trace(g, s);
    g.stroke();
  }
  // inside the pieces is not bleed: one even-odd path, so a hole's inside (a CD's) keeps its band
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = '#000';
  g.beginPath();
  for (const s of die.cuts) trace(g, s);
  g.fill('evenodd');
  return c;
}

/**
 * Draws the die lines at `dpi` onto `g` (a canvas the sheet's size in pixels): the bleed band,
 * the safe lines, the folds, then the cuts on top. Lines are about 1 pt wide at any dpi.
 */
export function drawDie(g: CanvasRenderingContext2D, die: DieLines, dpi: number): void {
  if (die.bleed > 0) g.drawImage(bleedBand(die, dpi), 0, 0);
  g.save();
  g.scale(dpi, dpi);
  const pt = 1 / 72;
  g.lineCap = 'butt';
  g.lineWidth = pt;
  g.strokeStyle = DIE_INK.safe;
  g.setLineDash([4 * pt, 4 * pt]);
  for (const s of die.safe) {
    g.beginPath();
    trace(g, s);
    g.stroke();
  }
  g.lineWidth = 1.25 * pt;
  g.strokeStyle = DIE_INK.fold;
  g.setLineDash([8 * pt, 5 * pt]);
  for (const f of die.folds) line(g, f);
  g.setLineDash([]);
  g.strokeStyle = DIE_INK.cut;
  g.lineWidth = 1.25 * pt;
  for (const s of die.cuts) {
    g.beginPath();
    trace(g, s);
    g.stroke();
  }
  for (const s of die.slits) line(g, s);
  g.restore();
}

const num = (n: number) => String(Math.round(n * 10000) / 10000);

function svgPath(s: Shape): string {
  if (s.kind === 'circle')
    return `M ${num(s.cx + s.r)} ${num(s.cy)} A ${num(s.r)} ${num(s.r)} 0 1 0 ${num(s.cx - s.r)} ${num(s.cy)} A ${num(s.r)} ${num(s.r)} 0 1 0 ${num(s.cx + s.r)} ${num(s.cy)} Z`;
  const { pts, r = 0 } = s;
  if (r > 0 && s.closed) {
    // round corners: each corner a quarter-circle-like arc between points r along its two edges
    const n = pts.length;
    const along = (a: Pt, b: Pt, d: number): Pt => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      return [a[0] + ((b[0] - a[0]) * d) / len, a[1] + ((b[1] - a[1]) * d) / len];
    };
    let d = '';
    for (let i = 0; i < n; i++) {
      const [prev, at, next] = [pts[(i + n - 1) % n], pts[i], pts[(i + 1) % n]];
      const a = along(at, prev, r);
      const b = along(at, next, r);
      d += `${i ? 'L' : 'M'} ${num(a[0])} ${num(a[1])} A ${num(r)} ${num(r)} 0 0 1 ${num(b[0])} ${num(b[1])} `;
    }
    return `${d}Z`;
  }
  return `M ${pts.map((p) => `${num(p[0])} ${num(p[1])}`).join(' L ')}${s.closed ? ' Z' : ''}`;
}

const svgLine = (pts: Pt[]) => `M ${pts.map((p) => `${num(p[0])} ${num(p[1])}`).join(' L ')}`;

/**
 * The die lines as an SVG the sheet's size (in inches; the viewBox in inches too), a layer each:
 * cut (red), fold (green, dashed), safe (cyan, dashed) and bleed (a gray band). A cutting program
 * cuts the "cut" layer; hide the others.
 */
export function dieSvg(die: DieLines, title: string): string {
  const pt = 1 / 72;
  const layer = (id: string, body: string) => `  <g id="${id}" inkscape:groupmode="layer" inkscape:label="${id}">\n${body}  </g>\n`;
  const cuts = die.cuts.map((s) => `    <path d="${svgPath(s)}"/>\n`).join('') + die.slits.map((s) => `    <path d="${svgLine(s)}"/>\n`).join('');
  const bleed =
    die.bleed > 0
      ? `    <mask id="outside" maskUnits="userSpaceOnUse" x="0" y="0" width="${num(die.w)}" height="${num(die.h)}"><rect width="${num(die.w)}" height="${num(die.h)}" fill="#fff"/><path d="${die.cuts.map(svgPath).join(' ')}" fill="#000" fill-rule="evenodd"/></mask>\n` +
        `    <g mask="url(#outside)" fill="none" stroke="#787878" stroke-opacity="0.35" stroke-width="${num(die.bleed * 2)}">${die.cuts.map((s) => `<path d="${svgPath(s)}"/>`).join('')}</g>\n`
      : '';
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${num(die.w)}in" height="${num(die.h)}in" viewBox="0 0 ${num(die.w)} ${num(die.h)}">\n` +
    `  <title>${title.replace(/[<&]/g, '')}</title>\n` +
    layer('bleed', bleed) +
    layer(
      'safe',
      `    <g fill="none" stroke="${DIE_INK.safe}" stroke-width="${num(pt)}" stroke-dasharray="${num(4 * pt)} ${num(4 * pt)}">${die.safe.map((s) => `<path d="${svgPath(s)}"/>`).join('')}</g>\n`,
    ) +
    layer(
      'fold',
      `    <g fill="none" stroke="${DIE_INK.fold}" stroke-width="${num(1.25 * pt)}" stroke-dasharray="${num(8 * pt)} ${num(5 * pt)}">${die.folds.map((f) => `<path d="${svgLine(f)}"/>`).join('')}</g>\n`,
    ) +
    layer('cut', `    <g fill="none" stroke="${DIE_INK.cut}" stroke-width="${num(1.25 * pt)}">\n${cuts}    </g>\n`) +
    `</svg>\n`
  );
}

/** Crop marks: short lines out from each piece's corners, starting past the bleed (1/16 in clear of it), 1/8 in long. */
export function cropMarks(die: DieLines): Pt[][] {
  const gap = BLEED + 1 / 16;
  const len = 1 / 8;
  const out: Pt[][] = [];
  for (const s of die.cuts) {
    const xs = s.kind === 'circle' ? [s.cx - s.r, s.cx + s.r] : s.pts.map((p) => p[0]);
    const ys = s.kind === 'circle' ? [s.cy - s.r, s.cy + s.r] : s.pts.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    // a hole inside another piece needs none
    if (die.cuts.some((o) => o !== s && o.kind === 'circle' && s.kind === 'circle' && o.cx === s.cx && o.cy === s.cy && o.r > s.r)) continue;
    for (const [x, sx] of [
      [x0, -1],
      [x1, 1],
    ] as const)
      for (const [y, sy] of [
        [y0, -1],
        [y1, 1],
      ] as const) {
        out.push([
          [x + sx * gap, y],
          [x + sx * (gap + len), y],
        ]);
        out.push([
          [x, y + sy * gap],
          [x, y + sy * (gap + len)],
        ]);
      }
  }
  return out;
}

/** Draws the crop marks (cropMarks) in black hairlines at `dpi`. */
export function drawCropMarks(g: CanvasRenderingContext2D, die: DieLines, dpi: number): void {
  g.save();
  g.scale(dpi, dpi);
  g.strokeStyle = '#000';
  g.lineWidth = 0.5 / 72;
  g.setLineDash([]);
  for (const m of cropMarks(die)) line(g, m);
  g.restore();
}
