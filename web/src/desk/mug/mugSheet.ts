// One sublimation page drawn as an SVG in real inches (mugLayout.ts places everything): each
// mug's pictures, mirrored when asked, with light marks kept off the pressed piece: the cut
// lines, a tick at the middle of the front and the back, the arc that reads straight on,
// where the wrap's ends and the handle are, the label and a one inch ruler to check the scale.
import { h } from '../../editor/core/ui';
import { MUG_DESIGNS, designCanvas, type MugDesignId } from './mugArt';
import { LABEL_BAND, pagePixels, pageX, pageY, svgSize, type PageLayout, type PlacedStrip, type Side } from './mugLayout';
import { pngWithDpi } from '../../manual/printables/stickerArt';

export const PRINT_DPI = 300;

/** What each mug on the page has on its sides. */
export type SideDesigns = Partial<Record<Side, MugDesignId>>;

const NS = 'http://www.w3.org/2000/svg';
const INK = '#7a7a7a';
const FAINT = '#b9b9b9';
const FONT = 0.075; // inches: about 5.5 points

function el(name: string, attrs: Record<string, string | number>, text?: string): SVGElement {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

const r4 = (n: number) => Math.round(n * 10000) / 10000;

/** A design's picture at exactly `w` x `h` inches at `ppi`, its pixels kept square-edged. */
function pictureUrl(id: MugDesignId, w: number, hh: number, ppi: number, cache: Map<string, string>): string {
  const key = `${id}/${Math.round(w * ppi)}x${Math.round(hh * ppi)}`;
  let url = cache.get(key);
  if (!url) {
    const art = designCanvas(id);
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * ppi));
    c.height = Math.max(1, Math.round(hh * ppi));
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    g.drawImage(art, 0, 0, c.width, c.height);
    cache.set(key, (url = c.toDataURL('image/png')));
  }
  return url;
}

const nameOf = (id: MugDesignId | undefined) => (id ? (MUG_DESIGNS.find((d) => d.id === id)?.name ?? id) : 'blank');
const inches = (n: number) => `${(Math.round(n * 100) / 100).toFixed(2)} in`;

function line(x1: number, y1: number, x2: number, y2: number, stroke = INK, width = 0.007, dash?: string): SVGElement {
  const a: Record<string, string | number> = { x1: r4(x1), y1: r4(y1), x2: r4(x2), y2: r4(y2), stroke, 'stroke-width': width };
  if (dash) a['stroke-dasharray'] = dash;
  return el('line', a);
}

function text(x: number, y: number, s: string, anchor: 'start' | 'middle' | 'end' = 'start', size = FONT, fill = INK): SVGElement {
  return el('text', { x: r4(x), y: r4(y), 'font-size': size, 'font-family': 'Arial, Helvetica, sans-serif', fill, 'text-anchor': anchor }, s);
}

/** One mug's strip and its marks. */
function drawStrip(page: PageLayout, p: PlacedStrip, designs: SideDesigns, ppi: number, cache: Map<string, string>, leftHanded: boolean): SVGElement {
  const g = el('g', { class: 'subl-strip', 'data-index': p.index });
  const { strip, block, cropTop } = p;
  const { size } = strip;
  const cropBottom = cropTop + strip.crop.h;
  const { room } = page;
  const X = (x: number) => pageX(page, strip, x);
  // the pictures
  for (const side of ['front', 'back'] as const) {
    const r = strip.art[side];
    const id = designs[side];
    if (!r || !id) continue;
    const left = Math.min(X(r.x), X(r.x + r.w));
    const img = el('image', {
      href: pictureUrl(id, r.w, r.h, ppi, cache),
      x: r4(left),
      y: r4(pageY(p, r.y)),
      width: r4(r.w),
      height: r4(r.h),
      preserveAspectRatio: 'none',
      style: 'image-rendering:pixelated',
    });
    if (page.mirrored) img.setAttribute('transform', `matrix(-1 0 0 1 ${r4(2 * left + r.w)} 0)`);
    g.append(img);
  }
  // cut lines across the page, just above and below the pictures' bleed
  for (const y of [cropTop, cropBottom]) {
    g.append(line(room.x + 0.16, y, room.x + room.w, y, FAINT, 0.006, '0.06 0.04'));
    g.append(text(room.x, y + 0.028, '✂', 'start', 0.09, FAINT));
  }
  // the arc that reads straight on (a third of the round), and a tick at each side's middle
  const arcY = block.y + 0.05;
  for (const side of ['front', 'back'] as const) {
    const cx = X(strip.centers[side]);
    const a = Math.max(room.x, cx - strip.round / 6);
    const b = Math.min(room.x + room.w, cx + strip.round / 6);
    g.append(line(a, arcY, b, arcY, FAINT, 0.006));
    g.append(line(a, arcY - 0.03, a, arcY + 0.03, FAINT, 0.006));
    g.append(line(b, arcY - 0.03, b, arcY + 0.03, FAINT, 0.006));
    g.append(line(cx, arcY - 0.03, cx, cropTop, INK, 0.008));
    g.append(line(cx, cropBottom, cx, cropBottom + 0.09, INK, 0.008));
    g.append(text(cx + 0.03, cropTop - 0.035, side === 'front' ? 'FRONT middle' : 'BACK middle', 'start', 0.06));
  }
  // the wrap's ends and the handle: marked where they fall on the paper, otherwise said how far off it
  const ends = [X(0), X(size.wrapW)];
  const inside = ends.every((x) => x >= room.x && x <= room.x + room.w);
  if (inside)
    for (const x of ends) {
      g.append(line(x, block.y, x, cropTop, INK, 0.008, '0.03 0.02'));
      g.append(text(x, block.y + 0.15, size.handle ? 'end · handle' : 'seam', x < page.pageW / 2 ? 'start' : 'end', 0.055));
    }
  // the label and the ruler
  const y1 = cropBottom + 0.17;
  const y2 = cropBottom + 0.29;
  const no = `${p.index + 1}. ${size.name}`;
  const sides = `FRONT ${nameOf(designs.front)} · BACK ${nameOf(designs.back)}`;
  g.append(text(room.x + 0.14, y1, `${no} · ${sides} · ${page.mirrored ? 'MIRRORED' : 'not mirrored'}`));
  const off = size.wrapW / 2 - page.pageW / 2;
  const edges = inside ? 'marked' : off < 0.01 ? 'at the paper’s edges' : `${inches(off)} past the paper’s edges`;
  let where = size.handle
    ? `Wrap ${size.wrapW} × ${size.wrapH} in, its ends ${edges}, a ${inches(strip.round - size.wrapW)} gap under the handle. Front faces out held in the ${leftHanded ? 'left' : 'right'} hand.`
    : `Wrap ${size.wrapW} × ${size.wrapH} in, all the way round, the seam ${edges}.`;
  if (!size.handle) {
    const wrapBottom = (size.height - size.wrapH) / 2;
    const fromBottom = (y: number) => size.wrapH - y + wrapBottom;
    where += ` Middle ${inches(fromBottom(strip.centerY))} up; bottom cut ${inches(fromBottom(strip.crop.y + strip.crop.h))} above the bottom of the cup ▼`;
  }
  g.append(text(room.x + 0.14, y2, where, 'start', 0.065));
  // one inch, to check the printer kept the size
  const rx = room.x + room.w - 0.02;
  const ry = cropBottom + LABEL_BAND - 0.07;
  g.append(
    el('path', {
      class: 'subl-inch',
      d: `M${r4(rx - 1)} ${r4(ry - 0.06)}V${r4(ry)}H${r4(rx)}V${r4(ry - 0.06)}M${r4(rx - 0.5)} ${r4(ry - 0.035)}V${r4(ry)}`,
      fill: 'none',
      stroke: '#555',
      'stroke-width': 0.008,
    }),
  );
  g.append(text(rx - 1.04, ry, '1 inch', 'end', 0.06));
  return g;
}

/** A page as an SVG exactly its paper's size, in inches. */
export function sheetSvg(page: PageLayout, designs: SideDesigns[], ppi: number, leftHanded: boolean, label = 'Sublimation page'): SVGSVGElement {
  const cache = new Map<string, string>();
  const svg = el('svg', { xmlns: NS, ...svgSize(page), role: 'img', 'aria-label': label }) as SVGSVGElement;
  svg.append(el('rect', { x: 0, y: 0, width: page.pageW, height: page.pageH, fill: '#fff' }));
  for (const p of page.strips) svg.append(drawStrip(page, p, designs[p.index] ?? {}, ppi, cache, leftHanded));
  return svg;
}

/** The page as a PNG at `dpi`, its size written in the file so it opens at the real size. */
export async function sheetPng(page: PageLayout, designs: SideDesigns[], leftHanded: boolean, dpi = PRINT_DPI): Promise<Blob> {
  const svg = sheetSvg(page, designs, dpi, leftHanded);
  const px = pagePixels(page, dpi);
  svg.setAttribute('width', String(px.w));
  svg.setAttribute('height', String(px.h));
  const src = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = px.w;
    c.height = px.h;
    c.getContext('2d')!.drawImage(img, 0, 0, px.w, px.h);
    const blob = await new Promise<Blob>((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error('no picture'))), 'image/png'));
    return new Blob([pngWithDpi(new Uint8Array(await blob.arrayBuffer()), dpi) as Uint8Array<ArrayBuffer>], { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(src);
  }
}

/** Puts the page in the document for printing: @page the paper's size, no margins, the SVG at its real inches. Returns the undo. */
export function preparePrint(page: PageLayout, svg: SVGSVGElement): () => void {
  const style = h('style', { id: 'mug-print-style' });
  style.textContent = `@page { size: ${page.pageW}in ${page.pageH}in; margin: 0; }
@media screen { .mug-print-root { display: none; } }
@media print {
  html.mug-printing body > :not(.mug-print-root) { display: none !important; }
  html.mug-printing, html.mug-printing body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  html.mug-printing body > .mug-print-root.mug-print-root { display: block !important; position: static !important; }
  html.mug-printing .mug-print-root svg { display: block; width: ${page.pageW}in; height: ${page.pageH}in; }
}`;
  const root = h('div', { class: 'mug-print-root' }, svg);
  document.head.append(style);
  document.body.append(root);
  document.documentElement.classList.add('mug-printing');
  return () => {
    document.documentElement.classList.remove('mug-printing');
    style.remove();
    root.remove();
  };
}
