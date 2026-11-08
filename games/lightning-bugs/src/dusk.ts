// The meadow at dusk: the palette's day sky made a dusk sky, and the blocks that draw it. A block is one color of sky, so a sky
// that fades from deep blue at the top to dusky rose at the horizon is six sky blocks laid in bands, one band a row, each with
// its top pixel rows mixed with the band above so the join is soft. A dark line of trees stands on the horizon, and anything
// drawn on the Starters' plain sky (a sign, a door, a tuft of grass) gets a twin with the band or the trees behind it, so
// nothing shows a square of the wrong sky.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';

/** The row the meadow's grass is on, in both levels; the hero walks on the row above it. */
export const GROUND = 9;
/** How tall a level is: three rows of dark earth under the grass fill the bottom of the screen. */
export const HEIGHT = 13;

/** The six sky colors, top to horizon (8-bit RGB), and the sky shade each is put in. Shade 3 is the horizon, the color every sign and door is drawn on. */
const BANDS: { shade: number; rgb: [number, number, number] }[] = [
  { shade: 0, rgb: [12, 12, 40] },
  { shade: 1, rgb: [24, 20, 62] },
  { shade: 2, rgb: [42, 30, 84] },
  { shade: 4, rgb: [68, 42, 100] },
  { shade: 5, rgb: [102, 58, 108] },
  { shade: 3, rgb: [138, 80, 106] },
];
/** The level row each band is on (the top band also fills every row above it). */
const BAND_ROW = [3, 4, 5, 6, 7, 8];

/** The dusk palette: the Starters' palette with the sky ramp made dusk, the grass and dirt darkened, and two ramps of this game's own: the fireflies' glow and the far trees. */
export function duskPalette(): Pal {
  const pal = buildStarterPalette((b) => {
    b.ramp('glow', 5, [36, 56, 14], [240, 255, 150], [170, 220, 48]);
    b.ramp('far', 2, [20, 16, 40], [40, 28, 66]);
  }, 'lightning-bugs');
  const set = (name: string, i: number, rgb: [number, number, number]) => {
    const at = pal.c(name, i) * 3;
    for (let k = 0; k < 3; k++) pal.pal[at + k] = rgb[k] >> 2; // the palette holds 6 bits a color
  };
  for (const b of BANDS) set('sky', b.shade, b.rgb);
  for (const [ramp, keep] of [
    ['grass', 0.5],
    ['dirt', 0.3],
  ] as const) {
    for (let i = 0; i < pal.r(ramp).length; i++) {
      const at = pal.c(ramp, i) * 3;
      for (let k = 0; k < 3; k++) pal.pal[at + k] = Math.round(pal.pal[at + k] * keep);
    }
  }
  return pal;
}

/** The name of the sky block of a level row: band0 at the top (and above), down to `horizon` on the hero's row. */
export function bandOf(row: number): string {
  const i = BAND_ROW.findIndex((r) => r >= row);
  return i < 0 || i === BAND_ROW.length - 1 ? 'horizon' : `band${i}`;
}

/** The sky color of band i. */
const bandColor = (pal: Pal, i: number): number => pal.c('sky', BANDS[i].shade);

/** One band's block: its color, with the top four pixel rows mixed with the band above (a checkerboard, then every fourth pixel). */
function bandPicture(pal: Pal, i: number): Pixels {
  const p = new Pixels(20, 20, bandColor(pal, i));
  if (i === 0) return p;
  const above = bandColor(pal, i - 1);
  return p.map((x, y, c) => ((y < 2 && (x + y) % 2 === 0) || (y >= 2 && y < 4 && x % 2 === 0 && y % 2 === 0) ? above : c));
}

/** How many pictures the two darkest bands have: the same sky with the first faint stars in different places, laid in turn so they make no grid. */
export const STARRY = 3;

/** A few faint stars on a band's picture (the first ones out at dusk), at places picked by `seed`. */
function stars(pal: Pal, p: Pixels, band: number, seed: number): Pixels {
  const rand = rng(seed * 7919 + 13);
  const n = band === 0 ? [2, 1, 0][seed % 3] : [0, 1, 0][seed % 3];
  for (let i = 0; i < n; i++) {
    const x = 1 + Math.floor(rand() * 18);
    const y = 5 + Math.floor(rand() * 14);
    p.set(x, y, band === 0 && i === 0 ? pal.c('white', 1) : pal.c('stone', 2));
  }
  return p;
}

/** The sky's band blocks: band0 and band1 in STARRY pictures each (`band0`, `band0.1`, `band0.2`), band2 to band4, then `horizon` (the Starters' sky color, which signs and doors are drawn on, with the same soft top). */
export function addBands(book: Book, pal: Pal): void {
  for (let i = 0; i < BANDS.length - 1; i++) {
    book.add(`band${i}`, i < 2 ? stars(pal, bandPicture(pal, i), i, 60 + i * 10) : bandPicture(pal, i), { grav: PULL.down });
    if (i < 2) for (let v = 1; v < STARRY; v++) book.add(`band${i}.${v}`, stars(pal, bandPicture(pal, i), i, 60 + i * 10 + v), { grav: PULL.down });
  }
  book.add('horizon', bandPicture(pal, BANDS.length - 1), { grav: PULL.down });
}

/** The sky block for level (x, y): its row's band, the starry ones taking turns along the row. */
export function skyAt(x: number, y: number): string {
  const band = bandOf(y);
  const v = (((x * 7 + y * 3) % STARRY) + STARRY) % STARRY;
  return (band === 'band0' || band === 'band1') && v > 0 ? `${band}.${v}` : band;
}

/** How many blocks wide the tree line's picture is before it repeats. */
export const TREES_WIDE = 8;
/** The rows the tree line covers: its tallest crowns reach row 6, its trunks stand on the grass. */
export const TREE_ROWS = [6, 7, 8] as const;

/** The tree line: far trees (dusky) and near trees (dark), round crowns and a few pointed ones, on the bands of rows 6 to 8. */
function treeLine(book: Book, pal: Pal): Pixels {
  const w = TREES_WIDE * 20;
  const h = TREE_ROWS.length * 20;
  const p = new Pixels(w, h);
  TREE_ROWS.forEach((row, k) => {
    for (let x = 0; x < w; x += 20) p.blit(book.pics.get(bandOf(row))!, x, k * 20);
  });
  const far = pal.c('far', 1);
  const near = pal.c('far', 0);
  const rand = rng(41);
  /** A round crown on a trunk, `top` pixels from the picture's top, drawn again a picture's width to each side so the line repeats without a seam. */
  const round = (cx: number, top: number, r: number, c: number) => {
    for (const dx of [-w, 0, w]) {
      p.disc(cx + dx, top + r, r, c);
      p.disc(cx + dx - r * 0.6, top + r * 1.5, r * 0.75, c);
      p.disc(cx + dx + r * 0.6, top + r * 1.4, r * 0.8, c);
      p.rect(cx + dx - 1, top + r * 2, 3, h - top - r * 2, c);
    }
  };
  /** A pointed tree, repeated the same way. */
  const pointed = (cx: number, top: number, c: number) => {
    for (const dx of [-w, 0, w])
      for (let y = top; y < h; y++) {
        const half = Math.min(9, Math.floor((y - top) / 2.4));
        p.rect(cx + dx - half, y, half * 2 + 1, 1, c);
      }
  };
  // the far trees: a low, even line, a little lighter than the near ones
  for (let x = 0; x < w; x += 9) round(x + Math.floor(rand() * 5), 26 + Math.floor(rand() * 8), 7 + Math.floor(rand() * 3), far);
  p.rect(0, 42, w, h - 42, far);
  // the near trees: a few big ones with sky between
  for (const [x, top, r] of [
    [14, 8, 11],
    [62, 16, 9],
    [128, 4, 12],
  ] as const)
    round(x, top, r, near);
  pointed(96, 10, near);
  pointed(36, 24, near);
  p.rect(0, 56, w, h - 56, near);
  return p;
}

/** The tree line's blocks, `trees.<column><row>` (row 0 is level row 6). */
export function addTrees(book: Book, pal: Pal): void {
  const p = treeLine(book, pal);
  for (let col = 0; col < TREES_WIDE; col++)
    for (let row = 0; row < TREE_ROWS.length; row++) book.add(`trees.${col}${row}`, p.crop(col * 20, row * 20, 20, 20), { grav: PULL.down });
}

/** The tree block at level (x, y), if the tree line covers that row. */
export function treeAt(x: number, y: number): string | undefined {
  const k = TREE_ROWS.indexOf(y as (typeof TREE_ROWS)[number]);
  return k < 0 ? undefined : `trees.${x % TREES_WIDE}${k}`;
}

/** The earth under the grass, three rows deep, darker the deeper (`turf0` to `turf2`): the dirt the grass block shows at its foot, fading into the dark. Solid like the dirt it stands for. */
export function addTurf(book: Book, pal: Pal): void {
  const d = pal.r('dirt');
  const ink = pal.c('ink', 0);
  for (let k = 0; k < 3; k++) {
    const base = [d[1], d[0], ink][k];
    const p = new Pixels(20, 20, base);
    const rand = rng(90 + k);
    // pebbles and roots, fewer the deeper
    for (let i = 0; i < 14 - k * 4; i++) {
      const x = Math.floor(rand() * 19);
      const y = Math.floor(rand() * 19);
      p.rect(x, y, 2, 1, [d[2], d[1], d[0]][k]).set(x, y + 1, [d[0], ink, d[0]][k]);
    }
    if (k < 2) p.map((x, y, c) => ((x + y) % 2 === 0 && y >= 16 ? [d[0], ink][k] : c)); // a dithered step into the darker row below
    book.add(`turf${k}`, p, { solid: SOLID });
  }
}

/** A tuft of tall dark grass for the hero's row, drawn on the Starters' plain sky (so it gets a twin like a sign). */
export function addTuft(book: Book, pal: Pal): void {
  const p = new Pixels(20, 20, skyOf(pal));
  const blade = pal.c('grass', 1);
  const rand = rng(7);
  for (let i = 0; i < 9; i++) {
    const x0 = 2 + Math.floor(rand() * 16);
    const tall = 7 + Math.floor(rand() * 9);
    const lean = rand() < 0.5 ? -1 : 1;
    for (let y = 0; y < tall; y++) p.set(Math.round(x0 + (lean * y * y) / (tall * 3)), 19 - y, blade);
  }
  book.add('tuft', p, { grav: PULL.down });
}

/**
 * The block to lay for `name`, a picture drawn on the Starters' plain sky, in front of block `behind` (a band, the horizon or a
 * piece of the tree line): a twin, made once and kept, with what is behind in its sky pixels. Twins are named `name@behind`.
 */
export function onSky(book: Book, pal: Pal, name: string, behind: string, from: Book = book): string {
  const laid = laidOn.get(book) ?? new Map<string, string>();
  laidOn.set(book, laid);
  // a picture only `from` has (a sign's piece) is laid under its own name the first time; the same piece on another sky is a twin
  const own = from !== book && (!book.has(name) || laid.get(name) === behind);
  const out = own ? name : `${name}@${behind}`;
  if (!book.has(out)) {
    book.add(out, new Pixels(20, 20).blit(book.pics.get(behind)!, 0, 0).blit(from.pics.get(name)!, 0, 0, skyOf(pal)), { grav: PULL.down });
    if (own) laid.set(name, behind);
  }
  return out;
}

/** For each book, what stands behind each picture laid under its own name. */
const laidOn = new WeakMap<Book, Map<string, string>>();
