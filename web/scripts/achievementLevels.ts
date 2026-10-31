// Badges of the leveled achievements that are cut from a game's block (games played, games finished, walkthroughs
// watched): the base block under a 2px plate frame in bronze, silver or gold, and one pip per level on a dark strip
// in the lower left, so levels differ by shape (the pip count) and by lightness as well as by color. The last level
// is gold. Colors from every base block and the plates are gathered into one palette (6-bit, like the games').
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

export interface LevelBase {
  family: string;
  /** Goals of the levels, lowest first (ids are `${family}-${goal}`). */
  goals: readonly number[];
  pic: Pixels;
  /** The pic's palette: 6-bit RGB, 3 bytes an entry. */
  palette: Uint8Array;
}

type Rgb = [number, number, number];
const hex = (v: number): Rgb => [(v >> 16) & 255, (v >> 8) & 255, v & 255];
/** Plate and edge of the first, middle and last level of a family; one or two levels use the ends. */
const BRONZE = { plate: hex(0xc8803c), edge: hex(0x5a3010) };
const SILVER = { plate: hex(0xe8ecf0), edge: hex(0x76808a) };
const GOLD = { plate: hex(0xf0b000), edge: hex(0x6e4a00) };
const INK = hex(0x101018);
const PIP = hex(0xffffff);

/** Level n of `of` (1-based): the last is gold, the first bronze, any between silver. */
export const plateOf = (n: number, of: number) => (n >= of ? GOLD : n === 1 ? BRONZE : SILVER);

/** Draws the plate and pips over `art` (RGB triples per pixel, 20x20) for level n of `of`. */
export function plated(art: Rgb[], n: number, of: number): Rgb[] {
  const out = art.map((c) => [...c] as Rgb);
  const { plate, edge } = plateOf(n, of);
  const set = (x: number, y: number, c: Rgb) => (out[y * 20 + x] = c);
  for (let i = 0; i < 20; i++)
    for (const [x, y] of [
      [i, 0],
      [i, 19],
      [0, i],
      [19, i],
    ])
      set(x, y, edge);
  for (let i = 1; i < 19; i++)
    for (const [x, y] of [
      [i, 1],
      [i, 18],
      [1, i],
      [18, i],
    ])
      set(x, y, plate);
  for (const [x, y] of [
    [0, 0],
    [19, 0],
    [0, 19],
    [19, 19],
  ])
    set(x, y, INK);
  // a dark strip with one pip a level
  for (let y = 14; y < 18; y++) for (let x = 2; x <= 2 + 3 * n; x++) set(x, y, INK);
  for (let i = 0; i < n; i++)
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ])
      set(3 + 3 * i + dx, 15 + dy, PIP);
  return out;
}

/** Name `${family}-${goal}` -> picture, and the shared palette. */
export function levelSource(bases: readonly LevelBase[]): { blocks: Map<string, Pixels>; palette: Uint8Array } {
  const colors: Rgb[] = [];
  const index = (c: Rgb): number => {
    let i = colors.findIndex((k) => k[0] === c[0] && k[1] === c[1] && k[2] === c[2]);
    if (i < 0) {
      if (colors.length >= 255) throw new Error('Too many colors in the level badges');
      i = colors.push(c) - 1;
    }
    return i;
  };
  const blocks = new Map<string, Pixels>();
  for (const b of bases)
    b.goals.forEach((goal, i) => {
      const rgb = Array.from(b.pic.px, (v): Rgb => [
        (b.palette[v * 3] << 2) | (b.palette[v * 3] >> 4),
        (b.palette[v * 3 + 1] << 2) | (b.palette[v * 3 + 1] >> 4),
        (b.palette[v * 3 + 2] << 2) | (b.palette[v * 3 + 2] >> 4),
      ]);
      const p = new Pixels(20, 20, 0);
      plated(rgb, i + 1, b.goals.length).forEach((c, k) => (p.px[k] = index(c)));
      blocks.set(`${b.family}-${goal}`, p);
    });
  const palette = new Uint8Array(768);
  colors.forEach((c, i) => c.forEach((v, k) => (palette[i * 3 + k] = v >> 2)));
  return { blocks, palette };
}
