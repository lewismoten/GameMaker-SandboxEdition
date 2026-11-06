// FLASH SAFE's pictures: the burr (a spiky seed ball) and the number it leaves, the warning lamp
// in its steps, the muted "not this" panels, and the storm sky and its bolt. Every picture here
// is drawn to be gentle: nothing is white-hot, nothing is a big saturated red, and the changes
// between a ring's pictures are small in light or small in size.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../kit/starter/palette';

const T = 255;

/** The burr: a chestnut husk, a brown ball with short uneven prickles. `turned` is the slightly rotated second frame. */
export function burr(pal: Pal, turned: boolean): Pixels {
  const { c, r } = pal;
  const w = r('wood');
  const p = new Pixels(20, 20, T);
  const ink = c('ink', 0);
  const n = 9;
  const reach = (i: number) => 8.4 + ((i * 5) % 3) * 0.5 - 0.5;
  for (let i = 0; i < n; i++) {
    const a = ((i + (turned ? 0.4 : 0)) / n) * Math.PI * 2 + 0.3;
    p.line(
      Math.round(9.5 + Math.cos(a) * 5),
      Math.round(9.5 + Math.sin(a) * 5),
      Math.round(9.5 + Math.cos(a) * reach(i)),
      Math.round(9.5 + Math.sin(a) * reach(i)),
      ink,
    );
  }
  p.disc(9.5, 9.5, 6.4, ink);
  p.disc(9.5, 9.5, 5.4, w[2]);
  p.disc(8, 8, 3, w[3]);
  p.set(6, 6, w[4]).set(7, 6, w[4]);
  for (let i = 0; i < n; i++) {
    const a = ((i + (turned ? 0.4 : 0)) / n) * Math.PI * 2 + 0.3;
    p.set(Math.round(9.5 + Math.cos(a) * 7), Math.round(9.5 + Math.sin(a) * 7), c('gold', 3));
  }
  return p;
}

/** The number "-5": gold with an ink outline, one picture that holds still (a number that rises, never one that blinks). */
export function minusFive(pal: Pal): Pixels {
  const ink = pal.c('ink', 0);
  const fill = pal.c('gold', 5);
  const flat = new Pixels(20, 20, T);
  const rows: Record<string, string[]> = {
    '-': ['.....', '.....', '.....', '.###.', '.....', '.....', '.....'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  };
  flat.draw(1, 6, rows['-'], { '#': fill }).draw(10, 6, rows['5'], { '#': fill });
  const p = new Pixels(20, 20, T);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++)
      if (flat.get(x, y) === T && [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => flat.get(x + dx, y + dy) === fill))) p.set(x, y, ink);
  return p.blit(flat, 0, 0, T);
}

/** A mock of a screen, muted on purpose (never white-hot or a hot red), crossed by the "no" slash: a still picture of the wrong way, `w` by `h` pixels. */
export function nope(pal: Pal, kind: 'white' | 'red', w: number, h: number): Pixels {
  const { c, r } = pal;
  const p = new Pixels(w, h, skyOf(pal));
  const frame = r('wood');
  p.rect(0, 0, w, h, frame[2])
    .rect(0, 0, w, 1, frame[4])
    .rect(0, h - 1, w, 1, frame[0]);
  const fill = kind === 'white' ? c('stone', 2) : c('brick', 1);
  const bolt = kind === 'white' ? c('stone', 4) : c('brick', 3);
  p.rect(3, 3, w - 6, h - 6, fill);
  // a zigzag of light across the mock screen
  const mx = w / 2;
  const pts: [number, number][] = [
    [mx + 4, 5],
    [mx - 5, h * 0.45],
    [mx + 3, h * 0.5],
    [mx - 6, h - 6],
  ];
  for (let i = 0; i + 1 < pts.length; i++) {
    p.line(Math.round(pts[i][0]), Math.round(pts[i][1]), Math.round(pts[i + 1][0]), Math.round(pts[i + 1][1]), bolt);
    p.line(Math.round(pts[i][0]) + 1, Math.round(pts[i][1]), Math.round(pts[i + 1][0]) + 1, Math.round(pts[i + 1][1]), bolt);
  }
  // the "no" ring and slash, in ink so it reads on both
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const rad = Math.min(w, h) / 2 - 4;
  for (const k of [0, 1]) p.ring(cx, cy, rad - k, c('ink', 0));
  for (let k = -1; k <= 1; k++)
    p.line(Math.round(cx - rad * 0.7), Math.round(cy - rad * 0.7) + k, Math.round(cx + rad * 0.7), Math.round(cy + rad * 0.7) + k, c('ink', 0));
  return p;
}

/** The post of a lamp (two blocks tall, drawn as one 20x40 picture): [upper, lower]. */
export function lampPost(pal: Pal): [Pixels, Pixels] {
  const { r } = pal;
  const s = r('stone');
  const p = new Pixels(20, 40, skyOf(pal));
  p.rect(8, 0, 4, 40, s[2]).rect(8, 0, 1, 40, s[3]).rect(11, 0, 1, 40, s[1]);
  p.rect(5, 36, 10, 4, s[2]).rect(5, 36, 10, 1, s[3]);
  return [p.crop(0, 0, 20, 20), p.crop(0, 20, 20, 20)];
}

/** The lamp: a small amber glass in an iron cage on top of its post. `level` 0 is dark, 3 is lit (all of them amber, never red or white). */
export function lamp(pal: Pal, level: number): Pixels {
  const { c, r } = pal;
  const s = r('stone');
  const p = new Pixels(20, 20, skyOf(pal));
  p.rect(8, 14, 4, 6, s[2]).rect(8, 14, 1, 6, s[3]);
  // cage: base, cap and bars
  p.rect(4, 12, 12, 3, s[1]).rect(4, 12, 12, 1, s[2]);
  p.rect(4, 3, 12, 2, s[1]).rect(6, 1, 8, 2, s[2]);
  const glass = [c('ink', 1), c('gold', 0), c('gold', 2), c('gold', 4)][Math.max(0, Math.min(3, level))];
  p.rect(5, 5, 10, 7, glass);
  if (level >= 2) p.rect(7, 6, 3, 2, c('gold', 5));
  p.rect(4, 5, 1, 7, s[1]).rect(15, 5, 1, 7, s[1]).rect(9, 5, 1, 7, s[1]).rect(10, 5, 1, 7, s[1]);
  return p;
}

/** The storm sky's three light levels (a deep blue-gray, then two small lifts): the extra palette ramp `storm`. */
export const STORM = 'storm';

/** A picture of a block whose sky color `from` is swapped for `to` (the same block on the storm sky). */
export function onSky(pic: Pixels, from: number, to: number): Pixels {
  const q = pic.crop(0, 0, pic.w, pic.h);
  return q.map((_x, _y, col) => (col === from ? to : col));
}

/** One piece of the lightning bolt: a 20x60 column cut into three blocks, on a sky of color `sky`; `lit` draws the bolt (small, pale gold, held still). */
export function bolt(pal: Pal, sky: number, lit: boolean): [Pixels, Pixels, Pixels] {
  const { c } = pal;
  const p = new Pixels(20, 60, sky);
  if (lit) {
    const pts: [number, number][] = [
      [13, 0],
      [8, 18],
      [13, 23],
      [6, 42],
      [10, 46],
      [5, 60],
    ];
    const col = c('gold', 4);
    for (let i = 0; i + 1 < pts.length; i++) {
      p.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col);
      p.line(pts[i][0] + 1, pts[i][1], pts[i + 1][0] + 1, pts[i + 1][1], col);
    }
  }
  return [p.crop(0, 0, 20, 20), p.crop(0, 20, 20, 20), p.crop(0, 40, 20, 20)];
}
