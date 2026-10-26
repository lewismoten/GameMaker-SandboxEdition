// The egg shell all the bonus pictures share (bonusArt.ts, pastryEgg.ts): a covering painted
// flat and wrapped round the egg shape pixel by pixel, like the felt eggs (eggArt.ts), but lit
// with a sheen and a bump map so icing stands up and cracks sink; and the small helpers the
// coverings are painted with (wrapping value noise, layers read back as heights).
import { radiusAt } from './eggArt';
import { TEX_H, TEX_W } from './eggTexture';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A covering for the egg: its colors, how high each spot stands, and which spots are gold. */
export interface Shell {
  color: ImageData;
  height?: Float32Array;
  metal?: Uint8Array;
  /** How glossy (0 felt .. 1 mirror glaze) and how tight the highlight. */
  shine: number;
  gloss: number;
  /** How strongly `height` bends the light. */
  bump: number;
}

export const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/** Value noise on a lattice that wraps across (u), so the seam at the back closes. */
export function noise(seed: number): (u: number, v: number, fu: number, fv: number) => number {
  const hash = (x: number, y: number) => {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  return (u, v, fu, fv) => {
    const x = u * fu;
    const y = v * fv;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const sx = x - x0;
    const sy = y - y0;
    const ex = sx * sx * (3 - 2 * sx);
    const ey = sy * sy * (3 - 2 * sy);
    const a = hash(((x0 % fu) + fu) % fu, y0);
    const b = hash((((x0 + 1) % fu) + fu) % fu, y0);
    const c = hash(((x0 % fu) + fu) % fu, y0 + 1);
    const d = hash((((x0 + 1) % fu) + fu) % fu, y0 + 1);
    return a + (b - a) * ex + (c - a) * ey + (a - b - c + d) * ex * ey;
  };
}

export const fbm = (n: ReturnType<typeof noise>, u: number, v: number, base: number) => {
  let sum = 0;
  let amp = 0.5;
  let f = base;
  for (let o = 0; o < 4; o++) {
    sum += amp * n(u, v, f, Math.round(f / 2) + 1);
    amp *= 0.5;
    f *= 2;
  }
  return sum / 0.9375;
};

/** Draws `draw` three times across so whatever crosses the seam at u = 0 / 1 closes. */
export const wrap = (draw: (dx: number) => void) => [-TEX_W, 0, TEX_W].forEach(draw);

export const readLayer = (c: HTMLCanvasElement): Float32Array => {
  const d = c.getContext('2d')!.getImageData(0, 0, TEX_W, TEX_H).data;
  const out = new Float32Array(TEX_W * TEX_H);
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4] / 255;
  return out;
};

// ---- the shell, wrapped and lit -----------------------------------------------------------

/** Draws a shell turned by `turn` radians into `box`, through a buffer of at most `res` rows. */
export function drawShell(g: CanvasRenderingContext2D, shell: Shell, turn: number, box: Box, res = 300): void {
  const H = Math.max(16, Math.min(res, Math.round(box.h)));
  const W = Math.max(12, Math.round((H * box.w) / box.h));
  const img = new ImageData(W, H);
  const out = img.data;
  const src = shell.color.data;
  const { height, metal, shine, gloss, bump } = shell;
  const half = H / 2;
  const cx = W / 2;
  const L = [-0.45, -0.55, 0.7];
  const ln = Math.hypot(L[0], L[1], L[2]);
  L[0] /= ln;
  L[1] /= ln;
  L[2] /= ln;
  // the halfway vector to the viewer, for the glaze's highlight
  let Hx = L[0];
  let Hy = L[1];
  let Hz = L[2] + 1;
  const hl = Math.hypot(Hx, Hy, Hz);
  Hx /= hl;
  Hy /= hl;
  Hz /= hl;
  for (let py = 0; py < H; py++) {
    const y = (py + 0.5 - half) / half;
    const R = radiusAt(y);
    if (R <= 0) continue;
    const dR = (radiusAt(y + 0.002) - radiusAt(y - 0.002)) / 0.004;
    const v = Math.min(TEX_H - 1, Math.max(0, Math.floor(((y + 1) / 2) * TEX_H)));
    for (let px = 0; px < W; px++) {
      const x = (px + 0.5 - cx) / half;
      const edge = (R - Math.abs(x)) * half;
      if (edge <= -0.5) continue;
      const xr = Math.min(R, Math.abs(x)) * Math.sign(x);
      const z = Math.sqrt(Math.max(0, R * R - xr * xr));
      let u = (Math.atan2(xr, z) + turn + Math.PI / 2) / (Math.PI * 2);
      u -= Math.floor(u);
      const tu = Math.min(TEX_W - 1, Math.floor(u * TEX_W));
      const t = v * TEX_W + tu;
      let nx = xr / R;
      let ny = -dR;
      let nz = z / R;
      let nl = Math.hypot(nx, ny, nz);
      nx /= nl;
      ny /= nl;
      nz /= nl;
      let hgt = 0;
      if (height) {
        hgt = height[t];
        const du = (height[v * TEX_W + ((tu + 1) % TEX_W)] - height[v * TEX_W + ((tu + TEX_W - 1) % TEX_W)]) * bump;
        const dv = (height[Math.min(TEX_H - 1, v + 1) * TEX_W + tu] - height[Math.max(0, v - 1) * TEX_W + tu]) * bump;
        // along the turn the surface runs (cos φ, 0, -sin φ); down it runs (0, 1, 0)
        const c = z / R;
        const s = xr / R;
        nx -= du * c;
        nz += du * s;
        ny -= dv;
        nl = Math.hypot(nx, ny, nz);
        nx /= nl;
        ny /= nl;
        nz /= nl;
      }
      const d = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      const sp = Math.pow(Math.max(0, nx * Hx + ny * Hy + nz * Hz), gloss);
      const o = (py * W + px) * 4;
      const r0 = src[t * 4];
      const g0 = src[t * 4 + 1];
      const b0 = src[t * 4 + 2];
      if (metal && metal[t]) {
        // gold leaf: dark where it faces the floor, bright where it catches the room
        const env = 0.35 + 0.65 * Math.max(0, 0.5 - ny * 0.7 + nx * 0.2);
        const k = 0.25 + 0.55 * d + 0.55 * env;
        out[o] = Math.min(255, r0 * k + sp * 255);
        out[o + 1] = Math.min(255, g0 * k + sp * 235);
        out[o + 2] = Math.min(255, b0 * k + sp * 170);
      } else {
        const k = 0.34 + 0.74 * d;
        // piping and raised spots are matte; the glaze between them shines
        const s = sp * shine * (hgt > 0.12 ? 0.3 : 1) * 255;
        const rim = Math.pow(1 - nz, 3) * shine * 40;
        out[o] = Math.min(255, r0 * k + s + rim);
        out[o + 1] = Math.min(255, g0 * k + s + rim);
        out[o + 2] = Math.min(255, b0 * k + s + rim);
      }
      out[o + 3] = Math.max(0, Math.min(1, edge + 0.5)) * 255;
    }
  }
  const buf = canvas(W, H);
  buf.getContext('2d')!.putImageData(img, 0, 0);
  g.save();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(buf, box.x, box.y, box.w, box.h);
  g.restore();
}
