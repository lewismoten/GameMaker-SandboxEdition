// The seven honors badges (Honors in each stage of the Starters, and The Sandbox Diploma): a cream certificate on a
// backdrop in the stage's own color, a red seal in the lower right with the stage's number (1 to 6) in white micro
// text and two ribbon tails under it, and one pip on the paper per stage, so the six differ by the digit, the pips and
// the backdrop's lightness as well as its hue. The diploma is
// a gold rolled scroll tied with a ribbon and a star seal. Drawn in code by Claude Sonnet 5.5; no game art is used.
import { micro } from '@lewismoten/gamemaker-sandbox-tools/kit/microText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

type Rgb = [number, number, number];
const hex = (v: number): Rgb => [(v >> 16) & 255, (v >> 8) & 255, v & 255];
const INK = hex(0x14101c);
const CREAM = hex(0xf6ecc8);
const CREAM_SHADE = hex(0xcdbf8e);
const LINE = hex(0x7a6e56);
const SEAL = hex(0xc22a2a);
const SEAL_EDGE = hex(0x6a1010);
const WHITE = hex(0xffffff);
const GOLD = hex(0xf0b000);
const GOLD_EDGE = hex(0x6e4a00);
/** Backdrop of stages 1 to 6: pale yellow, sky blue, orange, green, indigo, deep red-brown (spread in lightness too). */
const BACKDROPS: Rgb[] = [hex(0xf0f8a0), hex(0x98c8f8), hex(0xf09840), hex(0x2a9050), hex(0x4a3a98), hex(0x401010)];

function sheet(p: Pixels, c: (rgb: Rgb) => number, x: number, y: number, w: number, h: number): void {
  p.rect(x, y, w, h, c(CREAM)).frame(x, y, w, h, c(INK));
  p.rect(x + 1, y + h - 2, w - 2, 1, c(CREAM_SHADE));
  for (let i = 0; i < 2 && 2 + i * 2 < h - 4; i++) p.rect(x + 2, y + 2 + i * 2, Math.max(2, w - 5 - i * 2), 1, c(LINE));
}

/** Each stage's paper (x, y, w, h) and seal corner (x, y) differ, so the six differ by shape in gray as well as by color. */
const LAYOUT: { paper: [number, number, number, number]; seal: [number, number] }[] = [
  { paper: [3, 3, 12, 12], seal: [11, 11] },
  { paper: [2, 4, 15, 9], seal: [1, 12] },
  { paper: [5, 2, 9, 14], seal: [12, 12] },
  { paper: [2, 2, 10, 10], seal: [2, 12] },
  { paper: [7, 2, 10, 10], seal: [2, 11] },
  { paper: [3, 6, 14, 8], seal: [12, 1] },
];

const DISC7 = ['..###..', '.#####.', '#######', '#######', '#######', '.#####.', '..###..'];
const DISC5 = ['.###.', '#####', '#####', '#####', '.###.'];

function honor(n: number, c: (rgb: Rgb) => number): Pixels {
  const p = new Pixels(20, 20, c(BACKDROPS[n - 1]));
  const { paper, seal } = LAYOUT[n - 1];
  p.frame(0, 0, 20, 20, c(INK));
  sheet(p, c, ...paper);
  const [sx, sy] = seal;
  // two gold ribbon tails, then the seal over them
  const tailY = sy < 10 ? sy - 2 : sy + 5;
  for (const x of [sx + 1, sx + 4]) p.rect(x, Math.max(1, tailY), 2, 2, c(GOLD)).rect(x, Math.max(1, tailY) + (sy < 10 ? 0 : 1), 2, 1, c(GOLD_EDGE));
  p.draw(sx, sy, DISC7, { '#': c(SEAL_EDGE) }).draw(sx + 1, sy + 1, DISC5, { '#': c(SEAL) });
  micro(p, sx + 2, sy + 1, String(n), c(WHITE));
  // one pip on the paper for each stage, so the six differ by shape and not only by the digit
  const [px, py, , ph] = paper;
  for (let i = 0; i < n; i++) p.rect(px + 2 + 2 * (i % 3), py + ph - 4 + 2 * Math.floor(i / 3) - (n > 3 ? 2 : 0), 1, 1, c(INK));
  return p;
}

function diploma(c: (rgb: Rgb) => number): Pixels {
  const p = new Pixels(20, 20, c(GOLD));
  p.frame(0, 0, 20, 20, c(INK));
  p.frame(1, 1, 18, 18, c(GOLD_EDGE));
  // a scroll lying across: paper with a rolled end on each side, three lines of writing
  p.rect(5, 4, 10, 10, c(CREAM)).rect(5, 4, 10, 1, c(INK)).rect(5, 13, 10, 1, c(INK));
  for (const x of [3, 15])
    p.rect(x, 3, 2, 12, c(CREAM_SHADE))
      .rect(x, 3, 2, 1, c(INK))
      .rect(x, 14, 2, 1, c(INK))
      .rect(x + (x < 5 ? 0 : 1), 3, 1, 12, c(INK));
  for (let i = 0; i < 3; i++) p.rect(7, 6 + i * 2, i === 2 ? 4 : 6, 1, c(LINE));
  // a red ribbon bow tied under the scroll
  p.rect(7, 15, 3, 2, c(SEAL)).rect(10, 15, 3, 2, c(SEAL)).rect(9, 15, 2, 2, c(SEAL_EDGE));
  p.rect(7, 17, 2, 1, c(SEAL)).rect(11, 17, 2, 1, c(SEAL));
  return p;
}

/** Block names `honors-1` to `honors-6` and `honors-diploma`, with one shared palette (6-bit, 3 bytes an entry). */
export function honorSource(): { blocks: Map<string, Pixels>; palette: Uint8Array } {
  const colors: Rgb[] = [];
  const c = (rgb: Rgb): number => {
    let i = colors.findIndex((k) => k[0] === rgb[0] && k[1] === rgb[1] && k[2] === rgb[2]);
    if (i < 0) i = colors.push(rgb) - 1;
    return i;
  };
  const blocks = new Map<string, Pixels>();
  for (let n = 1; n <= 6; n++) blocks.set(`honors-${n}`, honor(n, c));
  blocks.set('honors-diploma', diploma(c));
  const palette = new Uint8Array(768);
  colors.forEach((rgb, i) => rgb.forEach((v, k) => (palette[i * 3 + k] = v >> 2)));
  return { blocks, palette };
}
