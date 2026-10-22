// A 320x200 painting surface for title screens, story panels, planet cards and FLI
// frames: text in the PC's 8x8 font (scaled, outlined, gradient-filled), starfields,
// lit spheres, and sprites blown up from the game's own 20x20 art.
import { Pixels, rng, dither } from '../../../kit/pixels';
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';
import { CLEAR } from './draw';

export class Canvas extends Pixels {
  constructor(w = 320, h = 200, fill = 0) {
    super(w, h, fill);
  }

  /** Text in the 8x8 font. `ramp` paints each glyph row top..bottom (gradient). */
  text(x: number, y: number, s: string, color: number | number[], o: { scale?: number; shadow?: number; outline?: number; spacing?: number } = {}): number {
    const k = o.scale ?? 1;
    const ramp = Array.isArray(color) ? color : [color];
    const glyphs = (dx: number, dy: number, col: (row: number) => number) => {
      let cx = x + dx;
      for (const ch of s) {
        const code = ch.charCodeAt(0);
        for (let row = 0; row < 8; row++) {
          const bits = FONT8X8[code * 8 + row];
          for (let b = 0; b < 8; b++) if (bits & (1 << b)) this.rect(cx + b * k, y + dy + row * k, k, k, col(row));
        }
        cx += (8 + (o.spacing ?? 0)) * k;
      }
      return cx;
    };
    if (o.outline !== undefined)
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
      ])
        glyphs(dx, dy, () => o.outline!);
    if (o.shadow !== undefined) glyphs(k, k, () => o.shadow!);
    return glyphs(0, 0, (row) => ramp[Math.min(ramp.length - 1, Math.floor((row / 8) * ramp.length))]);
  }

  /** Width in pixels of a string. */
  static width(s: string, scale = 1, spacing = 0): number {
    return s.length * (8 + spacing) * scale;
  }

  center(y: number, s: string, color: number | number[], o: { scale?: number; shadow?: number; outline?: number; spacing?: number } = {}): void {
    this.text(Math.round((this.w - Canvas.width(s, o.scale ?? 1, o.spacing ?? 0)) / 2), y, s, color, o);
  }

  /** Word-wrapped text; returns the y after the last line. */
  para(x: number, y: number, width: number, s: string, color: number, lineH = 10, shadow?: number): number {
    const cols = Math.floor(width / 8);
    const words = s.split(/\s+/);
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > cols) {
        this.text(x, y, line.trim(), color, { shadow });
        y += lineH;
        line = w;
      } else line += ' ' + w;
    }
    if (line.trim()) {
      this.text(x, y, line.trim(), color, { shadow });
      y += lineH;
    }
    return y;
  }

  /** A field of stars in the star ramp. */
  stars(seed: number, count: number, ramp: number[], area = { x: 0, y: 0, w: this.w, h: this.h }): void {
    const r = rng(seed);
    for (let i = 0; i < count; i++) {
      const x = area.x + Math.floor(r() * area.w);
      const y = area.y + Math.floor(r() * area.h);
      const b = r();
      this.set(x, y, ramp[Math.floor(b * b * ramp.length)]);
      if (b > 0.97) {
        const c = ramp[ramp.length - 1];
        this.set(x - 1, y, ramp[1])
          .set(x + 1, y, ramp[1])
          .set(x, y - 1, ramp[1])
          .set(x, y + 1, ramp[1])
          .set(x, y, c);
      }
    }
  }

  /** Vertical gradient through a ramp (dithered). */
  gradient(x: number, y: number, w: number, h: number, ramp: number[], reverse = false): void {
    for (let yy = 0; yy < h; yy++) {
      const t = (reverse ? h - 1 - yy : yy) / Math.max(1, h - 1);
      const f = t * (ramp.length - 1);
      const i = Math.floor(f);
      for (let xx = 0; xx < w; xx++) this.set(x + xx, y + yy, dither(xx, yy, f - i) ? ramp[Math.min(ramp.length - 1, i + 1)] : ramp[i]);
    }
  }

  /** A lit sphere: `ramps` paint bands/patches by a noise function; light from the upper left. */
  sphere(
    cx: number,
    cy: number,
    rad: number,
    ramp: number[],
    o: { pattern?: (u: number, v: number) => number; second?: number[]; atmo?: number; rings?: number[]; night?: number } = {},
  ): void {
    for (let y = Math.floor(cy - rad - 2); y <= cy + rad + 2; y++)
      for (let x = Math.floor(cx - rad - 2); x <= cx + rad + 2; x++) {
        const dx = (x + 0.5 - cx) / rad;
        const dy = (y + 0.5 - cy) / rad;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) {
          if (o.atmo !== undefined && d2 < 1.06 && dx + dy < 0.3) this.set(x, y, o.atmo);
          continue;
        }
        const z = Math.sqrt(1 - d2);
        const light = Math.max(0, Math.min(1, z * 0.65 - dx * 0.35 - dy * 0.3 + 0.2));
        const u = Math.atan2(dx, z) / Math.PI + 0.5;
        const v = dy * 0.5 + 0.5;
        const useSecond = o.pattern && o.second ? o.pattern(u, v) > 0.5 : false;
        const r2 = useSecond ? o.second! : ramp;
        const f = light * (r2.length - 1);
        const i = Math.floor(f);
        let c = dither(x, y, f - i) ? r2[Math.min(r2.length - 1, i + 1)] : r2[i];
        if (o.night !== undefined && light < 0.12) c = o.night;
        this.set(x, y, c);
      }
    if (o.rings) {
      for (let t = 0; t < Math.PI * 2; t += 0.004) {
        for (let k = 0; k < o.rings.length; k++) {
          const rr = rad * (1.35 + k * 0.08);
          const x = cx + Math.cos(t) * rr;
          const y = cy + Math.sin(t) * rr * 0.28;
          const behind = Math.sin(t) < 0;
          const inside = ((x - cx) / rad) ** 2 + ((y - cy) / rad) ** 2 < 1;
          if (behind && inside) continue;
          this.set(x, y, o.rings[k]);
        }
      }
    }
  }

  /** Blows up a sprite (255 = clear) by an integer factor. */
  sprite(p: Pixels, x: number, y: number, k: number, flip = false): void {
    for (let yy = 0; yy < p.h; yy++)
      for (let xx = 0; xx < p.w; xx++) {
        const c = p.get(flip ? p.w - 1 - xx : xx, yy);
        if (c !== CLEAR && c >= 0) this.rect(x + xx * k, y + yy * k, k, k, c);
      }
  }

  /** A framed panel. */
  panel(x: number, y: number, w: number, h: number, fill: number, edge: number, light?: number): void {
    this.rect(x, y, w, h, fill);
    this.frame(x, y, w, h, edge);
    if (light !== undefined) {
      this.rect(x + 1, y + 1, w - 2, 1, light);
      this.rect(x + 1, y + 1, 1, h - 2, light);
    }
  }
}
