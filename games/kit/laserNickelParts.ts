// The pieces a wooden nickel's face is drawn from (laserNickels.ts, laserNickelDefs.ts): coordinates are millimeters from the
// coin's center (x right, y down), and everything is engraved (blue) except the `hole*` cut-outs (red, through the wood).
import { TRANSPARENT } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { engraveRects, inkBox, lineText, mergeRuns, toneBitmap, type Bitmap, type FontName } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPixels';
import type { Element } from '@lewismoten/gamemaker-sandbox-tools/kit/laserClearance';
import { LaserSheet, type Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import type { Def } from './pixelTrinketDefs';
import { picture } from './pixelPicture';

/** Half the coin: 1.5 inch / 2. */
export const R = 19.05;

export interface Fig {
  bm: Bitmap;
  box: [number, number, number, number];
}
/** A hero's or monster's picture from the built disk, engraved by tone from its own colors (see toneBitmap). */
export function figureOf(game: string, d: Def): Fig {
  const pic = picture(game, d);
  const scale = Math.max(...pic.palette) <= 63 ? 63 : 255;
  const bm = toneBitmap(pic.w, pic.h, (cx, cy) => {
    const c = pic.cells[cy * pic.w + cx];
    return c === TRANSPARENT ? undefined : [pic.palette[c * 3] / scale, pic.palette[c * 3 + 1] / scale, pic.palette[c * 3 + 2] / scale];
  });
  return { bm, box: inkBox(bm) ?? [0, 0, pic.w, pic.h] };
}

export interface Hole {
  x: number;
  y: number;
  /** The distance from (x, y) to the hole's farthest point. */
  r: number;
}

/** Drawing on one face, in millimeters from the center. */
export class Art {
  readonly texts: { text: string; capMm: number }[] = [];
  readonly holes: Hole[] = [];
  /** The separate things on the face, each a run of the sheet's items (checked for clearance by laserClearance.ts). */
  readonly elements: Element[] = [];
  constructor(
    readonly sheet: LaserSheet,
    private figs: Fig[] = [],
  ) {}

  /** Start a new element at the next item added; the one before it ends here. */
  mark(name: string): this {
    const n = this.sheet.items.length;
    const last = this.elements.at(-1);
    if (last) last.to = n;
    this.elements.push({ name, from: n, to: n });
    return this;
  }
  /** End the last element. */
  done(): this {
    const last = this.elements.at(-1);
    if (last) last.to = this.sheet.items.length;
    return this;
  }
  /** A line of text centered on (x, y); `px` mm a pixel (0.36 for 8x8 letters is 2.5 mm tall). */
  text(s: string, x: number, y: number, px = 0.36, font: FontName = 'pc'): this {
    this.mark(`text ${s}`);
    const m = lineText(this.sheet, s, font, R + x, R + y, px);
    this.mark('motif');
    this.texts.push({ text: s, capMm: m.h });
    return this;
  }
  disc(x: number, y: number, r: number): this {
    this.sheet.add({ op: 'engrave', k: 'circle', cx: R + x, cy: R + y, r });
    return this;
  }
  /** A thin engraved ring (not a score line: a score on a coin would read as a cut path). */
  ring(x: number, y: number, r: number): this {
    this.sheet.add({ op: 'engrave', k: 'ring', cx: R + x, cy: R + y, r0: r - 0.2, r1: r + 0.2 });
    return this;
  }
  /** `n` small engraved dots round (x, y) at radius `r`. */
  dots(x: number, y: number, r: number, n: number, dotR = 0.45, from = -90): this {
    for (let i = 0; i < n; i++) {
      const a = ((from + (360 * i) / n) * Math.PI) / 180;
      this.disc(x + r * Math.cos(a), y + r * Math.sin(a), dotR);
    }
    return this;
  }
  /** Engrave a convex polygon. */
  poly(pts: Pt[]): this {
    this.sheet.add({ op: 'engrave', k: 'poly', pts: pts.map(([x, y]) => [R + x, R + y] as Pt) });
    return this;
  }
  /** A straight bar `w` mm wide from (x0, y0) to (x1, y1). */
  bar(x0: number, y0: number, x1: number, y1: number, w: number): this {
    const d = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = (-(y1 - y0) / d) * (w / 2);
    const ny = ((x1 - x0) / d) * (w / 2);
    return this.poly([
      [x0 + nx, y0 + ny],
      [x1 + nx, y1 + ny],
      [x1 - nx, y1 - ny],
      [x0 - nx, y0 - ny],
    ]);
  }
  /** A solid star (engraved as a fan of triangles). */
  star(x: number, y: number, ro: number, ri = ro * 0.42, points = 5): this {
    const p = (i: number): Pt => {
      const r = i % 2 ? ri : ro;
      const a = -Math.PI / 2 + (i * Math.PI) / points;
      return [x + r * Math.cos(a), y + r * Math.sin(a)];
    };
    for (let i = 0; i < points * 2; i++) this.poly([[x, y], p(i), p(i + 1)]);
    return this;
  }
  /** A ring segment (part of an annulus) from angle a0 to a1 (degrees, 90 is straight down), as quads. */
  arcBand(x: number, y: number, r0: number, r1: number, a0: number, a1: number, step = 8): this {
    const pt = (r: number, a: number): Pt => [x + r * Math.cos((a * Math.PI) / 180), y + r * Math.sin((a * Math.PI) / 180)];
    for (let a = a0; a < a1; a += step) {
      const b = Math.min(a1, a + step);
      this.poly([pt(r1, a), pt(r1, b), pt(r0, b), pt(r0, a)]);
    }
    return this;
  }
  /** A row of engraved dashes, like a ticket's perforation. */
  perf(y: number, x0: number, x1: number, pitch = 1.3): this {
    for (let x = x0; x <= x1 + 1e-6; x += pitch) this.bar(x, y, x + 0.8, y, 0.4);
    return this;
  }
  /** A hole cut clean through the coin (red): a circle. */
  holeCircle(x: number, y: number, r: number): this {
    this.mark('hole');
    this.sheet.add({ op: 'cut', k: 'circle', cx: R + x, cy: R + y, r });
    this.holes.push({ x, y, r });
    return this;
  }
  /** A hole cut through the coin: a closed polygon (a star, a square). */
  holePoly(pts: Pt[]): this {
    this.mark('hole');
    this.sheet.add({ op: 'cut', k: 'poly', pts: pts.map(([x, y]) => [R + x, R + y] as Pt) });
    this.holes.push({ x: 0, y: 0, r: Math.max(...pts.map(([x, y]) => Math.hypot(x, y))) });
    return this;
  }
  holeStar(x: number, y: number, ro: number, ri = ro * 0.45, points = 5): this {
    const pts: Pt[] = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 ? ri : ro;
      const a = -Math.PI / 2 + (i * Math.PI) / points;
      pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]);
    }
    return this.holePoly(pts);
  }
  /** The figure `which` (0: the hero, 1: the signature figure), its ink `h` mm tall (never bigger than 0.6 mm a pixel), centered on (x, y). */
  figure(which: number, x: number, y: number, h: number): this {
    const g = this.figs[which];
    if (!g) return this;
    const [x0, y0, x1, y1] = g.box;
    const px = Math.min(0.6, h / (y1 - y0));
    const w = (x1 - x0) * px;
    engraveRects(this.sheet, mergeRuns(g.bm), (cx, cy) => [R + x - w / 2 + (cx - x0) * px, R + y - ((y1 - y0) * px) / 2 + (cy - y0) * px]);
    return this;
  }
}
