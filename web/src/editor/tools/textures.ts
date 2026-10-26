// Seamless 20x20 textures for background blocks, drawn in whatever colors the game's
// palette has: each recipe asks for colors by RGB and gets the nearest palette entries,
// so a grass block is green even in a palette full of grays. Tiles wrap at the edges, so
// a field of them shows no seams.
import { BLEN } from '../../formats/blocks';
import { matchColor, type Palette } from '../../formats/palette';

type RGB = [number, number, number];

/** Periodic value noise over a 20x20 tile (wraps both ways). */
function noise(seed: number, cell: number): (x: number, y: number) => number {
  const n = Math.ceil(BLEN / cell);
  const grid = Array.from({ length: n * n }, (_, i) => {
    const v = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
    return v - Math.floor(v);
  });
  const at = (gx: number, gy: number) => grid[(((gy % n) + n) % n) * n + (((gx % n) + n) % n)];
  return (x, y) => {
    const fx = x / cell;
    const fy = y / cell;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
    const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
    return a + (b - a) * sy;
  };
}

function rand(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => (a = (a * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** Shades from dark to light between two RGB colors. */
function ramp(dark: RGB, light: RGB, n: number): RGB[] {
  return Array.from({ length: n }, (_, i) => dark.map((d, k) => Math.round(d + ((light[k] - d) * i) / (n - 1))) as RGB);
}

interface Texture {
  name: string;
  icon: string;
  /** RGB colors per pixel for a seed. */
  draw: (seed: number) => (x: number, y: number) => RGB;
}

const pickShade = (shades: RGB[], v: number) => shades[Math.max(0, Math.min(shades.length - 1, Math.floor(v * shades.length)))];

export const TEXTURES: Texture[] = [
  {
    name: 'Grass',
    icon: '🌿',
    draw: (seed) => {
      const n = noise(seed, 5);
      const r = rand(seed);
      const blades = new Set(Array.from({ length: 34 }, () => Math.floor(r() * 400)));
      const g = ramp([20, 70, 20], [90, 170, 60], 5);
      return (x, y) => (blades.has(y * BLEN + x) ? [150, 210, 90] : pickShade(g, n(x, y) * 0.8 + 0.1));
    },
  },
  {
    name: 'Brick',
    icon: '🧱',
    draw: (seed) => {
      const n = noise(seed, 3);
      const b = ramp([110, 40, 30], [180, 80, 55], 4);
      return (x, y) => {
        const row = Math.floor(y / 5);
        const mortarY = y % 5 === 4;
        const mortarX = (x + (row % 2) * 5) % 10 === 9;
        return mortarY || mortarX ? [170, 160, 140] : pickShade(b, n(x, y));
      };
    },
  },
  {
    name: 'Stone',
    icon: '🪨',
    draw: (seed) => {
      const n = noise(seed, 4);
      const m = noise(seed + 9, 10);
      const s = ramp([70, 70, 75], [175, 175, 180], 6);
      return (x, y) => {
        const v = n(x, y) * 0.6 + m(x, y) * 0.4;
        return Math.abs(v - 0.5) < 0.03 ? [45, 45, 50] : pickShade(s, v);
      };
    },
  },
  {
    name: 'Water',
    icon: '🌊',
    draw: (seed) => {
      const n = noise(seed, 5);
      const w = ramp([10, 40, 120], [80, 150, 230], 5);
      return (x, y) => {
        const wave = Math.sin(((x + n(x, y) * 6) / BLEN) * Math.PI * 4 + (y / BLEN) * Math.PI * 2);
        return wave > 0.85 ? [200, 230, 255] : pickShade(w, 0.5 + wave * 0.3 + (n(x, y) - 0.5) * 0.3);
      };
    },
  },
  {
    name: 'Sand',
    icon: '🏖️',
    draw: (seed) => {
      const r = rand(seed);
      const n = noise(seed, 7);
      const s = ramp([180, 140, 80], [240, 210, 150], 5);
      return (x, y) => pickShade(s, n(x, y) * 0.6 + r() * 0.4);
    },
  },
  {
    name: 'Wood',
    icon: '🪵',
    draw: (seed) => {
      const n = noise(seed, 4);
      const w = ramp([90, 55, 25], [170, 115, 60], 5);
      return (x, y) => (x % 7 === 6 ? [60, 35, 15] : pickShade(w, 0.5 + Math.sin(y * 0.9 + n(x, y) * 5) * 0.35));
    },
  },
  {
    name: 'Snow',
    icon: '❄️',
    draw: (seed) => {
      const n = noise(seed, 6);
      const r = rand(seed);
      const s = ramp([170, 190, 215], [250, 252, 255], 5);
      return (x, y) => (r() < 0.03 ? [255, 255, 255] : pickShade(s, n(x, y) * 0.7 + 0.3));
    },
  },
  {
    name: 'Lava',
    icon: '🌋',
    draw: (seed) => {
      const n = noise(seed, 5);
      const m = noise(seed + 3, 3);
      const l = ramp([90, 10, 0], [255, 220, 60], 6);
      return (x, y) => pickShade(l, Math.pow(n(x, y) * 0.7 + m(x, y) * 0.3, 1.6));
    },
  },
  {
    name: 'Metal',
    icon: '🔩',
    draw: (seed) => {
      const n = noise(seed, 10);
      const m = ramp([90, 95, 105], [200, 205, 215], 5);
      return (x, y) => {
        if ((x === 2 || x === 17) && (y === 2 || y === 17)) return [60, 60, 65];
        if (x === 0 || y === 0) return [220, 225, 235];
        if (x === 19 || y === 19) return [70, 72, 80];
        return pickShade(m, 0.4 + n(x, y) * 0.3 + (y / BLEN) * 0.2);
      };
    },
  },
  {
    name: 'Dirt',
    icon: '🟫',
    draw: (seed) => {
      const n = noise(seed, 3);
      const r = rand(seed);
      const d = ramp([60, 40, 20], [130, 95, 60], 5);
      return (x, y) => (r() < 0.04 ? [150, 140, 120] : pickShade(d, n(x, y)));
    },
  },
];

/** Draws a texture into 20x20 palette indexes. */
export function paintTexture(t: Texture, seed: number, pal: Palette): Uint8Array {
  const f = t.draw(seed);
  const cache = new Map<string, number>();
  const out = new Uint8Array(BLEN * BLEN);
  for (let y = 0; y < BLEN; y++)
    for (let x = 0; x < BLEN; x++) {
      const [r, g, b] = f(x, y);
      const key = `${r},${g},${b}`;
      let c = cache.get(key);
      if (c === undefined) {
        c = matchColor(pal, r >> 2, g >> 2, b >> 2);
        cache.set(key, c);
      }
      out[y * BLEN + x] = c;
    }
  return out;
}
