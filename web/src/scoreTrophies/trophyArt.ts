// The score trophies drawn on a canvas, in the room's painted style (gradients for metal, a
// darker edge, a soft highlight down the left), one look per tier (tiers.ts): a small plastic
// one on a marble-look plastic base, then bronze, silver and gold cups on wooden bases, and at
// the top a tall gaudy tower of gold columns and red velvet with sparkles. The best-scores
// trophy is a cup; the total-score trophy is a star on a column. Its plate says which.
import type { TrophyKind } from './tiers';

interface Metal {
  hi: string;
  mid: string;
  lo: string;
  edge: string;
}

const METALS: Metal[] = [
  { hi: '#fff3a0', mid: '#f0c428', lo: '#a87a0c', edge: '#5e4204' }, // plastic: painted yellow
  { hi: '#f6c193', mid: '#bf7a40', lo: '#74411a', edge: '#3e220c' }, // bronze
  { hi: '#ffffff', mid: '#bcc4cc', lo: '#6c747d', edge: '#383d43' }, // silver
  { hi: '#fff6b8', mid: '#e7b524', lo: '#8f6403', edge: '#4c3500' }, // gold
  { hi: '#fff8c8', mid: '#f2c21e', lo: '#9a6a00', edge: '#4c3500' }, // gaudy gold
];

const across = (g: CanvasRenderingContext2D, x0: number, x1: number, m: Metal) => {
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  gr.addColorStop(0, m.lo);
  gr.addColorStop(0.28, m.hi);
  gr.addColorStop(0.55, m.mid);
  gr.addColorStop(1, m.lo);
  return gr;
};

/** A block of a base: wood, plastic marble or velvet, with a plate on its front. */
function base(g: CanvasRenderingContext2D, cx: number, bottom: number, w: number, h: number, look: 'marble' | 'wood' | 'dark' | 'velvet') {
  const x0 = cx - w / 2;
  const top = bottom - h;
  const fill =
    look === 'marble'
      ? ['#fbfaf6', '#d9d6cc', '#a9a598']
      : look === 'wood'
        ? ['#a4683a', '#7a4522', '#4a2810']
        : look === 'dark'
          ? ['#4b3324', '#2e1e14', '#160d07']
          : ['#d8263a', '#9c1123', '#560612'];
  const gr = g.createLinearGradient(x0, 0, x0 + w, 0);
  gr.addColorStop(0, fill[0]);
  gr.addColorStop(0.5, fill[1]);
  gr.addColorStop(1, fill[2]);
  g.fillStyle = gr;
  g.fillRect(x0, top, w, h);
  // its top face, a lighter strip
  g.fillStyle = 'rgba(255,255,255,0.22)';
  g.fillRect(x0, top, w, Math.max(1, h * 0.14));
  if (look === 'marble') {
    g.strokeStyle = 'rgba(120,115,105,0.45)';
    g.lineWidth = Math.max(0.4, w * 0.012);
    g.beginPath();
    g.moveTo(x0 + w * 0.15, top + h * 0.3);
    g.quadraticCurveTo(x0 + w * 0.4, top + h * 0.8, x0 + w * 0.7, top + h * 0.55);
    g.stroke();
  }
  g.strokeStyle = 'rgba(0,0,0,0.45)';
  g.lineWidth = Math.max(0.5, w * 0.015);
  g.strokeRect(x0, top, w, h);
}

/** The plate on a base's front, its words legible only when drawn large. */
function plate(g: CanvasRenderingContext2D, cx: number, y: number, w: number, h: number, m: Metal, words: string[]) {
  g.fillStyle = across(g, cx - w / 2, cx + w / 2, m);
  g.fillRect(cx - w / 2, y, w, h);
  g.strokeStyle = m.edge;
  g.lineWidth = Math.max(0.4, h * 0.05);
  g.strokeRect(cx - w / 2, y, w, h);
  const size = (h * 0.8) / words.length;
  if (size < 4) {
    // too small to read: two engraved lines
    g.fillStyle = m.edge;
    for (let i = 0; i < 2; i++) g.fillRect(cx - w * 0.32, y + h * (0.32 + i * 0.3), w * 0.64, Math.max(0.4, h * 0.08));
    return;
  }
  g.fillStyle = m.edge;
  g.font = `700 ${size}px Georgia, 'Times New Roman', serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  words.forEach((t, i) => g.fillText(t, cx, y + h * 0.1 + size * (i + 0.5), w * 0.9));
}

/** A cup with two handles, its foot on `bottom`, `h` tall. */
function cup(g: CanvasRenderingContext2D, cx: number, bottom: number, w: number, h: number, m: Metal) {
  const bowlH = h * 0.58;
  const top = bottom - h;
  const r = w / 2;
  // handles behind the bowl
  g.strokeStyle = m.mid;
  g.lineWidth = Math.max(1, w * 0.09);
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + s * r * 0.78, top + bowlH * 0.12);
    g.bezierCurveTo(cx + s * r * 1.45, top + bowlH * 0.05, cx + s * r * 1.4, top + bowlH * 0.75, cx + s * r * 0.45, top + bowlH * 0.85);
    g.stroke();
  }
  // bowl
  g.fillStyle = across(g, cx - r, cx + r, m);
  g.beginPath();
  g.moveTo(cx - r, top);
  g.lineTo(cx + r, top);
  g.bezierCurveTo(cx + r, top + bowlH * 0.7, cx + r * 0.35, top + bowlH, cx, top + bowlH);
  g.bezierCurveTo(cx - r * 0.35, top + bowlH, cx - r, top + bowlH * 0.7, cx - r, top);
  g.fill();
  g.strokeStyle = m.edge;
  g.lineWidth = Math.max(0.5, w * 0.03);
  g.stroke();
  // the rim, an ellipse showing the inside
  g.fillStyle = m.lo;
  g.beginPath();
  g.ellipse(cx, top, r, Math.max(1, r * 0.18), 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  // stem and foot
  const stemW = w * 0.14;
  g.fillStyle = across(g, cx - stemW, cx + stemW, m);
  g.fillRect(cx - stemW / 2, top + bowlH, stemW, h * 0.22);
  const footW = w * 0.62;
  g.beginPath();
  g.moveTo(cx - stemW, top + bowlH + h * 0.22);
  g.lineTo(cx + stemW, top + bowlH + h * 0.22);
  g.lineTo(cx + footW / 2, bottom);
  g.lineTo(cx - footW / 2, bottom);
  g.closePath();
  g.fillStyle = across(g, cx - footW / 2, cx + footW / 2, m);
  g.fill();
  g.stroke();
  // a gleam down the left of the bowl
  g.strokeStyle = 'rgba(255,255,255,0.65)';
  g.lineWidth = Math.max(0.5, w * 0.05);
  g.beginPath();
  g.moveTo(cx - r * 0.6, top + bowlH * 0.18);
  g.quadraticCurveTo(cx - r * 0.62, top + bowlH * 0.6, cx - r * 0.25, top + bowlH * 0.86);
  g.stroke();
}

/** A five-pointed star centered on (cx, cy). */
function star(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, m: Metal) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.closePath();
  g.fillStyle = across(g, cx - r, cx + r, m);
  g.fill();
  g.strokeStyle = m.edge;
  g.lineWidth = Math.max(0.5, r * 0.08);
  g.stroke();
}

/** A star on a column, its foot on `bottom`, `h` tall (the total-score trophy). */
function starColumn(g: CanvasRenderingContext2D, cx: number, bottom: number, w: number, h: number, m: Metal) {
  const r = w * 0.5;
  const colW = w * 0.26;
  const colTop = bottom - h + r * 1.6;
  g.fillStyle = across(g, cx - colW / 2, cx + colW / 2, m);
  g.fillRect(cx - colW / 2, colTop, colW, bottom - colTop);
  g.strokeStyle = m.edge;
  g.lineWidth = Math.max(0.5, w * 0.03);
  g.strokeRect(cx - colW / 2, colTop, colW, bottom - colTop);
  // fluting
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  for (const f of [-0.2, 0.2]) {
    g.beginPath();
    g.moveTo(cx + colW * f, colTop + 1);
    g.lineTo(cx + colW * f, bottom - 1);
    g.stroke();
  }
  star(g, cx, bottom - h + r, r, m);
}

/** A little four-pointed glint. */
function sparkle(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.fillStyle = '#fffbe0';
  g.beginPath();
  g.moveTo(x, y - r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r, y);
  g.quadraticCurveTo(x, y, x, y - r);
  g.fill();
}

/** How tall each tier stands, as a share of the canvas. */
const HEIGHTS = [0.42, 0.56, 0.68, 0.82, 1];

/** The share of the canvas a tier's trophy stands in (with a little room for its sparkles). */
export const standsIn = (tier: number): number => Math.min(1, HEIGHTS[Math.max(1, Math.min(5, tier)) - 1] + 0.04);

/**
 * Draws a trophy of `tier` (1 plastic .. 5 gaudy; 0 draws nothing) standing on the bottom of a
 * `w` x `h` canvas. `large` writes its plate's words (the bubble's closer look).
 */
export function drawScoreTrophy(g: CanvasRenderingContext2D, w: number, h: number, tier: number, kind: TrophyKind, large = false): void {
  if (tier < 1) return;
  const t = Math.min(5, tier);
  const m = METALS[t - 1];
  const cx = w / 2;
  const tall = h * HEIGHTS[t - 1];
  const words = kind === 'best' ? ['BEST', 'SCORES'] : ['TOTAL', 'SCORE'];
  const topper = (bottom: number, tw: number, th: number) => (kind === 'best' ? cup(g, cx, bottom, tw, th, m) : starColumn(g, cx, bottom, tw * 0.8, th, m));
  const pm = METALS[t === 1 ? 3 : t === 3 ? 2 : 3]; // the plate: gold, or silver on silver
  if (t <= 4) {
    // one base (two steps for gold) and the topper on it
    const baseH = tall * (t === 1 ? 0.24 : 0.26);
    const baseW = w * (0.56 + t * 0.06);
    const look = t === 1 ? 'marble' : t === 4 ? 'dark' : 'wood';
    base(g, cx, h, baseW, baseH, look);
    plate(g, cx, h - baseH * 0.72, baseW * 0.66, baseH * 0.5, pm, large ? words : []);
    let foot = h - baseH;
    if (t === 4) {
      const stepH = tall * 0.09;
      base(g, cx, foot, baseW * 0.78, stepH, 'dark');
      foot -= stepH;
    }
    topper(foot, w * (0.4 + t * 0.06), foot - (h - tall));
    if (t >= 3) sparkle(g, cx - w * 0.22, h - tall + tall * 0.12, Math.max(1.2, w * 0.05));
    return;
  }
  // the gaudy tower: velvet and gold bases, a row of columns, a second deck with columns, the topper and sparkles
  const unit = tall / 10;
  base(g, cx, h, w * 0.98, unit * 1.3, 'velvet');
  plate(g, cx, h - unit * 1.05, w * 0.6, unit * 0.8, m, large ? words : []);
  base(g, cx, h - unit * 1.3, w * 0.88, unit * 0.45, 'dark');
  const deck = (bottom: number, span: number, colH: number) => {
    const n = 4;
    for (let i = 0; i < n; i++) {
      const x = cx - span / 2 + (span * i) / (n - 1);
      const cw = w * 0.06;
      g.fillStyle = across(g, x - cw / 2, x + cw / 2, m);
      g.fillRect(x - cw / 2, bottom - colH, cw, colH);
      g.strokeStyle = m.edge;
      g.lineWidth = Math.max(0.4, w * 0.012);
      g.strokeRect(x - cw / 2, bottom - colH, cw, colH);
    }
    // the slab they hold up, gold
    const slabH = unit * 0.35;
    g.fillStyle = across(g, cx - span / 2 - w * 0.06, cx + span / 2 + w * 0.06, m);
    g.fillRect(cx - span / 2 - w * 0.06, bottom - colH - slabH, span + w * 0.12, slabH);
    g.strokeRect(cx - span / 2 - w * 0.06, bottom - colH - slabH, span + w * 0.12, slabH);
    return bottom - colH - slabH;
  };
  let y = deck(h - unit * 1.75, w * 0.7, unit * 1.6);
  base(g, cx, y, w * 0.62, unit * 0.6, 'velvet');
  y -= unit * 0.6;
  y = deck(y, w * 0.44, unit * 1.2);
  // little stars on the corners of the lower deck
  star(g, cx - w * 0.41, h - unit * 3.75, w * 0.07, m);
  star(g, cx + w * 0.41, h - unit * 3.75, w * 0.07, m);
  topper(y, w * 0.56, y - (h - tall));
  for (const [fx, fy, fr] of [
    [-0.36, 0.1, 0.07],
    [0.34, 0.22, 0.05],
    [0.4, 0.55, 0.06],
    [-0.42, 0.48, 0.045],
  ])
    sparkle(g, cx + w * fx, h - tall + tall * fy, Math.max(1.2, w * fr));
}
