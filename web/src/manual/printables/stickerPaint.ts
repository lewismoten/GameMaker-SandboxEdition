// How each kind of sticker is drawn on a canvas, in its own coordinates (its cut shape's top-left
// at 0, 0; S pixels to the inch), already clipped to its cut line plus bleed: die-cut pixel-art
// characters with a colored rim, characters and words on shaped stickers, a screenshot on a
// little TV, the game's title on a floppy disk, the Sandbox BBS, Game-Maker and Sandbox Software.
import { PRODUCT } from '../../edition';
import { BBS_PHONE } from './kit';
import { drawSandboxMark, SANDBOX_RAINBOW } from './sandboxMark';
import { CUT_OFFSET, cutGeom, outline, type Pt, type Solid, type StickerGeom, type StickerShape } from './stickerGeom';

/** A sticker ready to lay out and draw. */
export interface Sticker {
  name: string;
  geom: StickerGeom;
  /** Paints the face (the caller has clipped to the cut line grown by `bleed` inches). */
  paint(g: CanvasRenderingContext2D, S: number, bleed: number): void;
  /** Its keyline color, or none for a die-cut (its rim is its edge). */
  keyline?: string;
}

/** Words on a sticker. */
export interface Words {
  text: string;
  sub?: string;
  color: string;
  ink: string;
}

const BLACK_FONT = '"Arial Black", "Arial Bold", Arial, sans-serif';
const SANS = 'Arial, sans-serif';
/** A die-cut's colored rim, inside its cut line; the rest of the border is white. */
const RIM = 0.035;

export function polyPath(pts: Pt[], S: number): Path2D {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x * S, y * S) : p.moveTo(x * S, y * S)));
  p.closePath();
  return p;
}

// ------------------------------------------------------------------ words

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

/** Words in a box, the main line big and the sub line small under it. */
function wordsIn(g: CanvasRenderingContext2D, w: Words, x: number, y: number, bw: number, bh: number, fill: string): void {
  g.fillStyle = fill;
  if (w.text) {
    const main = fit(g, w.text, bw, bh * (w.sub ? 0.62 : 1), '900', BLACK_FONT);
    drawLines(g, main, x + bw / 2, y + bh * (w.sub ? 0.34 : 0.5), '900', BLACK_FONT);
  }
  if (w.sub) drawLines(g, fit(g, w.sub, bw * 0.94, bh * (w.text ? 0.3 : 0.8), '700', SANS), x + bw / 2, y + bh * (w.text ? 0.8 : 0.5), '700', SANS);
}

/** A picture drawn at a whole number of device pixels per art pixel, so pixel art stays crisp. */
function crisp(g: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, cx: number, cy: number, k: number): void {
  const w = img.width * k;
  const h = img.height * k;
  g.imageSmoothingEnabled = false;
  g.drawImage(img, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
}

// ------------------------------------------------------------------ die-cuts

type Art = HTMLCanvasElement;

/** Where a die-cut's parts sit, in inches from its art box's top-left. */
interface CutLayout {
  w: number;
  h: number;
  art: { x: number; y: number; w: number; h: number };
  plate?: { x: number; y: number; w: number; h: number };
}

const measure = document.createElement('canvas').getContext('2d')!;

function cutLayout(img: Art, px: number, words?: Words): CutLayout {
  const aw = (img.width * px) / 150;
  const ah = (img.height * px) / 150;
  if (!words?.text && !words?.sub) return { w: aw, h: ah, art: { x: 0, y: 0, w: aw, h: ah } };
  const ph = words.text && words.sub ? 0.34 : 0.24;
  // the plate is as wide as its words want, at least as wide as the art, at most 1.7"
  const textH = (words.text ? ph * 0.6 : ph * 0.5) * 100;
  measure.font = `900 ${textH}px ${BLACK_FONT}`;
  const want = Math.max(measure.measureText(words.text || '').width, measure.measureText(words.sub || '').width * 0.55) / 100 + 0.16;
  const pw = Math.min(1.7, Math.max(aw * 0.9, want, 0.7));
  const w = Math.max(aw, pw);
  const overlap = Math.min(0.06, ah * 0.1);
  return { w, h: ah + ph - overlap, art: { x: (w - aw) / 2, y: 0, w: aw, h: ah }, plate: { x: (w - pw) / 2, y: ah - overlap, w: pw, h: ph } };
}

function roundRectPath(x: number, y: number, w: number, h: number, r: number): Path2D {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
}

/** The solid parts of a drawing, from its alpha, as 0.01" cells. */
function solidOf(w: number, h: number, draw: (g: CanvasRenderingContext2D, S: number) => void): Solid {
  const S = 100;
  const cols = Math.ceil(w * S);
  const rows = Math.ceil(h * S);
  const c = document.createElement('canvas');
  c.width = cols;
  c.height = rows;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  draw(g, S);
  const a = g.getImageData(0, 0, cols, rows).data;
  const bits = new Uint8Array(cols * rows);
  for (let i = 0; i < bits.length; i++) bits[i] = a[i * 4 + 3] > 96 ? 1 : 0;
  return { cols, rows, cell: 1 / S, bits };
}

/** A die-cut around a drawing `w` x `h` inches: a colored rim at the cut line, white inside, then the drawing. */
function dieCutOf(name: string, w: number, h: number, rim: string, draw: (g: CanvasRenderingContext2D, S: number) => void): Sticker {
  const geom = cutGeom(solidOf(w, h, draw));
  return {
    name,
    geom,
    paint(g, S, bleed) {
      g.fillStyle = rim;
      g.fill(polyPath(outline(geom, bleed), S));
      g.fillStyle = '#ffffff';
      g.fill(polyPath(outline(geom, -RIM), S));
      g.save();
      g.translate(Math.round(CUT_OFFSET * S), Math.round(CUT_OFFSET * S));
      draw(g, S);
      g.restore();
    },
  };
}

/** A pixel-art character cut out round its silhouette, its name on a plate under it. */
export function dieCut(name: string, img: Art, px: number, words: Words | undefined): Sticker {
  const L = cutLayout(img, px, words);
  return dieCutOf(name, L.w, L.h, words?.color ?? '#ffffff', (g, S) => {
    const k = Math.max(1, Math.round((px * S) / 150));
    crisp(g, img, (L.art.x + L.art.w / 2) * S, (L.art.y + L.art.h / 2) * S, k);
    if (L.plate && words) {
      const p = L.plate;
      g.fillStyle = words.ink;
      g.fill(roundRectPath(p.x * S, p.y * S, p.w * S, p.h * S, 0.07 * S));
      wordsIn(g, words, (p.x + 0.07) * S, (p.y + 0.02) * S, (p.w - 0.14) * S, (p.h - 0.04) * S, words.color);
    }
  });
}

// ------------------------------------------------------------------ shaped stickers

/** Size of a shaped sticker: [w, h] in inches. Tall rects hold a character. */
function stickerSize(shape: StickerShape, tall = false): [number, number] {
  switch (shape) {
    case 'circle':
    case 'star':
    case 'burst':
      return [1.6, 1.6];
    case 'heart':
      return [1.55, 1.45];
    case 'bubble':
      return [1.9, 1.3];
    case 'floppy':
      return [1.55, 1.55];
    case 'tv':
      return [1.75, 1.45];
    case 'badge':
      return tall ? [1.35, 1.6] : [1.9, 1.3];
    default:
      return tall ? [1.35, 1.6] : [1.9, 1.4];
  }
}

/** The box inside a shape that words and pictures can use: [x, y, w, h] as fractions of the sticker. */
function innerBox(shape: StickerShape): [number, number, number, number] {
  switch (shape) {
    case 'circle':
      return [0.17, 0.17, 0.66, 0.66];
    case 'star':
      return [0.2, 0.2, 0.6, 0.6];
    case 'burst':
      return [0.22, 0.24, 0.56, 0.52];
    case 'heart':
      return [0.2, 0.14, 0.6, 0.48];
    case 'bubble':
      return [0.08, 0.08, 0.84, 0.64];
    default:
      return [0.08, 0.1, 0.84, 0.8];
  }
}

function sunburst(g: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  g.fillStyle = 'rgba(255,255,255,0.2)';
  for (let i = 0; i < 18; i++) {
    const a = (Math.PI * 2 * i) / 18;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    g.lineTo(cx + r * Math.cos(a + Math.PI / 18), cy + r * Math.sin(a + Math.PI / 18));
    g.fill();
  }
}

/** A shaped sticker: a character over a sunburst with words under it, or words alone. */
export function shaped(name: string, shape: StickerShape, words: Words, img?: Art): Sticker {
  const [w, h] = stickerSize(shape, !!img && (shape === 'rect' || shape === 'badge'));
  const geom: StickerGeom = { w, h, shape };
  return {
    name,
    geom,
    keyline: words.ink,
    paint(g, S, bleed) {
      const W = w * S;
      const H = h * S;
      g.fillStyle = words.color;
      g.fillRect(-bleed * S, -bleed * S, W + 2 * bleed * S, H + 2 * bleed * S);
      const [bx, by, bw, bh] = innerBox(shape);
      if (img) {
        const labelled = !!(words.text || words.sub);
        const round = shape !== 'rect' && shape !== 'badge' && shape !== 'bubble';
        const pointy = shape === 'star' || shape === 'burst';
        const bandTop = labelled ? H * (shape === 'heart' ? 0.5 : pointy ? 0.6 : round ? 0.64 : 0.72) : H;
        const cx = W / 2;
        const cy = (Math.max(by * H, H * 0.06) + bandTop) / 2;
        sunburst(g, cx, cy, Math.max(W, H));
        const areaW = W * (round ? 0.56 : 0.74);
        const areaH = (bandTop - H * 0.06) * 0.84;
        const k = Math.max(1, Math.floor(Math.min(areaW / img.width, areaH / img.height)));
        g.save();
        g.shadowColor = 'rgba(0,0,0,0.45)';
        g.shadowOffsetX = S * 0.03;
        g.shadowOffsetY = S * 0.03;
        crisp(g, img, cx, cy, k);
        g.restore();
        if (labelled) {
          g.fillStyle = words.ink;
          g.fillRect(-bleed * S, bandTop, W + 2 * bleed * S, H + bleed * S - bandTop);
          // round stickers narrow toward the bottom, so their words sit higher and narrower
          const inset = shape === 'heart' ? 0.36 : shape === 'burst' ? 0.4 : shape === 'star' ? 0.46 : round ? 0.6 : 0.84;
          const bandH = (H - bandTop) * (pointy ? 0.62 : round ? 0.72 : 1);
          wordsIn(g, words, (W * (1 - inset)) / 2, bandTop + bandH * 0.08, W * inset, bandH * 0.84, words.color);
        }
      } else wordsIn(g, words, bx * W, by * H, bw * W, bh * H, words.ink);
    },
  };
}

// ------------------------------------------------------------------ TV, floppy

/** A screenshot on a little TV set. */
export function tvShot(name: string, img: Art, body = '#3b3f4a'): Sticker {
  // the screen at one pixel per 1/150 inch, the set round it
  const sw = img.width / 150;
  const sh = img.height / 150;
  const side = 0.42;
  const w = sw + 0.12 + side;
  const h = (sh + 0.24) / 0.9;
  const geom: StickerGeom = { w, h, shape: 'tv' };
  return {
    name,
    geom,
    keyline: '#15171c',
    paint(g, S, bleed) {
      g.fillStyle = body;
      g.fillRect(-bleed * S, -bleed * S, (w + 2 * bleed) * S, (h + 2 * bleed) * S);
      g.fillStyle = '#15171c';
      g.fillRect(w * 0.18 * S, h * 0.9 * S, w * 0.64 * S, (h * 0.1 + bleed) * S);
      // the screen's bezel and glass
      const x = Math.round(0.12 * S);
      const y = Math.round(0.12 * S);
      g.fillStyle = '#0c0d10';
      g.fill(roundRectPath(x - 0.05 * S, y - 0.05 * S, (sw + 0.1) * S, (sh + 0.1) * S, 0.09 * S));
      g.save();
      g.clip(roundRectPath(x, y, sw * S, sh * S, 0.07 * S));
      g.imageSmoothingEnabled = false;
      const k = Math.max(1, Math.round(S / 150));
      g.drawImage(img, x, y, img.width * k, img.height * k);
      // scan lines and a glare
      g.fillStyle = 'rgba(0,0,0,0.12)';
      for (let yy = 0; yy < sh * S; yy += 2 * k) g.fillRect(x, y + yy, sw * S, k);
      const glare = g.createLinearGradient(x, y, x + sw * S * 0.5, y + sh * S * 0.6);
      glare.addColorStop(0, 'rgba(255,255,255,0.28)');
      glare.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = glare;
      g.fillRect(x, y, sw * S, sh * S);
      g.restore();
      // two knobs and a speaker grille on the side panel
      const kx = (w - side / 2 - 0.02) * S;
      for (const [ky, c] of [
        [0.3, '#d8d8d8'],
        [0.62, '#d8d8d8'],
      ] as const) {
        g.fillStyle = '#111';
        g.beginPath();
        g.arc(kx, ky * S, 0.1 * S, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = c;
        g.beginPath();
        g.arc(kx, ky * S, 0.075 * S, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = 'rgba(0,0,0,0.45)';
      for (let i = 0; i < 4; i++) g.fillRect(kx - 0.12 * S, (0.86 + i * 0.07) * S, 0.24 * S, 0.025 * S);
    },
  };
}

/** The game's title on the label of a 3½" floppy disk, the Sandbox mark in the corner. */
export function floppy(name: string, title: string, sub: string | undefined, body: string, ink: string): Sticker {
  const [w, h] = stickerSize('floppy');
  const geom: StickerGeom = { w, h, shape: 'floppy' };
  return {
    name,
    geom,
    keyline: '#111',
    paint(g, S, bleed) {
      const W = w * S;
      const H = h * S;
      g.fillStyle = body;
      g.fillRect(-bleed * S, -bleed * S, W + 2 * bleed * S, H + 2 * bleed * S);
      // the metal shutter and its window
      g.fillStyle = '#b9bdc6';
      g.fillRect(W * 0.28, 0 - bleed * S, W * 0.46, H * 0.3 + bleed * S);
      g.fillStyle = '#7d828c';
      g.fillRect(W * 0.28, H * 0.27, W * 0.46, H * 0.03);
      g.fillStyle = '#2a2d33';
      g.fillRect(W * 0.55, H * 0.05, W * 0.1, H * 0.18);
      // the label
      const lx = W * 0.1;
      const ly = H * 0.37;
      const lw = W * 0.8;
      const lh = H * 0.58;
      g.fillStyle = '#fbf6e6';
      g.fill(roundRectPath(lx, ly, lw, lh, 0.05 * S));
      g.fillStyle = ink;
      g.fillRect(lx, ly, lw, lh * 0.12);
      wordsIn(g, { text: title, sub, color: '#fbf6e6', ink }, lx + lw * 0.06, ly + lh * 0.17, lw * 0.88, lh * 0.56, ink);
      drawSandboxMark(g, lx + lw - lh * 0.27, ly + lh * 0.72, lh * 0.24);
      g.fillStyle = '#333';
      drawLines(g, fit(g, 'SANDBOX SOFTWARE', lw * 0.62, lh * 0.1, '700', SANS), lx + lw * 0.38, ly + lh * 0.84, '700', SANS);
      // the write-protect hole
      g.fillStyle = '#111';
      g.fillRect(W * 0.06, H * 0.88, W * 0.06, H * 0.06);
    },
  };
}

// ------------------------------------------------------------------ Sandbox's own

/** THE -= S A N D B O X =- BBS and its number, on a black terminal screen. */
export function bbsSticker(): Sticker {
  const [w, h] = [1.9, 1.15];
  return {
    name: 'Sandbox BBS',
    geom: { w, h, shape: 'rect' },
    keyline: '#555555',
    paint(g, S, bleed) {
      const W = w * S;
      const H = h * S;
      g.fillStyle = '#000';
      g.fillRect(-bleed * S, -bleed * S, W + 2 * bleed * S, H + 2 * bleed * S);
      const mono = '"Courier New", Courier, monospace';
      g.font = `700 100px ${mono}`;
      g.font = `700 ${Math.min(W * 0.085, (100 * W * 0.88) / g.measureText('THE -= SANDBOX =- BBS').width)}px ${mono}`;
      g.textBaseline = 'middle';
      g.textAlign = 'left';
      const parts: [string, string][] = [
        ['THE -= ', '#aaaaaa'],
        ...[...'SANDBOX'].map((c, i): [string, string] => [c, SANDBOX_RAINBOW[i]]),
        [' =- BBS', '#aaaaaa'],
      ];
      const total = parts.reduce((t, [c]) => t + g.measureText(c).width, 0);
      let tx = (W - total) / 2;
      for (const [c, col] of parts) {
        g.fillStyle = col;
        g.fillText(c, tx, H * 0.24);
        tx += g.measureText(c).width;
      }
      g.fillStyle = '#ffff55';
      drawLines(g, fit(g, BBS_PHONE, W * 0.86, H * 0.26, '700', mono), W / 2, H * 0.52, '700', mono);
      g.fillStyle = '#55ffff';
      drawLines(g, fit(g, '14,400 BAUD · 24 HOURS', W * 0.8, H * 0.12, '700', mono), W / 2, H * 0.78, '700', mono);
    },
  };
}

/** Game-Maker's logo with what it promises: no programming needed. */
export function gmSticker(): Sticker {
  const [w, h] = [2.1, 1.45];
  return {
    name: `${PRODUCT}: no programming needed`,
    geom: { w, h, shape: 'badge' },
    keyline: '#f2b632',
    paint(g, S, bleed) {
      const W = w * S;
      const H = h * S;
      const grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#24398f');
      grad.addColorStop(1, '#0b1030');
      g.fillStyle = grad;
      g.fillRect(-bleed * S, -bleed * S, W + 2 * bleed * S, H + 2 * bleed * S);
      // a row of little blocks, like the block editor's palette
      const n = 8;
      const bw = (W * 0.7) / n;
      for (let i = 0; i < n; i++) {
        g.fillStyle = SANDBOX_RAINBOW[i % SANDBOX_RAINBOW.length];
        g.fillRect(W * 0.15 + i * bw + bw * 0.1, H * 0.1, bw * 0.8, bw * 0.8);
      }
      const head = fit(g, 'GAME-MAKER', W * 0.84, H * 0.26, '900', BLACK_FONT);
      g.fillStyle = '#d81e1e';
      drawLines(g, head, W / 2 + head.size * 0.06, H * 0.38 + head.size * 0.06, '900', BLACK_FONT);
      g.fillStyle = '#f2b632';
      drawLines(g, head, W / 2, H * 0.38, '900', BLACK_FONT);
      g.fillStyle = '#fff';
      drawLines(g, fit(g, PRODUCT.split(': ')[1].toUpperCase(), W * 0.6, H * 0.09, '700', SANS), W / 2, H * 0.55, '700', SANS);
      // the promise, on a yellow ribbon
      g.fillStyle = '#f5d000';
      g.fillRect(W * 0.08, H * 0.64, W * 0.84, H * 0.22);
      g.fillStyle = '#0b1030';
      drawLines(g, fit(g, 'NO PROGRAMMING NEEDED!', W * 0.78, H * 0.15, '900', BLACK_FONT), W / 2, H * 0.755, '900', BLACK_FONT);
    },
  };
}

/** The Sandbox Software mark, cut out round its ring with SANDBOX in the BBS's colors and SOFTWARE under it. */
export function sandboxSticker(size = 1.45): Sticker {
  const w = size;
  const ribbonH = size * 0.3;
  const h = size * 0.9 + ribbonH;
  return dieCutOf('Sandbox Software', w, h, '#1a0f05', (g, S) => {
    const m = w * S;
    drawSandboxMark(g, 0, 0, m);
    // SANDBOX in its letters' colors on a dark ribbon across the bottom, SOFTWARE in yellow under it
    const y = h * S - ribbonH * S;
    g.fillStyle = '#1a0f05';
    g.fill(roundRectPath(m * 0.02, y, m * 0.96, ribbonH * S, ribbonH * S * 0.3));
    const letters = [...'SANDBOX'];
    g.font = `900 100px ${BLACK_FONT}`;
    const fs = Math.min((100 * m * 0.84) / g.measureText('S A N D B O X').width, ribbonH * S * 0.5);
    g.font = `900 ${fs}px ${BLACK_FONT}`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    const gapW = g.measureText(' ').width;
    const total = letters.reduce((t, c) => t + g.measureText(c).width, 0) + gapW * 6;
    let tx = (m - total) / 2;
    letters.forEach((c, i) => {
      g.fillStyle = SANDBOX_RAINBOW[i];
      g.fillText(c, tx, y + ribbonH * S * 0.34);
      tx += g.measureText(c).width + gapW;
    });
    const soft = fit(g, 'SOFTWARE', m * 0.5, ribbonH * S * 0.3, '900', BLACK_FONT);
    g.fillStyle = '#ffd400';
    drawLines(g, soft, m / 2, y + ribbonH * S * 0.76, '900', BLACK_FONT);
  });
}
