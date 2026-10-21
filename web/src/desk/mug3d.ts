// A sublimation mug drawn in 3D on a 2D canvas: the printed wrap around a glazed cylinder,
// one column of pixels at a time, with the rim and the inside, a handle that swings round
// in front of or behind the body, and a band of glaze shine where the light catches it.
import type { MugSize } from './mugSizes';
import { DESIGN_BG, designCanvas, type MugDesignId } from './mugArt';

/** The printed wrap: the design centered on its background, at `ppi` pixels an inch. */
export function wrapCanvas(id: MugDesignId, size: Pick<MugSize, 'wrapW' | 'wrapH'>, ppi: number, mirrored = false): HTMLCanvasElement {
  const art = designCanvas(id);
  const c = document.createElement('canvas');
  c.width = Math.round(size.wrapW * ppi);
  c.height = Math.round(size.wrapH * ppi);
  const g = c.getContext('2d')!;
  g.fillStyle = DESIGN_BG;
  g.fillRect(0, 0, c.width, c.height);
  // as large as fits, with a little breathing room top and bottom
  const k = Math.min(c.width / art.width, (c.height * 0.94) / art.height);
  const w = art.width * k;
  const h = art.height * k;
  g.imageSmoothingEnabled = false;
  if (mirrored) {
    g.translate(c.width, 0);
    g.scale(-1, 1);
  }
  g.drawImage(art, (c.width - w) / 2, (c.height - h) / 2, w, h);
  return c;
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

export interface MugView {
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

/** Draws the mug. The body's height comes from the mug size; the handle sits opposite the print's middle. */
export function drawMug(g: CanvasRenderingContext2D, v: MugView): void {
  const { texture, size, colors, rot, cx, top, radius: R } = v;
  const e = v.tilt ?? 0.2;
  const layer = v.layer ?? 'all';
  const H = (R * 2 * size.height) / size.diameter;
  const ry = R * e;
  const circumference = Math.PI * size.diameter;
  const half = (Math.PI * Math.min(size.wrapW, circumference)) / circumference; // half the print's angle
  const printH = (H * size.wrapH) / size.height;
  const printTop = top + (H - printH) / 2;
  const handleAt = Math.PI + rot; // the handle's view angle (0 = facing us)
  const handleInFront = Math.cos(handleAt) > 0;

  const handle = () => {
    if (!size.handle) return;
    const reach = R * 0.62;
    const hh = H * 0.34;
    const mid = top + H * 0.48;
    const tube = R * 0.16;
    const path = (dAngle: number) => {
      g.beginPath();
      for (let i = 0; i <= 24; i++) {
        const t = (i / 24) * Math.PI;
        const r = R * 0.96 + reach * Math.sin(t) * (0.85 + 0.15 * Math.sin(t));
        const th = handleAt + dAngle / r;
        const x = cx + r * Math.sin(th);
        const y = mid - hh * Math.cos(t) + ry * (r / R) * Math.cos(th);
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
    };
    g.save();
    g.lineCap = 'round';
    const lit = 0.75 + 0.25 * Math.cos(handleAt + 0.6);
    for (const d of [-tube * 0.6, 0, tube * 0.6]) {
      g.strokeStyle = shade(colors.accent, lit * (d ? 0.9 : 1));
      g.lineWidth = tube;
      path(d);
      g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,0.55)';
    g.lineWidth = tube * 0.22;
    path(-tube * 0.35);
    g.stroke();
    g.restore();
  };

  if (layer !== 'front') {
    if (!handleInFront) handle();
    // the rim and the inside
    g.fillStyle = shade(colors.body, 0.96);
    g.beginPath();
    g.ellipse(cx, top, R, ry, 0, 0, Math.PI * 2);
    g.fill();
    const inner = g.createLinearGradient(0, top - ry, 0, top + ry);
    inner.addColorStop(0, shade(colors.accent, 0.95));
    inner.addColorStop(1, shade(colors.accent, 0.45));
    g.fillStyle = inner;
    g.beginPath();
    g.ellipse(cx, top + ry * 0.04, R * 0.92, ry * 0.86, 0, 0, Math.PI * 2);
    g.fill();
    // shadow of the far wall on the inside
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath();
    g.ellipse(cx, top + ry * 0.04, R * 0.92, ry * 0.86, 0, Math.PI, Math.PI * 2);
    g.fill();
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
