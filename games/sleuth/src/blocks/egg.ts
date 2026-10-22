// The green room's prop fireplace at 2 AM, and what the lens finds behind its silk flames:
// a felt egg in theater-red velvet with gold checkerboard trim, a black-and-white comedy
// mask on the front and a gold curtain-tie stitched round its middle. Touching the
// fireplace with the lens costs a charge and shows the egg; touching the egg adds to
// CTR.egg and leaves the hearth open (the scene link behind it shows who left it there).
import { Pixels } from '../../../kit/pixels';
import { shadeAt, pool } from '../art/draw';
import { c, ramp as r } from '../art/pal';
import { CTR } from '../ids';
import { SOLID, type BlockDef } from './blockset';

/**
 * Paints the felt egg centered on (cx, cy), rx by ry pixels, onto p. Works from a 20x20
 * block (rx about 6) up to the lore screen's close-up; the face and the stitches are
 * placed by hand at block size, where a formula would lose them.
 */
export function feltEgg(p: Pixels, cx: number, cy: number, rx: number, ry: number): Pixels {
  const small = rx < 10;
  const velvet = r('velvet');
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const ny = (y + 0.5 - cy) / ry;
      const w = 0.8 + 0.2 * ((ny + 1) / 2); // narrower at the top
      const nx = (x + 0.5 - cx) / (rx * w);
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const z = Math.sqrt(1 - d);
      const light = (0.62 * z - 0.42 * nx - 0.52 * ny + 0.35) / 1.2;
      // bands follow the curve of the shell
      const v = ny + 0.1 * Math.sqrt(Math.max(0, 1 - nx * nx));
      const edge = d > 0.82;
      let col = shadeAt(velvet, 1, 5, light, x, y);
      // felt: a soft fuzz of the neighboring shades
      if (!edge && ((x * 7 + y * 13) % 11 === 0 || (x * 3 + y * 5) % 17 === 0)) col = shadeAt(velvet, 1, 5, light + 0.18, x, y);
      const check = (v0: number, v1: number) => {
        if (v < v0 || v >= v1) return false;
        const cells = small ? 4 : 7;
        const i = Math.floor((nx + 1) * cells);
        const j = Math.floor(((v - v0) / (v1 - v0)) * 2);
        col = (i + j) % 2 ? c('gold', small ? 1 : 1) : shadeAt(r('gold'), 3, 5, light, x, y);
        return true;
      };
      if (!check(-0.66, -0.4)) check(0.48, 0.74);
      // the gold curtain-tie: a twisted cord round the middle
      if (v >= 0.16 && v < (small ? 0.3 : 0.28)) col = small ? ((x + y) % 3 === 0 ? c('gold', 2) : c('gold', 5)) : (x + y) % 4 === 0 ? c('gold', 1) : (x + y) % 4 === 1 ? c('gold', 3) : c('gold', 5);
      if (edge) col = shadeAt(velvet, 0, 2, light, x, y);
      p.set(x, y, col);
    }
  if (small) {
    // the comedy mask: white face, black eyes and a big grin; the tie's tassel
    const mx = Math.round(cx) - 3;
    const my = Math.round(cy - ry * 0.32);
    p.rect(mx + 1, my, 5, 1, c('paper', 5)).rect(mx, my + 1, 7, 2, c('paper', 5)).rect(mx + 1, my + 3, 5, 1, c('paper', 5));
    p.set(mx + 1, my + 1, c('black', 0)).set(mx + 5, my + 1, c('black', 0));
    p.set(mx + 2, my + 2, c('black', 0)).set(mx + 3, my + 3, c('black', 0)).set(mx + 4, my + 2, c('black', 0));
    const tx = Math.round(cx + rx * 0.45);
    const ty = Math.round(cy + ry * 0.24);
    p.set(tx, ty, c('gold', 5)).set(tx, ty + 1, c('gold', 4)).set(tx - 1, ty + 2, c('gold', 3)).set(tx + 1, ty + 2, c('gold', 3));
    return p;
  }
  // close-up: running stitches along the trim, then the mask and the tassel
  const at = (nx: number, v: number): [number, number] => {
    const ny = v - 0.1 * Math.sqrt(Math.max(0, 1 - nx * nx));
    const w = 0.8 + 0.2 * ((ny + 1) / 2);
    return [Math.round(cx + nx * rx * w), Math.round(cy + ny * ry)];
  };
  for (const v of [-0.69, -0.37, 0.45, 0.77])
    for (let nx = -0.9; nx <= 0.9; nx += 0.06) {
      const ny = v - 0.1 * Math.sqrt(1 - nx * nx);
      const w = 0.8 + 0.2 * ((ny + 1) / 2);
      if ((nx / w) ** 2 + ny * ny > 0.8) continue;
      if (Math.round(nx * 100) % 12 < 6) {
        const [x, y] = at(nx, v);
        p.set(x, y, c('paper', 5));
      }
    }
  // the mask
  const mcx = cx;
  const mcy = cy - ry * 0.12;
  const mw = rx * 0.5;
  const mh = ry * 0.24;
  for (let y = Math.floor(mcy - mh); y <= mcy + mh * 1.1; y++)
    for (let x = Math.floor(mcx - mw); x <= mcx + mw; x++) {
      const u = (x + 0.5 - mcx) / mw;
      const t = (y + 0.5 - mcy) / mh;
      // a mask: wide brow, cheeks tapering to a rounded chin
      const half = t < 0 ? Math.sqrt(Math.max(0, 1 - t * t * 0.4)) : Math.sqrt(Math.max(0, 1 - t * t * 0.85));
      if (Math.abs(u) > half) continue;
      p.set(x, y, Math.abs(u) > half - 0.1 || t > 1.02 ? c('black', 0) : Math.abs(u) > half - 0.22 ? c('paper', 3) : c('paper', 5));
    }
  // laughing eyes (upturned arcs), arched brows and a wide grin
  for (const side of [-1, 1]) {
    const ex = mcx + side * mw * 0.42;
    const ey = mcy - mh * 0.25;
    for (let a = 0; a <= Math.PI; a += 0.1) {
      p.set(ex + Math.cos(a) * mw * 0.2, ey - Math.sin(a) * mh * 0.3, c('black', 0));
      p.set(ex + Math.cos(a) * mw * 0.2, ey - Math.sin(a) * mh * 0.3 + 1, c('black', 0));
      p.set(ex + Math.cos(a) * mw * 0.26, ey - mh * 0.5 - Math.sin(a) * mh * 0.22, c('black', 1));
    }
  }
  for (let a = 0.15; a <= Math.PI - 0.15; a += 0.05) {
    const x = mcx + Math.cos(a) * mw * 0.55;
    const y = mcy + mh * 0.3 + Math.sin(a) * mh * 0.45;
    for (let k = 0; k < 3; k++) p.set(x, y - k, c('black', 0));
  }
  p.rect(Math.round(mcx - mw * 0.35), Math.round(mcy + mh * 0.38), Math.round(mw * 0.7), 1, c('black', 0));
  // the tie's knot and tassel, hanging on the right
  const [kx, ky] = at(0.45, 0.22);
  p.disc(kx, ky, Math.max(2, rx * 0.08), c('gold', 4));
  // the mask's ribbons, off to the sides
  for (const side of [-1, 1]) p.line(mcx + side * mw, mcy - mh * 0.5, mcx + side * mw * 1.35, mcy - mh * 0.2, c('black', 0));
  const tl = Math.round(ry * 0.2);
  p.rect(kx - 1, ky + 2, 3, 2, c('gold', 3));
  for (let i = -3; i <= 3; i++) p.line(kx + Math.round(i / 2), ky + 4, kx + i, ky + 4 + tl, i % 2 ? c('gold', 2) : c('gold', 5));
  p.rect(kx - 3, ky + 4, 7, 1, c('gold', 1));
  return p;
}

/** The fireplace without its fire: wallpaper, the grey surround and a dark hearth. */
function hearth(wallpaper: () => Pixels, open: boolean): Pixels {
  const p = wallpaper();
  p.rect(1, 3, 18, 15, c('grey', 3)).rect(4, 7, 12, 11, c('black', 0));
  p.rect(1, 3, 18, 2, c('grey', 5));
  if (open) {
    // the false back swung aside: a draft of cold air and a sliver of the dark behind
    p.rect(5, 8, 2, 10, c('panel', 2)).rect(6, 8, 1, 10, c('panel', 3));
    for (let y = 9; y < 17; y += 2) p.set(12, y, c('grey', 1));
  }
  return p;
}

type Add = (name: string, p: Pixels, d?: BlockDef) => number;

/**
 * The second round's right-hand fireplace looks and flickers like the left one, but it is a
 * stage prop: under the lens (a charge) its silk flames show the egg sitting behind them.
 * `fire` and `fire2` are the real fireplace's two frames.
 */
export function addEggBlocks(add: Add, wallpaper: () => Pixels, fire: Pixels, fire2: Pixels): void {
  const S = { solid: SOLID };
  add('propfire', fire, { ...S, effect: CTR.lens, eamt: -1, touch: 'fire_egg', next: 'propfire2', ntime: 4 });
  add('propfire2', fire2, { ...S, effect: CTR.lens, eamt: -1, touch: 'fire_egg', next: 'propfire', ntime: 5 });
  const egg = hearth(wallpaper, false);
  // the silk flames pulled aside, lying limp in the hearth
  pool(egg, 10, 17, 6, 2, r('glow'), 0, 1);
  feltEgg(egg, 10, 11, 5.5, 7);
  add('fire_egg', egg, { ...S, effect: CTR.egg, eamt: 1, touch: 'hearth' });
  add('hearth', hearth(wallpaper, true));
}

/** The lore screen's close-up (80x80, CLEAR around the egg). */
export function eggCloseUp(clear: number): Pixels {
  const p = new Pixels(80, 80, clear);
  return feltEgg(p, 40, 41, 27, 36);
}
