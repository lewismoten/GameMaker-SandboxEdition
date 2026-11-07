// The 13 lucky charms Midnight gathers, each a 20x20 block on the sky color, outlined in ink. None is money:
// a horseshoe, a four-leaf clover, a ladybug, a wishbone, a lucky acorn, a shooting star, a lucky sock, a pair of
// dice that make seven, a feather, a rainbow, a little bell, a ribbon and a swirly marble.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The charms in the order the levels give them out. */
export const CHARMS = [
  'horseshoe',
  'clover',
  'ladybug',
  'wishbone',
  'acorn',
  'sock',
  'star',
  'dice',
  'feather',
  'rainbow',
  'bell',
  'ribbon',
  'marble',
] as const;
export type Charm = (typeof CHARMS)[number];

type Draw = (p: Pixels, pal: Pal) => void;

const DRAW: Record<Charm, Draw> = {
  horseshoe(p, { c, r }) {
    const s = r('stone');
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const d = Math.hypot(x + 0.5 - 10, y + 0.5 - 10.5);
        if (d < 4.2 || d > 8 || (y < 9 && Math.abs(x - 10) < 3.5)) continue;
        p.set(x, y, d < 5.4 ? s[1] : d > 6.8 ? s[2] : s[3]);
      }
    p.rect(3, 4, 4, 5, s[3]).rect(13, 4, 4, 5, s[3]).rect(3, 4, 4, 1, s[4]).rect(13, 4, 4, 1, s[4]);
    for (const [x, y] of [
      [4, 6],
      [15, 6],
      [5, 12],
      [14, 12],
      [7, 15],
      [12, 15],
    ])
      p.set(x, y, c('ink', 0));
    p.set(6, 11, s[4]).set(7, 14, s[4]);
  },
  clover(p, { c, r }) {
    const g = r('green');
    for (const [x, y] of [
      [7, 6],
      [13, 6],
      [7, 12],
      [13, 12],
    ])
      blob(p, x, y, 4.2, 4.2, g, 0, 4);
    p.line(10, 12, 13, 18, g[1]).line(11, 12, 14, 18, g[1]);
    for (const [x, y] of [
      [7, 6],
      [13, 6],
      [7, 12],
      [13, 12],
    ])
      p.line(x, y, 10, 9, g[1]);
    p.set(9, 9, c('green', 4)).set(10, 9, c('green', 3));
  },
  ladybug(p, { c, r }) {
    const red = r('red');
    blob(p, 10, 6, 4.2, 3.4, r('ink'), 0, 2);
    blob(p, 10, 12, 7.4, 6.2, red, 0, 4);
    p.rect(10, 7, 1, 11, c('ink', 0));
    for (const [x, y] of [
      [7, 10],
      [13, 10],
      [6, 14],
      [14, 14],
      [9, 16],
      [12, 16],
    ])
      p.disc(x, y, 1.1, c('ink', 0));
    p.set(8, 5, c('white', 3)).set(12, 5, c('white', 3));
    p.line(8, 3, 6, 1, c('ink', 1)).line(12, 3, 14, 1, c('ink', 1));
    p.set(7, 9, c('red', 4));
  },
  wishbone(p, { r }) {
    const w = r('parch');
    for (let y = 1; y < 19; y++)
      for (let x = 0; x < 20; x++) {
        const d = Math.hypot(x + 0.5 - 10, (y + 0.5 - 6) * 0.9);
        const inRing = d > 4.2 && d < 7.2 && y > 6;
        const stalk = y <= 7 && ((x >= 2 && x <= 4) || (x >= 15 && x <= 17));
        if (inRing || stalk) p.set(x, y, d > 6 ? w[2] : w[3]);
      }
    p.rect(8, 15, 4, 3, w[3]).rect(9, 17, 2, 2, w[2]);
    p.rect(2, 1, 3, 1, w[4]).rect(15, 1, 3, 1, w[4]);
  },
  acorn(p, { c, r }) {
    const nut = r('orange');
    const cap = r('wood');
    blob(p, 10, 12, 5.8, 6.8, nut, 0, 4);
    p.rect(9, 17, 2, 2, nut[1]);
    blob(p, 10, 7, 7.4, 4.6, cap, 0, 3);
    p.rect(2, 8, 16, 2, cap[1]);
    for (let x = 4; x < 17; x += 3) p.rect(x, 5, 1, 1, cap[3]).rect(x + 1, 7, 1, 1, cap[4]);
    p.rect(9, 1, 2, 3, cap[1]).rect(9, 1, 1, 2, c('wood', 3));
  },
  star(p, { c, r }) {
    const g = r('gold');
    const pts: [number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 ? 3.2 : 8;
      pts.push([13 + Math.cos(a) * rad, 9 + Math.sin(a) * rad]);
    }
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i];
          const [xj, yj] = pts[j];
          if (yi > y + 0.5 !== yj > y + 0.5 && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) p.set(x, y, x + y < 20 ? g[4] : g[3]);
      }
    p.line(0, 14, 7, 11, c('white', 3)).line(1, 17, 7, 13, c('gold', 5)).line(2, 10, 6, 9, c('white', 2));
    p.set(12, 8, c('white', 3));
  },
  sock(p, { c, r }) {
    const w = r('white');
    const k = r('pink');
    p.rect(4, 1, 8, 12, w[3]);
    p.rect(4, 12, 14, 6, w[3]);
    p.rect(11, 12, 7, 6, w[3]).disc(16, 15, 3.2, w[3]);
    p.rect(4, 1, 8, 3, k[3]).rect(4, 6, 8, 2, k[2]).rect(4, 10, 8, 2, k[3]);
    p.rect(14, 12, 4, 6, k[2]).rect(5, 17, 12, 1, w[1]);
    p.rect(4, 1, 1, 17, w[4]).rect(11, 3, 1, 9, w[2]);
    p.set(8, 2, c('white', 3));
  },
  dice(p, { c }) {
    const die = (x: number, y: number, pips: [number, number][]) => {
      p.rect(x, y, 9, 9, c('white', 3))
        .rect(x, y + 8, 9, 1, c('white', 1))
        .rect(x + 8, y, 1, 9, c('white', 1));
      p.frame(x, y, 9, 9, c('white', 0));
      for (const [px, py] of pips) p.rect(x + px, y + py, 2, 2, c('red', 2));
    };
    // a three and a four: seven
    die(1, 3, [
      [1, 1],
      [3, 3],
      [5, 5],
    ]);
    die(10, 8, [
      [1, 1],
      [5, 1],
      [1, 5],
      [5, 5],
    ]);
  },
  feather(p, { c, r }) {
    const t = r('teal');
    for (let i = 0; i < 17; i++) {
      const x = 3 + i;
      const y = 17 - i;
      p.rect(x - 1, y - 2, 4, 4, t[(i + 1) % 2 ? 3 : 2]);
    }
    for (let i = 0; i < 17; i++) p.set(3 + i, 17 - i, c('ink', 1));
    p.line(1, 19, 5, 15, c('ink', 1)).set(16, 3, c('teal', 4)).set(14, 4, c('teal', 4));
    for (let i = 3; i < 15; i += 3) p.line(3 + i, 17 - i, 8 + i, 18 - i, t[1]);
  },
  rainbow(p, { c }) {
    const bands = [c('red', 2), c('orange', 2), c('gold', 3), c('green', 2), c('blue', 2), c('purple', 2)];
    bands.forEach((col, i) => {
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const d = Math.hypot(x + 0.5 - 10, y + 0.5 - 17);
          if (y < 16 && d <= 9.5 - i * 1.15 && d > 8.4 - i * 1.15) p.set(x, y, col);
        }
    });
    p.disc(2, 16, 2.4, c('white', 3)).disc(5, 17, 2.2, c('white', 3)).disc(18, 16, 2.4, c('white', 3)).disc(15, 17, 2.2, c('white', 3));
  },
  bell(p, { c, r }) {
    const g = r('gold');
    blob(p, 10, 9, 6.6, 7, g, 0, 5);
    p.rect(3, 13, 14, 3, g[3]).rect(3, 13, 14, 1, g[4]).rect(3, 15, 14, 1, g[1]);
    p.disc(10, 17, 2, g[2]).set(10, 17, g[4]);
    p.rect(9, 1, 2, 3, g[2]);
    p.set(7, 7, c('white', 3)).set(7, 8, c('gold', 5));
  },
  ribbon(p, { r }) {
    const k = r('red');
    blob(p, 5, 7, 4.6, 4.6, k, 0, 4);
    blob(p, 15, 7, 4.6, 4.6, k, 0, 4);
    p.line(8, 9, 5, 18, k[3]).line(9, 9, 6, 18, k[3]).line(12, 9, 15, 18, k[3]).line(11, 9, 14, 18, k[3]);
    p.rect(8, 6, 4, 5, k[2]).rect(8, 6, 4, 1, k[4]);
    p.rect(4, 17, 3, 2, k[1]).rect(13, 17, 3, 2, k[1]);
  },
  marble(p, { c, r }) {
    const b = r('blue');
    blob(p, 10, 10, 8, 8, b, 0, 4);
    p.ring(10, 10, 5, c('white', 2)).ring(10, 10, 3, c('teal', 3));
    p.line(5, 8, 9, 5, c('white', 3)).line(10, 15, 14, 13, c('gold', 4));
    p.set(7, 6, c('white', 3)).set(6, 7, c('white', 3));
  },
};

/** A charm's picture: 20x20 on the sky color, outlined. */
export function charmPicture(pal: Pal, name: Charm): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  DRAW[name](p, pal);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** A charm's picture with its sky made clear (255), to stand in a scene. */
export function charmSprite(pal: Pal, name: Charm): Pixels {
  const sky = skyOf(pal);
  return charmPicture(pal, name).map((_x, _y, col) => (col === sky ? 255 : col));
}
