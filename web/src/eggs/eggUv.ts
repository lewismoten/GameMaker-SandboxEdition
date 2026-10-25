// What black light brings out on the felt eggs: some of them carry patterns in fluorescent
// ink (dots, stripes, a zigzag, little stars, and on one a tiny smiling face). One choice
// per egg, by its place among the eggs found, so the shelf (desk/props/eggGlow.ts) and the
// close-up viewer (eggViewer.ts) agree: as a front-on SVG for the shelf, and painted round
// the egg's flat covering (eggArt.ts) for the viewer, where it turns with the egg.
import { TEX_H, TEX_W } from './eggTexture';

const INKS = ['#ff2fd6', '#39ff6a', '#ff8a1a', '#3ac8ff'];

/** The pattern and ink of the i-th egg found, or undefined for the eggs left plain. */
export function uvInk(i: number): { pattern: number; ink: string } | undefined {
  if (i % 3 === 2) return undefined; // some, not all
  return { pattern: i === 4 ? 4 : i % 4, ink: INKS[i % INKS.length] };
}

/** Each pattern on a 20 x 27 egg seen from the front. */
export const UV_SVG = [
  (c: string) => [4, 9, 14].map((y, i) => [3, 8, 13, 18].map((x) => `<circle cx="${x + (i % 2) * 2.5}" cy="${y + 4}" r="1.2" fill="${c}"/>`).join('')).join(''),
  (c: string) => `<path d="M0 9 H20 M0 14 H20 M0 19 H20" stroke="${c}" stroke-width="1.4"/>`,
  (c: string) => `<path d="M0 13 l3 -3 3 3 3 -3 3 3 3 -3 3 3 3 -3" fill="none" stroke="${c}" stroke-width="1.3"/>`,
  (c: string) =>
    [
      [6, 9],
      [14, 13],
      [7, 19],
    ]
      .map(([x, y]) => `<path d="M${x} ${y - 2.5} l0.8 1.7 1.8 0.2 -1.4 1.2 0.4 1.8 -1.6 -0.9 -1.6 0.9 0.4 -1.8 -1.4 -1.2 1.8 -0.2 z" fill="${c}"/>`)
      .join(''),
  (c: string) =>
    `<circle cx="7.5" cy="12" r="1.1" fill="${c}"/><circle cx="12.5" cy="12" r="1.1" fill="${c}"/><path d="M6.5 16 q3.5 3.5 7 0" fill="none" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`,
];

// one unit of the 20 x 27 front view, on the flat covering (its front is u = 0.25)
const UX = TEX_W / 34;
const UY = TEX_H / 22.4;
const vOf = (y: number) => (y - 3.8) * UY;
// near the middle of the front a unit is narrower round the curve (the egg is 8.6 wide there)
const FX = TEX_W / (2 * Math.PI * 8.6);
const fx = (x: number) => TEX_W * 0.25 + (x - 10) * FX;

const STAR = (g: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  g.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
};

/**
 * The covering as black light shows it: the felt sinks to a dim violet and, on the eggs
 * that have one, the ink pattern glows, all the way round.
 */
export function uvTexture(tex: ImageData, i: number): ImageData {
  const dim = new ImageData(TEX_W, TEX_H);
  const s = tex.data;
  const d = dim.data;
  for (let o = 0; o < s.length; o += 4) {
    // pale thread and felt fluoresce a little blue-white; the rest goes dark
    const lum = (s[o] * 0.3 + s[o + 1] * 0.59 + s[o + 2] * 0.11) / 255;
    const glow = Math.max(0, lum - 0.72) * 2.4;
    d[o] = 26 + s[o] * 0.16 + glow * 120;
    d[o + 1] = 10 + s[o + 1] * 0.1 + glow * 150;
    d[o + 2] = 48 + s[o + 2] * 0.22 + glow * 230;
    d[o + 3] = 255;
  }
  const c = document.createElement('canvas');
  c.width = TEX_W;
  c.height = TEX_H;
  const g = c.getContext('2d')!;
  g.putImageData(dim, 0, 0);
  const ink = uvInk(i);
  if (!ink) return g.getImageData(0, 0, TEX_W, TEX_H);
  g.fillStyle = g.strokeStyle = g.shadowColor = ink.ink;
  g.shadowBlur = 10;
  g.lineCap = 'round';
  const wrap = (draw: (dx: number) => void) => [-TEX_W, 0, TEX_W].forEach(draw);
  switch (ink.pattern) {
    case 0: // dots, in staggered rows all round
      [4, 9, 14].forEach((y, row) => {
        for (let x = 0; x < TEX_W; x += 5 * UX)
          wrap((dx) => {
            g.beginPath();
            g.ellipse(x + dx + (row % 2) * 2.5 * UX, vOf(y + 4), 1.2 * UX, 1.2 * UY, 0, 0, Math.PI * 2);
            g.fill();
          });
      });
      break;
    case 1: // stripes round the egg
      g.lineWidth = 1.4 * UY;
      [9, 14, 19].forEach((y) => {
        g.beginPath();
        g.moveTo(0, vOf(y));
        g.lineTo(TEX_W, vOf(y));
        g.stroke();
      });
      break;
    case 2: {
      // a zigzag; its period fits the circumference so the seam closes
      g.lineWidth = 1.3 * UY;
      const n = Math.round(TEX_W / (6 * UX));
      const step = TEX_W / n / 2;
      g.beginPath();
      for (let k = 0; k <= n * 2; k++) g.lineTo(k * step, vOf(k % 2 ? 10 : 13));
      g.stroke();
      break;
    }
    case 3: // little stars, scattered all round
      for (let k = 0; k < 4; k++)
        [
          [6, 9],
          [14, 13],
          [7, 19],
        ].forEach(([x, y]) => wrap((dx) => STAR(g, fx(x) + k * (TEX_W / 4) + dx, vOf(y), 2.5 * UY)));
      break;
    case 4: // the tiny smiling face, on the front
      for (const x of [7.5, 12.5]) {
        g.beginPath();
        g.ellipse(fx(x), vOf(12), 1.1 * FX, 1.1 * UY, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.lineWidth = 1.2 * UY;
      g.beginPath();
      g.moveTo(fx(6.5), vOf(16));
      g.quadraticCurveTo(fx(10), vOf(19.5), fx(13.5), vOf(16));
      g.stroke();
      break;
  }
  return g.getImageData(0, 0, TEX_W, TEX_H);
}
