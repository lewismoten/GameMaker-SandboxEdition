// The sticker sheet: the game's title, screenshots, its monsters and heroes drawn from its own
// block files, Sandbox Software's own stickers, the Sandbox BBS and Game-Maker: Sandbox
// Edition. Every sticker is drawn on a canvas, so the same art makes the sheet you see and
// print, and the files for a cutting machine (a PNG with bleed and an SVG of cut lines).
import { h } from '../../editor/ui';
import { PRODUCT } from '../../edition';
import { BBS_PHONE, portrait, sheet, spriteArt, splitTitle, type PrintContext, type Sheet } from './kit';
import { BLEED, CUT_H, CUT_W, cutSvg, layoutStickers, pngWithDpi, shapePath, sheetBounds, stickerSize, type Placed, type StickerShape } from './stickerArt';
import type { StickerSpec } from './types';

type Special = 'bbs' | 'gm';

interface Sticker {
  spec: StickerSpec;
  special?: Special;
  shape: StickerShape;
  /** A picture: a map window (fills the sticker) or a sprite (sits on the sticker). */
  img?: HTMLImageElement | HTMLCanvasElement;
  kind: 'text' | 'shot' | 'sprite';
}

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
  const g = c.getContext('2d')!;
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

const RAINBOW = ['#ff5555', '#ffff55', '#55ff55', '#55ffff', '#5555ff', '#ff55ff', '#ffaa00'];
const BLACK_FONT = '"Arial Black", "Arial Bold", Arial, sans-serif';

/** Lines of text at the largest size (px) that fits maxW x maxH, splitting on spaces into up to 3 lines. */
function fit(
  g: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  maxH: number,
  weight: string,
  family: string,
  lh = 1.05,
): { lines: string[]; size: number } {
  const words = text.split(/\s+/).filter(Boolean);
  let best = { lines: [text], size: 1 };
  for (let n = 1; n <= Math.min(3, words.length); n++) {
    // split the words into n lines of balanced length
    const lines: string[] = [];
    const per = Math.ceil(text.length / n);
    let cur = '';
    for (const w of words) {
      if (cur && (cur + ' ' + w).length > per && lines.length < n - 1) {
        lines.push(cur);
        cur = w;
      } else cur = cur ? `${cur} ${w}` : w;
    }
    lines.push(cur);
    g.font = `${weight} 100px ${family}`;
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    const size = Math.min((100 * maxW) / widest, maxH / (lines.length * lh));
    if (size > best.size * 1.08) best = { lines, size };
  }
  return best;
}

function drawLines(
  g: CanvasRenderingContext2D,
  fitted: { lines: string[]; size: number },
  cx: number,
  cy: number,
  weight: string,
  family: string,
  lh = 1.05,
): void {
  g.font = `${weight} ${fitted.size}px ${family}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const total = fitted.lines.length * fitted.size * lh;
  fitted.lines.forEach((l, i) => g.fillText(l, cx, cy - total / 2 + (i + 0.5) * fitted.size * lh));
}

/** One sticker, cut shape at p, painted `bleed` inches past its cut line. */
function drawSticker(g: CanvasRenderingContext2D, p: Placed, st: Sticker, S: number, bleed: number): void {
  const s = st.spec;
  const x = p.x * S;
  const y = p.y * S;
  const w = p.w * S;
  const hh = p.h * S;
  const b = bleed * S;
  const color = s.color ?? '#ffffff';
  const ink = s.ink ?? '#111111';
  g.save();
  g.clip(new Path2D(shapePath(p, bleed, S)));
  g.fillStyle = color;
  g.fillRect(x - b, y - b, w + 2 * b, hh + 2 * b);

  if (st.special === 'bbs') {
    g.fillStyle = '#000';
    g.fillRect(x - b, y - b, w + 2 * b, hh + 2 * b);
    const mono = '"Courier New", Courier, monospace';
    g.font = `700 100px ${mono}`;
    g.font = `700 ${Math.min(w * 0.085, (100 * w * 0.88) / g.measureText('THE -= SANDBOX =- BBS').width)}px ${mono}`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    const parts: [string, string][] = [['THE -= ', '#aaaaaa'], ...[...'SANDBOX'].map((c, i): [string, string] => [c, RAINBOW[i]]), [' =- BBS', '#aaaaaa']];
    const total = parts.reduce((t, [c]) => t + g.measureText(c).width, 0);
    let tx = x + (w - total) / 2;
    for (const [c, col] of parts) {
      g.fillStyle = col;
      g.fillText(c, tx, y + hh * 0.24);
      tx += g.measureText(c).width;
    }
    g.fillStyle = '#ffff55';
    drawLines(g, fit(g, BBS_PHONE, w * 0.86, hh * 0.26, '700', mono), x + w / 2, y + hh * 0.52, '700', mono);
    g.fillStyle = '#55ffff';
    drawLines(g, fit(g, '14,400 BAUD · 24 HOURS', w * 0.8, hh * 0.12, '700', mono), x + w / 2, y + hh * 0.78, '700', mono);
  } else if (st.special === 'gm') {
    const grad = g.createLinearGradient(0, y, 0, y + hh);
    grad.addColorStop(0, '#24398f');
    grad.addColorStop(1, '#0b1030');
    g.fillStyle = grad;
    g.fillRect(x - b, y - b, w + 2 * b, hh + 2 * b);
    // a row of little blocks, like the block editor's palette
    const n = 8;
    const bw = (w * 0.7) / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = RAINBOW[i % RAINBOW.length];
      g.fillRect(x + w * 0.15 + i * bw + bw * 0.1, y + hh * 0.13, bw * 0.8, bw * 0.8);
    }
    const head = fit(g, 'GAME-MAKER', w * 0.82, hh * 0.3, '900', BLACK_FONT);
    g.fillStyle = '#d81e1e';
    drawLines(g, head, x + w / 2 + head.size * 0.06, y + hh * 0.46 + head.size * 0.06, '900', BLACK_FONT);
    g.fillStyle = '#f2b632';
    drawLines(g, head, x + w / 2, y + hh * 0.46, '900', BLACK_FONT);
    g.fillStyle = '#fff';
    drawLines(
      g,
      fit(g, PRODUCT.split(': ')[1].toUpperCase(), w * 0.7, hh * 0.13, '700', 'Arial, sans-serif'),
      x + w / 2,
      y + hh * 0.68,
      '700',
      'Arial, sans-serif',
    );
    g.fillStyle = '#55ffff';
    drawLines(g, fit(g, 'MAKE YOUR OWN GAMES', w * 0.6, hh * 0.08, '700', 'Arial, sans-serif'), x + w / 2, y + hh * 0.82, '700', 'Arial, sans-serif');
  } else if (st.kind === 'shot' && st.img) {
    // a screenshot fills the sticker, past the cut line into the bleed
    const k = Math.max((w + 2 * b) / st.img.width, (hh + 2 * b) / st.img.height);
    g.imageSmoothingEnabled = false;
    g.drawImage(st.img, x + w / 2 - (st.img.width * k) / 2, y + hh / 2 - (st.img.height * k) / 2, st.img.width * k, st.img.height * k);
  } else if (st.kind === 'sprite' && st.img) {
    const labelled = !!(s.text || s.sub);
    const round = p.shape === 'circle' || p.shape === 'star';
    const bandTop = y + hh * (p.shape === 'star' ? 0.6 : round ? 0.66 : 0.72);
    const artBottom = labelled ? bandTop : y + hh;
    // sunburst behind the character
    const cx = x + w / 2;
    const cy = (y + artBottom) / 2 + hh * 0.02;
    g.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 18; i++) {
      const a = (Math.PI * 2 * i) / 18;
      const r = Math.max(w, hh);
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      g.lineTo(cx + r * Math.cos(a + Math.PI / 18), cy + r * Math.sin(a + Math.PI / 18));
      g.fill();
    }
    const areaW = w * (round ? 0.56 : 0.74);
    const areaH = (artBottom - y) * 0.8;
    const k = Math.min(areaW / st.img.width, areaH / st.img.height);
    const iw = st.img.width * k;
    const ih = st.img.height * k;
    g.imageSmoothingEnabled = false;
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.45)';
    g.shadowOffsetX = S * 0.03;
    g.shadowOffsetY = S * 0.03;
    g.drawImage(st.img, cx - iw / 2, cy - ih / 2, iw, ih);
    g.restore();
    if (labelled) {
      g.fillStyle = ink;
      g.fillRect(x - b, bandTop, w + 2 * b, y + hh + b - bandTop);
      g.fillStyle = color;
      const bandH = y + hh - bandTop;
      // round stickers narrow toward the bottom, so their words sit higher and narrower
      const inset = p.shape === 'star' ? 0.5 : round ? 0.62 : 0.86;
      const lift = round ? 0.06 : 0;
      if (s.text)
        drawLines(
          g,
          fit(g, s.text, w * inset, bandH * (s.sub ? 0.36 : 0.5), '900', BLACK_FONT),
          cx,
          bandTop + bandH * ((s.sub ? 0.28 : 0.4) - lift),
          '900',
          BLACK_FONT,
        );
      if (s.sub)
        drawLines(
          g,
          fit(g, s.sub, w * inset * (p.shape === 'star' ? 0.6 : round ? 0.7 : 0.9), bandH * (s.text ? 0.17 : 0.4), '700', 'Arial, sans-serif'),
          cx,
          bandTop + bandH * ((s.text ? 0.6 : 0.4) - lift),
          '700',
          'Arial, sans-serif',
        );
    }
  } else {
    // words on color
    const inset = p.shape === 'circle' ? 0.66 : p.shape === 'star' ? 0.6 : 0.8;
    g.fillStyle = ink;
    const main = fit(g, s.text, w * inset, hh * (s.sub ? 0.42 : 0.55), '900', BLACK_FONT);
    drawLines(g, main, x + w / 2, y + hh * (s.sub ? 0.43 : 0.5), '900', BLACK_FONT);
    if (s.sub) drawLines(g, fit(g, s.sub, w * inset * 0.9, hh * 0.12, '700', 'Arial, sans-serif'), x + w / 2, y + hh * 0.7, '700', 'Arial, sans-serif');
  }
  g.restore();
  // the printed keyline just inside the edge
  g.save();
  g.strokeStyle = st.kind === 'shot' ? '#ffffff' : st.special === 'bbs' ? '#555555' : ink;
  g.lineWidth = S * 0.025;
  g.stroke(new Path2D(shapePath(p, -0.07, S)));
  g.restore();
}

/** A sheet of stickers on a canvas. Screen: no bleed, dashed cut lines. Cutting machine: bleed, cropped to the stickers. */
function drawPage(page: Placed[], list: Sticker[], dpi: number, forCutting: boolean): HTMLCanvasElement {
  const bleed = forCutting ? BLEED : 0;
  const [bx, by, bw, bh] = forCutting ? sheetBounds(page, BLEED) : [0, 0, CUT_W, CUT_H];
  const c = document.createElement('canvas');
  c.width = Math.round(bw * dpi);
  c.height = Math.round(bh * dpi);
  const g = c.getContext('2d')!;
  g.translate(-bx * dpi, -by * dpi);
  for (const p of page) drawSticker(g, p, list[p.index], dpi, bleed);
  if (!forCutting) {
    g.strokeStyle = 'rgba(60,60,60,0.75)';
    g.lineWidth = dpi * 0.012;
    g.setLineDash([dpi * 0.05, dpi * 0.04]);
    for (const p of page) g.stroke(new Path2D(shapePath(p, 0.05, dpi)));
  }
  return c;
}

function toBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error('no picture'))), 'image/png'));
}

async function stickerList(ctx: PrintContext): Promise<Sticker[]> {
  const g = ctx.entry;
  const box = g.original?.box;
  const [main, sub] = splitTitle(g.title);
  const specs: (StickerSpec & { special?: Special })[] = [
    { text: main.toUpperCase(), sub, shape: 'badge', color: box?.background, ink: box?.accent },
    ...(ctx.printables.stickers ?? []).filter((s) => s.sprite || s.hero),
    ...(box?.shots ?? [])
      .slice(0, 2)
      .map(([map, x, y], i): StickerSpec => ({ text: '', shape: i ? 'circle' : 'rect', shot: { map, x: x + 4, y: y + 2, w: 8, h: 6 } })),
    ...(ctx.printables.stickers ?? []).filter((s) => !s.sprite && !s.hero),
    { text: 'I ♥ SHAREWARE', shape: 'rect', color: '#d81e1e', ink: '#fff' },
    { text: 'REGISTERED', sub: 'PLAYER', shape: 'star', color: '#1f9a3a', ink: '#fff' },
    { text: '', shape: 'rect', special: 'bbs' },
    { text: 'SANDBOX', sub: 'SOFTWARE', shape: 'circle', color: '#f2b632', ink: '#1a1208' },
    { text: '', shape: 'badge', special: 'gm' },
  ];
  return Promise.all(
    specs.map(async (spec): Promise<Sticker> => {
      const shape = spec.shape ?? 'rect';
      if (spec.hero || spec.sprite) {
        const src = spec.hero ? await portrait(g, spec.hero) : await spriteArt(g, spec.sprite!);
        const img = await loadImage(src);
        return { spec, shape, img: img && trim(img), kind: img ? 'sprite' : 'text' };
      }
      if (spec.shot) {
        const img = await loadImage(await ctx.shot(spec.shot));
        return { spec, shape, img, kind: img ? 'shot' : 'text' };
      }
      return { spec, shape, kind: 'text', special: spec.special };
    }),
  );
}

export async function stickers(ctx: PrintContext): Promise<Sheet[]> {
  const list = await stickerList(ctx);
  const pages = layoutStickers(
    list.map((s) => {
      const [w, h_] = stickerSize(s.shape, s.kind === 'sprite');
      return { w, h: h_, shape: s.shape };
    }),
  );
  const names = list.map((s) =>
    s.special === 'bbs' ? 'Sandbox BBS' : s.special === 'gm' ? PRODUCT : [s.spec.text, s.spec.sub].filter(Boolean).join(' ') || 'Picture',
  );
  const base = ctx.entry.id.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return pages.map((page, i) => {
    const art = drawPage(page, list, DPI_SCREEN, false);
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
      h('img', { class: 'stk-art', src: art.toDataURL(), alt: `Stickers: ${page.map((p) => names[p.index]).join(', ')}` }),
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
          [pngWithDpi(new Uint8Array(await (await toBlob(drawPage(page, list, DPI_PRINT, true))).arrayBuffer()), DPI_PRINT) as Uint8Array<ArrayBuffer>],
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
