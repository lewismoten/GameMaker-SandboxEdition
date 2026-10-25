// The sticker sheet: the game's title on a floppy, its heroes, monsters, pets and props cut out
// round their own pixel-art outlines (drawn from its block files), its catchphrases in bursts and
// bubbles, a screenshot on a little TV, and Sandbox Software's mark, packed edge to edge with the
// game's characters again in miniature in the gaps. Every sticker is drawn on a canvas, so the
// same art makes the sheet you see and print, and the files for a cutting machine (a PNG with
// bleed and an SVG of cut lines). Each kind is drawn in stickerPaint.ts, laid out in stickerArt.ts.
import './paper.css'; // first: this piece's own styles build on the paper's
import './stickers.css';
import { download, h } from '../../editor/core/ui';
import { createZip } from '../../project/zip';
import { portrait, sheet, spriteArt, splitTitle, type PrintContext, type Sheet } from './kit';
import { BLEED, CUT_H, CUT_W, cutSvg, layoutStickers, pngWithDpi, sheetBounds, type Placed } from './stickerArt';
import { CUT_OFFSET, MIN_SIZE, outline, type Pt } from './stickerGeom';
import { bbsSticker, dieCut, floppy, gmSticker, polyPath, sandboxSticker, shaped, tvShot, type Sticker, type Words } from './stickerPaint';
import type { StickerSpec } from './types';

type Special = 'bbs' | 'gm' | 'sandbox';

/** What a sticker sheet needs to make its cutting-machine files. */
interface CutFiles {
  page: number;
  pages: number;
  /** Size of the picture with bleed, and of the stickers at cut size (the cut lines), in inches. */
  printSize: [number, number];
  cutSize: [number, number];
  /** The sheet at cut size on a transparent ground, for Design Space. */
  sheetPng: () => Promise<Blob>;
  /** Each sticker alone at cut size, zipped, for Design Space. */
  stickersZip: () => Promise<Blob>;
  /** The sheet with bleed, to pair with the SVG. */
  bleedPng: () => Promise<Blob>;
  svg: () => string;
  name: string;
}

const cutFilesOf = new WeakMap<HTMLElement, CutFiles>();

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

/** A die-cut's pixel size: about 1.15" tall (smaller by `shrink` steps, to fit one sheet), never more than 9/150" a pixel. */
const dieCutPx = (img: HTMLCanvasElement, words: boolean, shrink: number) =>
  Math.max(3, Math.min(9, Math.round(((words ? 1.15 : 1.3) * 150) / img.height)) - shrink);

/** A filler's longest side, in inches: a character that would be longer at the least size gets no filler. */
const MINI_LONG = 1.6;

/** The little cut-out of a character that fills a gap: no words, as small as a sticker may be (MIN_SIZE across). */
function mini(name: string, img: HTMLCanvasElement, color: string): Sticker | undefined {
  const px = Math.ceil(((MIN_SIZE - 2 * CUT_OFFSET) * 150) / Math.min(img.width, img.height));
  if ((Math.max(img.width, img.height) * px) / 150 + 2 * CUT_OFFSET > MINI_LONG) return undefined;
  return dieCut(`${name} (small)`, img, px, { text: '', color, ink: color });
}

/** A spec made ready: its picture loaded, its kind and shape chosen. Also its mini, if it has a character. */
async function resolveSticker(spec: MixedSticker, ctx: PrintContext | undefined, shrink = 0): Promise<{ sticker: Sticker; mini?: Sticker }> {
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
      const px = spec.px ? Math.max(3, spec.px - shrink) : dieCutPx(img, !!(spec.text || spec.sub), shrink);
      const sticker = shape === 'cut' ? dieCut(name, img, px, words) : shaped(name, shape, words, img);
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

/** How a sheet is drawn: on paper, with bleed for exact cut lines, or at cut size for Design Space (which adds its own bleed). */
type Mode = 'paper' | 'bleed' | 'cut';

/** The thin keyline printed inside a shaped sticker's edge: 0.1" in, clear of a cut a little off. */
const KEYLINE_IN = 0.1;

/**
 * One sheet's stickers on a canvas. Paper: the whole Print Then Cut area, each sticker's color
 * running the bleed past its cut line and the cut line dashed on it. Bleed: the same without the
 * dashes, cropped to the stickers (it lines up with the SVG of cut lines). Cut: each sticker
 * exactly its cut shape on a transparent ground, cropped to the stickers.
 */
function drawPage(page: Placed[], list: Sticker[], dpi: number, mode: Mode): HTMLCanvasElement {
  const bleed = mode === 'cut' ? 0 : BLEED;
  const [bx, by, bw, bh] = mode === 'paper' ? [0, 0, CUT_W, CUT_H] : sheetBounds(page, bleed);
  const c = document.createElement('canvas');
  c.width = Math.round(bw * dpi);
  c.height = Math.round(bh * dpi);
  const g = c.getContext('2d')!;
  for (const p of page) drawSticker(g, list[p.index], (p.x - bx) * dpi, (p.y - by) * dpi, dpi, bleed, mode === 'paper');
  if (mode === 'cut') hardEdges(c);
  return c;
}

function drawSticker(g: CanvasRenderingContext2D, st: Sticker, x: number, y: number, dpi: number, bleed: number, dashed: boolean): void {
  g.save();
  // whole device pixels, so pixel art lands on the pixel grid
  g.translate(Math.round(x), Math.round(y));
  g.save();
  g.clip(polyPath(outline(st.geom, bleed), dpi));
  st.paint(g, dpi, bleed);
  g.restore();
  if (st.keyline) {
    g.strokeStyle = st.keyline;
    g.lineWidth = dpi * 0.025;
    g.stroke(polyPath(outline(st.geom, -KEYLINE_IN), dpi));
  }
  if (dashed) {
    // the cut line itself, light on any color: white dashes over a dark hairline
    const cut = polyPath(outline(st.geom), dpi);
    g.lineWidth = dpi * 0.014;
    g.strokeStyle = 'rgba(30,30,30,0.85)';
    g.stroke(cut);
    g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.setLineDash([dpi * 0.05, dpi * 0.05]);
    g.stroke(cut);
  }
  g.restore();
}

/** Every pixel fully clear or fully solid, so a cutting program traces one clean outline. */
function hardEdges(c: HTMLCanvasElement): void {
  const g = c.getContext('2d')!;
  const img = g.getImageData(0, 0, c.width, c.height);
  const a = img.data;
  for (let i = 3; i < a.length; i += 4) a[i] = a[i] < 128 ? 0 : 255;
  g.putImageData(img, 0, 0);
}

/** One sticker alone at its cut size on a transparent ground, for Design Space. */
function drawOne(st: Sticker, dpi: number): HTMLCanvasElement {
  const [x0, y0, x1, y1] = extent(outline(st.geom));
  const c = document.createElement('canvas');
  c.width = Math.ceil((x1 - x0) * dpi);
  c.height = Math.ceil((y1 - y0) * dpi);
  drawSticker(c.getContext('2d')!, st, -x0 * dpi, -y0 * dpi, dpi, 0, false);
  hardEdges(c);
  return c;
}

function extent(pts: Pt[]): [number, number, number, number] {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
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
  const title = floppy(
    `${ctx.entry.title} disk`,
    main.toUpperCase(),
    sub,
    box?.background ?? '#1d3f7a',
    box?.accent && box.accent !== box.background ? darkOf(box) : '#111',
  );
  return fitted(
    gameSpecs(ctx).map((spec): MixedSticker => ({ ...spec, from: ctx })),
    ctx.entry.id,
    [title],
  );
}

/**
 * The stickers on as few sheets as they fit: if they spill onto a second sheet, the die-cuts are
 * drawn a step smaller (fewer 1/150" per pixel, so still crisp) and laid out again.
 */
async function fitted(specs: MixedSticker[], id: string, extra: Sticker[] = []): Promise<Sheet[]> {
  for (let shrink = 0; ; shrink++) {
    const made = await Promise.all(specs.map((spec) => resolveSticker(spec, spec.from, shrink)));
    const list = [...extra, ...made.map((m) => m.sticker)];
    const minis = made.flatMap((m) => (m.mini ? [m.mini] : []));
    if (shrink >= 3 || layoutStickers(list.map((s) => s.geom)).length === 1) return stickerSheets(list, minis, id);
  }
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
  return fitted(specs, base);
}

/** A canvas as a PNG that says it prints at `dpi`. */
async function pngAt(c: HTMLCanvasElement, dpi: number): Promise<Blob> {
  const bytes = pngWithDpi(new Uint8Array(await (await toBlob(c)).arrayBuffer()), dpi);
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'image/png' });
}

/** The sheet: letter paper less a printer's quarter-inch margins, so the viewer never scales it to print. */
const SHEET_W = 8;
const SHEET_H = 10.5;

const fileName = (s: string) =>
  s
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

function stickerSheets(list: Sticker[], minis: Sticker[], id: string): Sheet[] {
  const all = [...list, ...minis];
  const pages = layoutStickers(
    list.map((s) => s.geom),
    minis.map((s) => s.geom),
  );
  const names = all.map((s) => s.name);
  const base = fileName(id);
  return pages.map((page, i) => {
    const art = drawPage(page, all, DPI_SCREEN, 'paper');
    // 8 x 10.5 in, inside a printer's margins on letter paper, so it prints at actual size
    const s = sheet(
      SHEET_W,
      SHEET_H,
      'stk',
      h(
        'header',
        { class: 'stk-head' },
        h('b', null, 'STICKERS'),
        h('span', null, 'Cut along the dotted lines. Stick on your disk box, your folder, your little brother.'),
        pages.length > 1 ? h('em', null, `Sheet ${i + 1} of ${pages.length}`) : null,
      ),
      h('img', {
        class: 'stk-art',
        src: art.toDataURL(),
        alt: `Stickers: ${[...new Set(page.map((p) => names[p.index].replace(/ \(small\)$/, '')))].join(', ')}`,
      }),
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
      sheetPng: () => pngAt(drawPage(page, all, DPI_PRINT, 'cut'), DPI_PRINT),
      bleedPng: () => pngAt(drawPage(page, all, DPI_PRINT, 'bleed'), DPI_PRINT),
      stickersZip: async () => {
        const entries = await Promise.all(
          page.map(async (p, k) => ({
            name: `${String(k + 1).padStart(2, '0')}-${fileName(names[p.index])}.png`,
            data: new Uint8Array(await (await pngAt(drawOne(all[p.index], DPI_PRINT), DPI_PRINT)).arrayBuffer()),
          })),
        );
        return new Blob([(await createZip(entries)) as Uint8Array<ArrayBuffer>], { type: 'application/zip' });
      },
    });
    return s;
  });
}

const inches = ([w, hh]: [number, number]) => `${w.toFixed(2)} × ${hh.toFixed(2)} in`;

/** A download button that makes its file when pressed. */
function fileButton(label: string, name: string, make: () => Promise<Blob> | Blob): HTMLButtonElement {
  const b = h('button', { type: 'button' }, label);
  b.addEventListener('click', async () => {
    b.disabled = true;
    try {
      download(name, await make());
    } finally {
      b.disabled = false;
    }
  });
  return b;
}

/** On screen: the sheets, plus a panel with the Print Then Cut files and how to use them. */
export function stickerScreen(sheets: Sheet[]): HTMLElement {
  const files = sheets.map((s) => cutFilesOf.get(s.el)).filter((f): f is CutFiles => !!f);
  const sheetLabel = (f: CutFiles) => (files.length > 1 ? h('b', null, `Sheet ${f.page}`) : null);
  const designSpace = files.map((f) =>
    h(
      'div',
      { class: 'stk-cut-row' },
      sheetLabel(f),
      fileButton('⬇ Sheet (PNG)', `${f.name}.png`, f.sheetPng),
      fileButton('⬇ Each sticker (ZIP of PNGs)', `${f.name}.zip`, f.stickersZip),
      h('small', null, `sheet ${inches(f.cutSize)}`),
    ),
  );
  const exact = files.map((f) =>
    h(
      'div',
      { class: 'stk-cut-row' },
      sheetLabel(f),
      fileButton('⬇ Picture with bleed (PNG)', `${f.name}-print.png`, f.bleedPng),
      fileButton('⬇ Cut lines (SVG)', `${f.name}-cut.svg`, () => new Blob([f.svg()], { type: 'image/svg+xml' })),
      h('small', null, `picture ${inches(f.printSize)} · cut lines ${inches(f.cutSize)}`),
    ),
  );
  const bleed = '1/16"';
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
        `Every sticker is at least 1" across, its colors run ${bleed} past its cut line, and there is ¼" between stickers. The files are 300 dpi and fit Cricut’s Print Then Cut area on letter paper (${CUT_W} × ${CUT_H} in).`,
      ),
      h('h3', null, 'Cricut Design Space'),
      ...designSpace,
      h(
        'ol',
        null,
        h(
          'li',
          null,
          'Upload the sheet (or the stickers you want from the ZIP) and choose ',
          h('i', null, 'Print Then Cut image'),
          '. Design Space cuts round the outside of each sticker.',
        ),
        h('li', null, 'Set the sheet’s size to the size shown above, or each sticker’s to at least 1".'),
        h(
          'li',
          null,
          'Leave ',
          h('i', null, 'Add bleed'),
          ` on: Design Space stretches each sticker’s edge color about ${bleed} past the cut, so a cut a little off never shows white paper.`,
        ),
        h(
          'li',
          null,
          'Turn on ',
          h('i', null, 'Use System Dialog'),
          ', pick best quality and your paper, and print at actual size. Matte sticker paper reads best; on glossy paper, clear matte tape over the black marks helps the sensor.',
        ),
      ),
      h('h3', null, 'To cut on the exact lines'),
      ...exact,
      h(
        'p',
        null,
        '(Silhouette Studio, Brother CanvasWorkspace and others.) Place the picture and the SVG at the sizes shown and center one on the other (Align → Center). Print the picture with registration marks and its bleed off, then cut only the SVG lines. If your program scales a file on import, type the sizes in.',
      ),
      h('h3', null, 'No machine?'),
      h('p', null, 'Print the sheet at actual size and cut on the dashed lines with scissors: the colors run past them, so a wobble stays in the color.'),
    ),
  );
  return h('div', { class: 'gmb-sheets stk-screen' }, panel, ...sheets.map((s) => s.el));
}
