// Sandbox Software's mark: the logo sting's sandbox (games/kit/sandlogo.ts) as a flat round
// emblem. A wooden sandbox on the lawn under a blue sky, a sand castle with a yellow pennant,
// the red pail and the blue shovel, and a rainbow behind them in the colors of
// -= S A N D B O X =- (retro/bbs/bbsName.ts). One drawing, as SVG for the page and as paths
// for a canvas, so the paper, the boxes and the stickers all print the same mark.

/** The letters' colors, S A N D B O X: the board's VGA text colors. */
export const SANDBOX_RAINBOW = ['#ff5555', '#ffff55', '#55ff55', '#55ffff', '#5555ff', '#ff55ff', '#aa5500'];

const INK = '#1a0f05';
const SKY = '#4f9cf0';
const LAWN = '#3fae3a';
const SAND = '#f2d48a';
const SAND_DARK = '#d9b366';
const WOOD = '#b8743a';
const WOOD_DARK = '#7a4519';
const CASTLE = '#e3bd78';
const CASTLE_DARK = '#b98d4a';
const PAIL = '#d81e1e';
const PAIL_DARK = '#8f1010';
const SHOVEL = '#2350d8';
const PENNANT = '#ffd400';

/** One shape of the mark: SVG path data in a 100 x 100 box, its fill, and its outline. */
interface Part {
  d: string;
  fill?: string;
  stroke?: string;
  width?: number;
  /** A fill with no outline. */
  bare?: boolean;
}

function battlements(x: number, y: number, w: number, n: number, notch: number): string {
  // a tower's top edge, left to right, with n merlons and the notches between them
  const step = w / (2 * n - 1);
  let d = `M${x} ${y + notch}`;
  for (let i = 0; i < 2 * n - 1; i++) {
    const x0 = x + i * step;
    d += i % 2 ? `H${x0 + step}V${y}` : `V${y}H${x0 + step}V${y + notch}`;
  }
  return d;
}

function tower(x: number, y: number, w: number, bottom: number, n: number): string {
  return `${battlements(x, y, w, n, 4)}V${bottom}H${x}Z`;
}

const rainbowArc = (r: number) => `M${50 - r} 66A${r} ${r} 0 0 1 ${50 + r} 66`;

/** A thick line in a color with an ink edge: two strokes. */
const rod = (d: string, color: string): Part[] => [
  { d, stroke: INK, width: 4.6 },
  { d, stroke: color, width: 2.4 },
];

const PARTS: Part[] = [
  // sky and lawn inside the ring, the rainbow over the horizon
  { d: 'M2 50A48 48 0 0 1 98 50Z', fill: SKY, bare: true },
  { d: 'M2 50A48 48 0 0 0 98 50Z', fill: LAWN, bare: true },
  ...SANDBOX_RAINBOW.map((c, i): Part => ({ d: rainbowArc(41 - i * 3), stroke: c, width: 3.1 })),
  // the ring, which the sandbox's front board breaks out of
  { d: 'M2 50A48 48 0 1 1 98 50A48 48 0 1 1 2 50Z', stroke: INK, width: 3.4 },
  // the sandbox: back board, sand, the front board
  { d: 'M17 61L83 61L85 66L15 66Z', fill: WOOD_DARK },
  { d: 'M15 66L85 66L93 79L7 79Z', fill: SAND },
  { d: 'M22 72Q35 69 44 73T64 72T82 74', stroke: SAND_DARK, width: 1.4 },
  { d: 'M7 79L93 79L93 89L7 89Z', fill: WOOD },
  { d: 'M7 84H93M30 79V89M70 79V89', stroke: WOOD_DARK, width: 1.2 },
  // the castle: two side towers, the keep, a door and a window
  { d: tower(32, 50, 11, 72, 2), fill: CASTLE_DARK },
  { d: tower(57, 50, 11, 72, 2), fill: CASTLE_DARK },
  { d: tower(42, 41, 16, 73, 3), fill: CASTLE },
  { d: 'M46.5 73V65A3.5 3.5 0 0 1 53.5 65V73Z', fill: INK },
  { d: 'M48 50H52V55H48Z', fill: INK },
  // the pennant on its pole
  { d: 'M50 41V30', stroke: INK, width: 1.6 },
  { d: 'M50.5 30L60 33L50.5 36Z', fill: PENNANT },
  // the red pail with its handle, a mound of sand in it and a star on it
  { d: 'M13 58Q20 50 27 58', stroke: INK, width: 1.6 },
  { d: 'M14 61Q20 56 26 61Z', fill: SAND },
  { d: 'M12 60H28L25.5 75H14.5Z', fill: PAIL },
  { d: 'M12 60H28L27.6 62.5H12.4Z', fill: PAIL_DARK, bare: true },
  { d: 'M20 64.5L21.2 67.6L24.4 67.7L21.9 69.7L22.8 72.8L20 71L17.2 72.8L18.1 69.7L15.6 67.7L18.8 67.6Z', fill: PENNANT, bare: true },
  // the blue shovel stuck in the sand: a T grip, the handle, the spade
  ...rod('M70.5 50.5L77.5 47', SHOVEL),
  ...rod('M74 49L80 66', SHOVEL),
  { d: 'M76 64.5L83.5 61.8L86.5 70.5Q83 75.5 79 72Z', fill: SHOVEL },
];

const outlined = (p: Part) => !!p.stroke || (!!p.fill && !p.bare);

/** The mark as SVG markup, `size` pixels (or any CSS length) square. */
export function sandboxMarkSvg(size: number | string = 64, label = 'Sandbox Software'): string {
  const body = PARTS.map(
    (p) =>
      `<path d="${p.d}" fill="${p.fill ?? 'none'}"${outlined(p) ? ` stroke="${p.stroke ?? INK}" stroke-width="${p.width ?? 1.2}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`,
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>`;
}

/** The mark as an element for a printed page. */
export function sandboxMarkEl(cls = ''): HTMLElement {
  const el = document.createElement('span');
  el.className = `sbx-mark ${cls}`.trim();
  el.innerHTML = sandboxMarkSvg('100%');
  return el;
}

/** Draws the mark on a canvas, `size` pixels square, its top-left at (x, y). */
export function drawSandboxMark(g: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  g.save();
  g.translate(x, y);
  g.scale(size / 100, size / 100);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  for (const p of PARTS) {
    const path = new Path2D(p.d);
    if (p.fill) {
      g.fillStyle = p.fill;
      g.fill(path);
    }
    if (outlined(p)) {
      g.strokeStyle = p.stroke ?? INK;
      g.lineWidth = p.width ?? 1.2;
      g.stroke(path);
    }
  }
  g.restore();
}
