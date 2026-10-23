// The sticker sheet: the game's title on a floppy, its heroes, monsters, pets and props cut out
// round their own pixel-art outlines (drawn from its block files), its catchphrases in bursts and
// bubbles, a screenshot on a little TV, and Sandbox Software's mark, packed edge to edge with the
// game's characters again in miniature in the gaps. Every sticker is drawn on a canvas, so the
// same art makes the sheet you see and print, and the files for a cutting machine (a PNG with
// bleed and an SVG of cut lines). Each kind is drawn in stickerPaint.ts, laid out in stickerArt.ts.
import './stickers.css';
import { h } from '../../editor/core/ui';
import { portrait, sheet, spriteArt, splitTitle, type PrintContext, type Sheet } from './kit';
import { BLEED, CUT_H, CUT_W, cutSvg, layoutStickers, pngWithDpi, sheetBounds, type Placed } from './stickerArt';
import { outline } from './stickerGeom';
import { bbsSticker, dieCut, floppy, gmSticker, polyPath, sandboxSticker, shaped, tvShot, type Sticker, type Words } from './stickerPaint';
import type { StickerSpec } from './types';

type Special = 'bbs' | 'gm' | 'sandbox';

/** What a sticker sheet needs to make its cutting-machine files. */
export interface CutFiles {
  page: number;
  pages: number;
  /** Size of the picture (with bleed) and of the cut lines, in inches. */
  printSize: [number, number];
  cutSize: [number, number];
  png(): Promise<Blob>;
  svg(): string;
  name: string;
}

export const cutFilesOf = new WeakMap<HTMLElement, CutFiles>();

const DPI_PRINT = 300;
const DPI_SCREEN = 150;

async function loadImage(src: string | undefined): Promise<HTMLImageElement | undefined> {
  if (!src) return undefined;
  const img = new Image();
  img.src = src;
  return img.decode().then(
    () => img,
    () => undefined,
  );
}

/** A sprite without its empty margins, so a small creature fills its sticker. */
function trim(img: HTMLImageElement): HTMLCanvasElement {
  const c = h('canvas', { width: img.width, height: img.height });
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  const a = g.getImageData(0, 0, img.width, img.height).data;
  let [x0, y0, x1, y1] = [img.width, img.height, -1, -1];
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++)
      if (a[(y * img.width + x) * 4 + 3]) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  if (x1 < 0) return c;
  const out = h('canvas', { width: x1 - x0 + 1, height: y1 - y0 + 1 });
  out.getContext('2d')!.drawImage(c, -x0, -y0);
  return out;
}

/** A sticker spec, from this game or (on a sheet that mixes games) from another game's files. */
export type MixedSticker = StickerSpec & { special?: Special; from?: PrintContext };

const nameOf = (s: StickerSpec) => [s.text, s.sub].filter(Boolean).join(' ') || 'Picture';
const wordsOf = (s: StickerSpec): Words => ({ text: s.text, sub: s.sub, color: s.color ?? '#ffffff', ink: s.ink ?? '#111111' });

/** A die-cut's pixel size: about 1.3" tall, never more than 9/150" a pixel. */
const dieCutPx = (img: HTMLCanvasElement, words: boolean) => Math.max(3, Math.min(9, Math.round(((words ? 1.15 : 1.3) * 150) / img.height)));

/** The little cut-out of a character that fills a gap: no words, about half an inch. */
function mini(name: string, img: HTMLCanvasElement, color: string): Sticker {
  return dieCut(`${name} (small)`, img, Math.max(2, Math.min(4, Math.round((0.55 * 150) / Math.max(img.height, img.width * 0.8)))), { text: '', color, ink: color });
}

/** A spec made ready: its picture loaded, its kind and shape chosen. Also its mini, if it has a character. */
async function resolveSticker(spec: MixedSticker, ctx: PrintContext | undefined): Promise<{ sticker: Sticker; mini?: Sticker }> {
  if (spec.special === 'bbs') return { sticker: bbsSticker() };
  if (spec.special === 'gm') return { sticker: gmSticker() };
  if (spec.special === 'sandbox') return { sticker: sandboxSticker() };
  const name = nameOf(spec);
  const words = wordsOf(spec);
  const shape = spec.shape ?? 'rect';
  if (ctx && (spec.hero || spec.sprite)) {
    const src = spec.hero ? await portrait(ctx.entry, spec.hero) : await spriteArt(ctx.entry, spec.sprite!);
    const loaded = await loadImage(src);
    const img = loaded && trim(loaded);
    if (img) {
      const sticker = shape === 'cut' ? dieCut(name, img, spec.px ?? dieCutPx(img, !!(spec.text || spec.sub)), words) : shaped(name, shape, words, img);
      return { sticker, mini: spec.noMini ? undefined : mini(name, img, words.color) };
    }
  }
  if (ctx && spec.shot) {
    const img = await loadImage(await ctx.shot(spec.shot));
    if (img) return { sticker: tvShot(name, trimToCanvas(img)) };
  }
  return { sticker: shaped(name, shape === 'cut' ? 'burst' : shape, words) };
}

function trimToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const c = h('canvas', { width: img.width, height: img.height });
  c.getContext('2d')!.drawImage(img, 0, 0);
  return c;
}

/** One sheet's stickers on a canvas. Screen: no bleed, dashed cut lines. Cutting machine: bleed, cropped to the stickers. */
function drawPage(page: Placed[], list: Sticker[], dpi: number, forCutting: boolean): HTMLCanvasElement {
  const bleed = forCutting ? BLEED : 0;
  const [bx, by, bw, bh] = forCutting ? sheetBounds(page, BLEED) : [0, 0, CUT_W, CUT_H];
  const c = document.createElement('canvas');
  c.width = Math.round(bw * dpi);
  c.height = Math.round(bh * dpi);
  const g = c.getContext('2d')!;
  for (const p of page) {
    const st = list[p.index];
    g.save();
    // whole device pixels, so pixel art lands on the pixel grid
    g.translate(Math.round((p.x - bx) * dpi), Math.round((p.y - by) * dpi));
    g.save();
    g.clip(polyPath(outline(st.geom, bleed), dpi));
    st.paint(g, dpi, bleed);
    g.restore();
    if (st.keyline) {
      // the printed keyline just inside the edge
      g.strokeStyle = st.keyline;
      g.lineWidth = dpi * 0.025;
      g.stroke(polyPath(outline(st.geom, -0.07), dpi));
    }
    if (!forCutting) {
      g.strokeStyle = 'rgba(60,60,60,0.75)';
      g.lineWidth = dpi * 0.012;
      g.setLineDash([dpi * 0.05, dpi * 0.04]);
      g.stroke(polyPath(outline(st.geom, 0.03), dpi));
    }
    g.restore();
  }
  return c;
}

function toBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error('no picture'))), 'image/png'));
}

/** A game's own sheet: its title on a floppy, its stickers, a screenshot on a TV, then Sandbox Software's. */
function gameSpecs(ctx: PrintContext): MixedSticker[] {
  const box = ctx.entry.original?.box;
  const shot = box?.shots?.[0];
  return [
    ...(ctx.printables.stickers ?? []),
    ...(shot ? [{ text: 'Screenshot', shot: { map: shot[0], x: shot[1] + 3, y: shot[2] + 2, w: 10, h: 7 } }] : []),
    { text: 'I ♥ SHAREWARE', shape: 'heart', color: '#d81e1e', ink: '#fff' },
    { text: '', special: 'sandbox' },
  ];
}

export async function stickers(ctx: PrintContext): Promise<Sheet[]> {
  const box = ctx.entry.original?.box;
  const [main, sub] = splitTitle(ctx.entry.title);
  const title = floppy(`${ctx.entry.title} disk`, main.toUpperCase(), sub, box?.background ?? '#1d3f7a', box?.accent && box.accent !== box.background ? darkOf(box) : '#111');
  const made = await Promise.all(gameSpecs(ctx).map((spec) => resolveSticker(spec, ctx)));
  return stickerSheets([title, ...made.map((m) => m.sticker)], made.flatMap((m) => (m.mini ? [m.mini] : [])), ctx.entry.id);
}

/** The title's ink on the floppy's cream label: the box's darker color. */
function darkOf(box: { background?: string; accent?: string }): string {
  const lum = (c = '#000') => {
    const n = parseInt(c.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
    return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
  };
  const dark = [box.background, box.accent].filter((c): c is string => !!c).sort((a, b) => lum(a) - lum(b))[0];
  return dark && lum(dark) < 140 ? dark : '#111';
}

/** A sheet of stickers whose pictures come from several games: each spec names the game it is drawn from. */
export async function mixedStickers(specs: MixedSticker[], base: string): Promise<Sheet[]> {
  const made = await Promise.all(specs.map((spec) => resolveSticker(spec, spec.from)));
  return stickerSheets(
    made.map((m) => m.sticker),
    made.flatMap((m) => (m.mini ? [m.mini] : [])),
    base,
  );
}

function stickerSheets(list: Sticker[], minis: Sticker[], id: string): Sheet[] {
  const all = [...list, ...minis];
  const pages = layoutStickers(
    list.map((s) => s.geom),
    minis.map((s) => s.geom),
  );
  const names = all.map((s) => s.name);
  const base = id.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return pages.map((page, i) => {
    const art = drawPage(page, all, DPI_SCREEN, false);
    const s = sheet(
      8.5,
      11,
      'stk',
      h(
        'header',
        { class: 'stk-head' },
        h('b', null, 'STICKERS'),
        h('span', null, 'Cut along the dotted lines. Stick on your disk box, your folder, your little brother.'),
        pages.length > 1 ? h('em', null, `Sheet ${i + 1} of ${pages.length}`) : null,
      ),
      h('img', { class: 'stk-art', src: art.toDataURL(), alt: `Stickers: ${[...new Set(page.map((p) => names[p.index].replace(/ \(small\)$/, '')))].join(', ')}` }),
      h('p', { class: 'stk-foot' }, 'Plain paper and a glue stick work; label paper is better. Have a cutting machine? Use the Print Then Cut files.'),
    );
    const [, , pw, ph] = sheetBounds(page, BLEED);
    const [, , cw, chh] = sheetBounds(page);
    cutFilesOf.set(s.el, {
      page: i + 1,
      pages: pages.length,
      printSize: [pw, ph],
      cutSize: [cw, chh],
      name: `${base}-stickers${pages.length > 1 ? `-${i + 1}` : ''}`,
      svg: () => cutSvg(page, names),
      png: async () =>
        new Blob(
          [pngWithDpi(new Uint8Array(await (await toBlob(drawPage(page, all, DPI_PRINT, true))).arrayBuffer()), DPI_PRINT) as Uint8Array<ArrayBuffer>],
          { type: 'image/png' },
        ),
    });
    return s;
  });
}

function download(blob: Blob, name: string): void {
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

const inches = ([w, hh]: [number, number]) => `${w.toFixed(2)} × ${hh.toFixed(2)} in`;

/** On screen: the sheets, plus a panel with the Print Then Cut files and how to use them. */
export function stickerScreen(sheets: Sheet[]): HTMLElement {
  const files = sheets.map((s) => cutFilesOf.get(s.el)).filter((f): f is CutFiles => !!f);
  const rows = files.map((f) => {
    const pngBtn = h('button', { type: 'button' }, `⬇ Picture (PNG)`);
    pngBtn.addEventListener('click', async () => {
      pngBtn.disabled = true;
      try {
        download(await f.png(), `${f.name}-print.png`);
      } finally {
        pngBtn.disabled = false;
      }
    });
    return h(
      'div',
      { class: 'stk-cut-row' },
      files.length > 1 ? h('b', null, `Sheet ${f.page}`) : null,
      pngBtn,
      h('button', { type: 'button', onclick: () => download(new Blob([f.svg()], { type: 'image/svg+xml' }), `${f.name}-cut.svg`) }, '⬇ Cut lines (SVG)'),
      h('small', null, `picture ${inches(f.printSize)} · cut lines ${inches(f.cutSize)}`),
    );
  });
  const panel = h(
    'details',
    { class: 'stk-cut' },
    h('summary', null, '✂ Print Then Cut files for a Cricut or other cutting machine'),
    h(
      'div',
      { class: 'stk-cut-body' },
      h(
        'p',
        null,
        `Each sheet comes as two files that line up: a 300 dpi picture with ${BLEED.toFixed(4).replace(/0+$/, '')} in (1/16") of bleed around every sticker, and an SVG of the cut lines. Both fit Cricut’s Print Then Cut area (${CUT_W} × ${CUT_H} in).`,
      ),
      ...rows,
      h(
        'ol',
        null,
        h(
          'li',
          null,
          h('b', null, 'Cricut Design Space: '),
          'Upload the picture and choose ',
          h('i', null, 'Print Then Cut image'),
          '. Set its size to the picture size shown above. Design Space cuts around the outside of each sticker’s bleed, so turn ',
          h('i', null, 'Add bleed'),
          ' off when you print. Print on sticker paper, then load the mat and cut.',
        ),
        h(
          'li',
          null,
          h('b', null, 'To cut on the exact lines '),
          '(Silhouette Studio, Brother CanvasWorkspace, or Design Space with a cut layer): place the picture at its size, place the SVG at its size, and center one on the other (Align → Center). Print the picture with registration marks, then cut only the SVG lines.',
        ),
        h('li', null, 'Picture and lines must be the sizes shown. If your program scales a file on import, type the sizes in.'),
      ),
    ),
  );
  return h('div', { class: 'gmb-sheets stk-screen' }, panel, ...sheets.map((s) => s.el));
}
