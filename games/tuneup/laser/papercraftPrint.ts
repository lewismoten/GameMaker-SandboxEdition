// The home-printer outputs of the paper THE CHEZ: pieces laid out on Letter or A4 pages (landscape), drawn as a list of colored
// shapes, then written three ways with no browser: an SVG per page, a vector PDF, and a PNG (a small scanline rasterizer).
// Cut lines are solid black, folds dashed black, glue tabs light gray, so they show on the red body too.
import { pngFromRgb } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPreview';
import type { Piece, Prim } from './papercraftParts';
import type { Pt } from './papercraftDims';

export const PAPER = { letter: { w: 279.4, h: 215.9 }, a4: { w: 297, h: 210 } } as const;
const MARGIN = 8;
const GAP = 4;

export interface Page {
  w: number;
  h: number;
  prims: Prim[];
  placed: { name: string; x: number; y: number; w: number; h: number }[];
}

/** A piece's picture and lines as shapes, moved to (ox, oy). */
function drawPiece(p: Piece, ox: number, oy: number): Prim[] {
  const m = (a: readonly Pt[]): Pt[] => a.map(([x, y]) => [x + ox, y + oy] as Pt);
  return [
    ...p.art.map((a) => ({ ...a, pts: m(a.pts) })),
    { pts: m(p.outline), stroke: '#000000', w: 0.3 },
    ...p.folds.map(([a, b]) => ({ pts: m([a, b]), stroke: '#000000', w: 0.2, dash: [2.5, 1.5] as [number, number] })),
  ];
}

/** Shelf-packs every piece (times its quantity), tallest first, onto as many pages of this paper as it takes. */
export function layoutPages(pieces: Piece[], paper: { w: number; h: number }): Page[] {
  const items = pieces.flatMap((p) => Array.from({ length: p.qty }, () => p));
  items.sort((a, b) => b.h - a.h);
  const pages: Page[] = [];
  let page: Page | null = null;
  let x = MARGIN;
  let y = MARGIN;
  let rowH = 0;
  const fresh = () => {
    page = { ...paper, prims: [], placed: [] };
    pages.push(page);
    x = MARGIN;
    y = MARGIN;
    rowH = 0;
  };
  for (const p of items) {
    if (p.w > paper.w - 2 * MARGIN || p.h > paper.h - 2 * MARGIN) throw new Error(`${p.name} (${p.w.toFixed(0)} x ${p.h.toFixed(0)} mm) does not fit the page`);
    if (!page) fresh();
    if (x + p.w > paper.w - MARGIN) {
      x = MARGIN;
      y += rowH + GAP;
      rowH = 0;
    }
    if (y + p.h > paper.h - MARGIN) {
      fresh();
    }
    const pg = page as unknown as Page;
    pg.prims.push(...drawPiece(p, x, y));
    pg.placed.push({ name: p.name, x, y, w: p.w, h: p.h });
    x += p.w + GAP;
    rowH = Math.max(rowH, p.h);
  }
  return pages;
}

const hex = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

/** A line as a thin polygon (a quad per segment), dashed when asked. */
function strokePolys(a: readonly Pt[], w: number, dash?: [number, number]): Pt[][] {
  const out: Pt[][] = [];
  const seg = (p: Pt, q: Pt) => {
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy);
    if (!len) return;
    const nx = (-dy / len) * (w / 2);
    const ny = (dx / len) * (w / 2);
    const pieces: [number, number][] = [];
    if (dash) for (let s = 0; s < len; s += dash[0] + dash[1]) pieces.push([s, Math.min(len, s + dash[0])]);
    else pieces.push([0, len]);
    for (const [s0, s1] of pieces) {
      const a0: Pt = [p[0] + (dx * s0) / len, p[1] + (dy * s0) / len];
      const a1: Pt = [p[0] + (dx * s1) / len, p[1] + (dy * s1) / len];
      out.push([
        [a0[0] + nx, a0[1] + ny],
        [a1[0] + nx, a1[1] + ny],
        [a1[0] - nx, a1[1] - ny],
        [a0[0] - nx, a0[1] - ny],
      ]);
    }
  };
  for (let i = 0; i < a.length; i++) {
    if (i < a.length - 1) seg(a[i], a[i + 1]);
    else if (a.length > 2) seg(a[i], a[0]);
  }
  return out;
}

/** The page as RGB at `ppm` pixels to the millimeter, each pixel averaged over 3 sub-rows and exact horizontal coverage. */
export function rasterPage(page: Page, ppm: number): { w: number; h: number; rgb: Uint8Array } {
  const w = Math.ceil(page.w * ppm);
  const h = Math.ceil(page.h * ppm);
  const rgb = new Uint8Array(w * h * 3).fill(255);
  const SS = 3;
  const cov = new Float32Array(w);
  const fillPoly = (poly: readonly Pt[], color: [number, number, number]) => {
    const ys = poly.map((q) => q[1] * ppm);
    const y0 = Math.max(0, Math.floor(Math.min(...ys)));
    const y1 = Math.min(h - 1, Math.ceil(Math.max(...ys)));
    for (let py = y0; py <= y1; py++) {
      cov.fill(0);
      let any = false;
      for (let s = 0; s < SS; s++) {
        const sy = py + (s + 0.5) / SS;
        const xs: number[] = [];
        for (let i = 0; i < poly.length; i++) {
          const [ax, ay] = poly[i];
          const [bx, by] = poly[(i + 1) % poly.length];
          const Ay = ay * ppm;
          const By = by * ppm;
          if (Ay > sy !== By > sy) xs.push((ax + ((sy - Ay) / (By - Ay)) * (bx - ax)) * ppm);
        }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          const a = Math.max(0, xs[k]);
          const b = Math.min(w, xs[k + 1]);
          if (b <= a) continue;
          any = true;
          for (let px = Math.floor(a); px < Math.ceil(b); px++) cov[px] += (Math.min(b, px + 1) - Math.max(a, px)) / SS;
        }
      }
      if (!any) continue;
      for (let px = 0; px < w; px++) {
        const a = cov[px];
        if (!a) continue;
        for (let k = 0; k < 3; k++) rgb[(py * w + px) * 3 + k] = Math.round(rgb[(py * w + px) * 3 + k] * (1 - Math.min(1, a)) + color[k] * Math.min(1, a));
      }
    }
  };
  for (const pr of page.prims) {
    if (pr.fill && pr.pts.length > 2) fillPoly(pr.pts, hex(pr.fill));
    if (pr.stroke) for (const q of strokePolys(pr.pts, pr.w ?? 0.2, pr.dash)) fillPoly(q, hex(pr.stroke));
  }
  return { w, h, rgb };
}

export const pagePng = (page: Page, dpi = 150): Uint8Array => {
  const r = rasterPage(page, dpi / 25.4);
  return pngFromRgb(r.w, r.h, r.rgb);
};

const n = (v: number) => String(Math.round(v * 1000) / 1000);

/** One page as an SVG in real millimeters (no fonts, no transforms). */
export function pageSvg(page: Page, title: string): string {
  const d = (a: readonly Pt[]) => `M${a.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}${a.length > 2 ? 'Z' : ''}`;
  const body = page.prims
    .map((p) => {
      const fill = p.fill ? p.fill : 'none';
      const stroke = p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.w ?? 0.2}"${p.dash ? ` stroke-dasharray="${p.dash.join(' ')}"` : ''}` : '';
      return `<path d="${d(p.pts)}" fill="${fill}"${stroke}/>`;
    })
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(page.w)}mm" height="${n(page.h)}mm" viewBox="0 0 ${n(page.w)} ${n(page.h)}">\n<title>${title}</title>\n<rect width="${n(page.w)}" height="${n(page.h)}" fill="#ffffff"/>\n${body}\n</svg>\n`;
}

/** A vector PDF, one page per Page, in points. */
export function pdf(pages: Page[]): Uint8Array {
  const K = 72 / 25.4;
  const objs: string[] = [];
  const add = (s: string) => objs.push(s) && objs.length;
  const catalog = add('');
  const pagesObj = add('');
  const kids: number[] = [];
  for (const pg of pages) {
    const c = (col: string) =>
      hex(col)
        .map((v) => (v / 255).toFixed(3))
        .join(' ');
    let s = '';
    const path = (a: readonly Pt[], close: boolean) =>
      a.map(([x, y], i) => `${(x * K).toFixed(2)} ${((pg.h - y) * K).toFixed(2)} ${i ? 'l' : 'm'}`).join('\n') + (close ? '\nh' : '');
    for (const p of pg.prims) {
      if (p.fill && p.pts.length > 2) s += `${c(p.fill)} rg\n${path(p.pts, true)}\nf\n`;
      if (p.stroke)
        s += `${c(p.stroke)} RG\n${((p.w ?? 0.2) * K).toFixed(2)} w\n[${p.dash ? p.dash.map((v) => (v * K).toFixed(2)).join(' ') : ''}] 0 d\n${path(p.pts, p.pts.length > 2)}\nS\n`;
    }
    const content = add(`<< /Length ${s.length} >>\nstream\n${s}endstream`);
    kids.push(
      add(
        `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${(pg.w * K).toFixed(2)} ${(pg.h * K).toFixed(2)}] /Contents ${content} 0 R /Resources << >> >>`,
      ),
    );
  }
  objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objs[pagesObj - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  let out = '%PDF-1.4\n';
  const offs: number[] = [];
  objs.forEach((o, i) => {
    offs.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}
