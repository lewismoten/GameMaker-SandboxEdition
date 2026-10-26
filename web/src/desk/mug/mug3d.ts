// A sublimation mug drawn in 3D on a 2D canvas: the printed wrap around a glazed cylinder,
// one column of pixels at a time, with the rim and the inside, a handle that swings round
// in front of or behind the body, and a band of glaze shine where the light catches it.
import { printPlacement, type MugSize } from './mugSizes';
import { designCanvas, type MugDesignId } from './mugArt';
import type { Side, StripLayout } from './mugLayout';

/**
 * The printed wrap at `ppi` pixels an inch: the design on the front and the same on the back
 * (mugSizes.ts printPlacement), the rest left clear (the mug's own glaze shows through).
 * Pixel art is scaled by whole pixels where it is drawn large enough for that to matter.
 */
export function wrapCanvas(id: MugDesignId, size: Pick<MugSize, 'wrapW' | 'wrapH' | 'diameter'>, ppi: number, mirrored = false): HTMLCanvasElement {
  const art = designCanvas(id);
  const c = document.createElement('canvas');
  c.width = Math.round(size.wrapW * ppi);
  c.height = Math.round(size.wrapH * ppi);
  const g = c.getContext('2d')!;
  const at = printPlacement(size, art.width / art.height);
  let k = (at.w * ppi) / art.width;
  if (k >= 2) k = Math.floor(k);
  const w = art.width * k;
  const h = art.height * k;
  g.imageSmoothingEnabled = false;
  if (mirrored) {
    g.translate(c.width, 0);
    g.scale(-1, 1);
  }
  for (const x of at.centers) g.drawImage(art, Math.round(x * ppi - w / 2), Math.round((size.wrapH * ppi - h) / 2), w, h);
  return c;
}

/** A print page's strip on its mug (mugLayout.ts), for the preview: each side's picture where the page puts it, the rest clear. */
export function stripTexture(strip: Pick<StripLayout, 'size' | 'art'>, designs: Partial<Record<Side, MugDesignId>>, ppi: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(strip.size.wrapW * ppi);
  c.height = Math.round(strip.size.wrapH * ppi);
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  for (const side of ['front', 'back'] as const) {
    const r = strip.art[side];
    const id = designs[side];
    if (r && id) g.drawImage(designCanvas(id), Math.round(r.x * ppi), Math.round(r.y * ppi), Math.round(r.w * ppi), Math.round(r.h * ppi));
  }
  return c;
}

/** Where a point `x` inches along the wrap ends up round the mug: radians from its front (the handle is at ±π). */
export function wrapAngle(size: Pick<MugSize, 'wrapW' | 'diameter'>, x: number): number {
  const circumference = Math.PI * size.diameter;
  const half = (Math.PI * Math.min(size.wrapW, circumference)) / circumference; // half the print's angle
  return ((x / size.wrapW) * 2 - 1) * half;
}

export interface MugColors {
  /** Glaze outside where there's no print. */
  body: string;
  /** Inside of the mug and the handle (two-tone blanks). */
  accent: string;
}

export const MUG_COLORS: { id: string; name: string; colors: MugColors }[] = [
  { id: 'white', name: 'White', colors: { body: '#f7f5ee', accent: '#f7f5ee' } },
  { id: 'black', name: 'Black inside', colors: { body: '#f7f5ee', accent: '#1b1b1d' } },
  { id: 'red', name: 'Red inside', colors: { body: '#f7f5ee', accent: '#c8202c' } },
  { id: 'blue', name: 'Blue inside', colors: { body: '#f7f5ee', accent: '#1d4fbf' } },
  { id: 'yellow', name: 'Yellow inside', colors: { body: '#f7f5ee', accent: '#f2c200' } },
];

interface MugView {
  texture: HTMLCanvasElement;
  size: MugSize;
  colors: MugColors;
  /** Turn of the mug, radians: 0 shows the middle of the print, the handle straight behind. */
  rot: number;
  /** Center of the top rim and the radius of the body, in canvas pixels. */
  cx: number;
  top: number;
  radius: number;
  /** How much of the top we see: the rim's ellipse height over its width. */
  tilt?: number;
  /** 'back' draws what is behind anything standing in the mug (inside, a handle behind it); 'front' the rest. */
  layer?: 'all' | 'back' | 'front';
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/**
 * The rim and the hollow inside, in the inside's color: the lip's ring, then through the
 * opening the far inner wall, lit near the rim and darkening as it goes down, and the inside
 * bottom where the mug is shallow enough to show it. The near inner wall is hidden behind the
 * lip, as it is on a real mug.
 */
function inside(g: CanvasRenderingContext2D, cx: number, top: number, R: number, ry: number, H: number, color: string): void {
  const ri = R * 0.93;
  const ryi = ry * 0.93;
  const floor = top + H * 0.93; // the inside bottom's middle
  // the lip, its top lit
  const lip = g.createLinearGradient(0, top - ry, 0, top + ry);
  lip.addColorStop(0, shade(color, 1.02));
  lip.addColorStop(1, shade(color, 0.88));
  g.fillStyle = lip;
  g.beginPath();
  g.ellipse(cx, top, R, ry, 0, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.beginPath();
  g.ellipse(cx, top, ri, ryi, 0, 0, Math.PI * 2);
  g.clip();
  // the far wall, down from the rim into the dark
  const deep = Math.max(top - ryi + 1, Math.min(top + ryi, floor - ryi)); // the lowest of it we see
  const wall = g.createLinearGradient(0, top - ryi, 0, deep);
  wall.addColorStop(0, shade(color, 0.9));
  wall.addColorStop(0.45, shade(color, 0.62));
  wall.addColorStop(1, shade(color, 0.34));
  g.fillStyle = wall;
  g.fillRect(cx - ri, top - ryi, 2 * ri, 2 * ryi);
  // the inside bottom, where it shows
  if (floor - ryi < top + ryi) {
    g.fillStyle = shade(color, 0.5);
    g.beginPath();
    g.ellipse(cx, floor, ri, ryi, 0, 0, Math.PI * 2);
    g.fill();
  }
  // the wall curving away at the sides, darker on the right (the light is from the front left), and a soft shine
  const across = g.createLinearGradient(cx - ri, 0, cx + ri, 0);
  across.addColorStop(0, 'rgba(0,0,0,0.22)');
  across.addColorStop(0.3, 'rgba(255,255,255,0.10)');
  across.addColorStop(0.55, 'rgba(0,0,0,0)');
  across.addColorStop(1, 'rgba(0,0,0,0.38)');
  g.fillStyle = across;
  g.fillRect(cx - ri, top - ryi, 2 * ri, 2 * ryi);
  g.restore();
  // the lip's inner edge
  g.strokeStyle = shade(color, 0.7);
  g.lineWidth = Math.max(1, R * 0.012);
  g.beginPath();
  g.ellipse(cx, top, ri, ryi, 0, 0, Math.PI * 2);
  g.stroke();
}

/** The mug's proportions on the canvas: body height, the rim's ellipse height, the handle's angle and the handle's shape. */
function frame(v: Pick<MugView, 'size' | 'rot' | 'radius' | 'top' | 'tilt'>) {
  const R = v.radius;
  const H = (R * 2 * v.size.height) / v.size.diameter;
  return {
    H,
    ry: R * (v.tilt ?? 0.2),
    handleAt: Math.PI + v.rot, // the handle's view angle (0 = facing us)
    reach: R * 0.62,
    hh: H * 0.34,
    mid: v.top + H * 0.48,
    tube: R * 0.16,
  };
}

/** Steps along the handle's loop. */
const HANDLE_STEPS = 32;

/**
 * The handle's middle line on the canvas, top joint to bottom joint. Each point is placed in
 * the mug's own space (how far out from the axis, how high, which way round) and then seen
 * the way the rim is: across by the sine of its angle, down by the rim's tilt times its
 * cosine. Nothing divides, so it stays finite at every angle, edge-on included.
 */
export function handlePoints(v: Pick<MugView, 'size' | 'rot' | 'cx' | 'top' | 'radius' | 'tilt'>): { x: number; y: number }[] {
  const { ry, handleAt, reach, hh, mid } = frame(v);
  const R = v.radius;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= HANDLE_STEPS; i++) {
    const t = (i / HANDLE_STEPS) * Math.PI;
    const out = R * 0.94 + reach * Math.sin(t) * (0.85 + 0.15 * Math.sin(t)); // from the axis
    const height = mid - hh * Math.cos(t);
    pts.push({ x: v.cx + out * Math.sin(handleAt), y: height + (ry * out * Math.cos(handleAt)) / R });
  }
  return pts;
}

/** Draws the mug. The body's height comes from the mug size; the handle sits opposite the print's middle. */
export function drawMug(g: CanvasRenderingContext2D, v: MugView): void {
  const { texture, size, colors, rot, cx, top, radius: R } = v;
  const layer = v.layer ?? 'all';
  const { H, ry, handleAt, tube } = frame(v);
  const circumference = Math.PI * size.diameter;
  const half = (Math.PI * Math.min(size.wrapW, circumference)) / circumference; // half the print's angle
  const printH = (H * size.wrapH) / size.height;
  const printTop = top + (H - printH) / 2;
  const handleInFront = Math.cos(handleAt) > 0;

  // the handle: one loop, stroked whole with round joins (a mitred join on a line that turns
  // back on itself, as the loop's ends do seen edge-on, shoots out in long spikes)
  const handle = () => {
    if (!size.handle) return;
    const pts = handlePoints(v);
    const trace = (dx: number) => {
      g.beginPath();
      pts.forEach((p, i) => (i ? g.lineTo(p.x + dx, p.y) : g.moveTo(p.x + dx, p.y)));
    };
    g.save();
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const lit = 0.75 + 0.25 * Math.cos(handleAt + 0.6);
    g.strokeStyle = shade(colors.accent, lit * 0.62);
    g.lineWidth = tube * 1.12;
    trace(0);
    g.stroke();
    g.strokeStyle = shade(colors.accent, lit);
    g.lineWidth = tube * 0.9;
    trace(tube * 0.04);
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.5)';
    g.lineWidth = tube * 0.22;
    trace(-tube * 0.2);
    g.stroke();
    g.restore();
  };

  if (layer !== 'front') {
    if (!handleInFront) handle();
    inside(g, cx, top, R, ry, H, colors.accent);
  }
  if (layer === 'back') return;

  // the body: its outline, the front edge curving with the rim top and bottom
  const body = new Path2D();
  body.ellipse(cx, top, R, ry, 0, Math.PI, 0, true);
  body.lineTo(cx + R, top + H);
  body.ellipse(cx, top + H, R, ry, 0, 0, Math.PI);
  body.closePath();
  g.fillStyle = colors.body;
  g.fill(body);
  // the print, a column at a time
  g.save();
  g.clip(body);
  g.imageSmoothingEnabled = false;
  for (let x = -R; x < R; x++) {
    const nx = (x + 0.5) / R;
    const view = Math.asin(Math.max(-1, Math.min(1, nx)));
    const phi = Math.atan2(Math.sin(view - rot), Math.cos(view - rot));
    if (Math.abs(phi) > half) continue;
    const u = ((phi + half) / (2 * half)) * texture.width;
    g.drawImage(texture, Math.min(texture.width - 1, Math.max(0, Math.floor(u))), 0, 1, texture.height, cx + x, printTop + ry * Math.cos(view), 1.4, printH);
  }
  // light from the front left, darker round the sides; then the glaze's shine
  const across = (f: (nx: number) => string) => {
    const grad = g.createLinearGradient(cx - R, 0, cx + R, 0);
    for (let i = 0; i <= 40; i++) grad.addColorStop(i / 40, f(-1 + i / 20));
    return grad;
  };
  g.fillStyle = across((nx) => {
    const view = Math.asin(nx);
    const dark = Math.max(0, 0.45 - 0.45 * Math.cos(view + 0.45)) + Math.max(0, nx - 0.6) * 0.5;
    return `rgba(0,0,0,${Math.min(0.85, dark).toFixed(3)})`;
  });
  g.fill(body);
  g.fillStyle = across((nx) => `rgba(255,255,255,${(Math.exp(-(((nx + 0.42) / 0.1) ** 2)) * 0.5 + Math.exp(-(((nx - 0.58) / 0.05) ** 2)) * 0.15).toFixed(3)})`);
  g.fillRect(cx - R, top + H * 0.06, 2 * R, H * 0.86);
  g.restore();
  // a rounded foot and the lip's glint
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.lineWidth = Math.max(1, R * 0.03);
  g.beginPath();
  g.ellipse(cx, top + H - R * 0.02, R * 0.99, ry, 0, 0.05, Math.PI - 0.05);
  g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = Math.max(1, R * 0.025);
  g.beginPath();
  g.ellipse(cx, top, R * 0.99, ry, 0, 0.15, Math.PI - 0.15);
  g.stroke();
  if (handleInFront) handle();
}
