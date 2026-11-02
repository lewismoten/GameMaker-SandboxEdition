// Nearest-pixel sprite transformations retain palette indexes and transparency.
import { Pixels } from './pixels';
import { CLEAR } from './blit';
export function resampleBlit(dst: Pixels, src: Pixels, x: number, y: number, s: number, flip = false): Pixels {
  for (let yy = 0; yy < src.h * s; yy++)
    for (let xx = 0; xx < src.w * s; xx++) {
      const sx = Math.floor(xx / s);
      const c = src.get(flip ? src.w - 1 - sx : sx, Math.floor(yy / s));
      if (c !== CLEAR && c >= 0) dst.set(x + xx, y + yy, c);
    }
  return dst;
}

export function turn45(src: Pixels, scale = 0.86): Pixels {
  const out = new Pixels(src.w, src.h, CLEAR);
  const cx = (src.w - 1) / 2;
  const cy = (src.h - 1) / 2;
  const c = Math.SQRT1_2 / scale;
  for (let y = 0; y < out.h; y++)
    for (let x = 0; x < out.w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      // back by -45 degrees
      const sx = Math.round(cx + (dx + dy) * c);
      const sy = Math.round(cy + (dy - dx) * c);
      if (sx < 0 || sy < 0 || sx >= src.w || sy >= src.h) continue;
      out.set(x, y, src.get(sx, sy));
    }
  return out;
}

export function turn90(src: Pixels): Pixels {
  const out = new Pixels(src.h, src.w, CLEAR);
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) out.set(x, y, src.get(y, src.h - 1 - x));
  return out;
}

export function turn180(src: Pixels): Pixels {
  const out = new Pixels(src.w, src.h, CLEAR);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) out.set(x, y, src.get(src.w - 1 - x, src.h - 1 - y));
  return out;
}

export function flipX(src: Pixels): Pixels {
  const out = new Pixels(src.w, src.h, CLEAR);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) out.set(x, y, src.get(src.w - 1 - x, y));
  return out;
}

export function flipY(src: Pixels): Pixels {
  const out = new Pixels(src.w, src.h);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) out.set(x, y, src.get(x, src.h - 1 - y));
  return out;
}

export function rotate(src: Pixels, deg: number): Pixels {
  const out = new Pixels(src.w, src.h, CLEAR);
  const a = (-deg * Math.PI) / 180;
  const cx = (src.w - 1) / 2;
  const cy = (src.h - 1) / 2;
  for (let y = 0; y < out.h; y++)
    for (let x = 0; x < out.w; x++) {
      const sx = Math.round(cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a));
      const sy = Math.round(cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a));
      if (sx < 0 || sy < 0 || sx >= src.w || sy >= src.h) continue;
      out.set(x, y, src.get(sx, sy));
    }
  return out;
}
