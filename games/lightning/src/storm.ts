// LIGHTNING's storm, all of it block art: there is no flash or lighting in Game-Maker, so a flash is a picture change.
// Every block that shows sky has a twin drawn on a lighter sky ("sky" and "sky.lit", "cloud.0" and "cloud.0.lit" ...);
// each turns into its twin after DARK ticks and back after LIT ticks. They all keep the same times, so they all change
// in the same tick and the whole sky flashes at once. The bolt is five more blocks that look like sky until the flash,
// when they show the bolt. One flash every 120 ticks (about 6.6 seconds), lit for 3 (a sixth of a second), and lit to a
// gray-blue, not white: a flash this gentle and this rare is well under three flashes a second (flashCheck measures it).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';

/** A block that turns into another after some ticks (the engine's only clock). */
export interface Timed {
  name: string;
  next: string;
  ticks: number;
}

/** Ticks the sky stays dark, then lit. Together they are one flash's round: 120 ticks, the length of 16 beats of the song. */
export const DARK = 117;
export const LIT = 3;
export const ROUND = DARK + LIT;
/** How many blocks tall the bolt is. */
export const BOLT = 5;

/** The palette: the Starter colors with a storm-night sky, darker grass and earth, and a `flash` ramp for the lit sky. */
export function stormPalette(): Pal {
  const pal = buildStarterPalette((b) => {
    b.ramp('flash', 4, [84, 96, 146], [214, 222, 250]);
  }, 'lightning');
  const set = (name: string, i: number, rgb: readonly number[]) => {
    const at = pal.c(name, i) * 3;
    for (let k = 0; k < 3; k++) pal.pal[at + k] = rgb[k] >> 2; // the palette holds 6 bits a color
  };
  [
    [10, 12, 30],
    [14, 18, 40],
    [18, 22, 50],
    [22, 26, 58],
    [40, 46, 80],
    [62, 70, 104],
  ].forEach((rgb, i) => set('sky', i, rgb));
  for (const ramp of ['grass', 'dirt'] as const)
    for (let i = 0; i < 6; i++) {
      const at = pal.c(ramp, i) * 3;
      for (let k = 0; k < 3; k++) pal.pal[at + k] = Math.round(pal.pal[at + k] * 0.5);
    }
  return pal;
}

/** The color the sky turns in the flash. */
export const litSkyOf = (pal: Pal): number => pal.c('flash', 0);

/** A storm cloud `w` blocks wide, as blocks `cloud<w>.0` ...; dark gray puffs with a paler rim. */
export function addCloud(book: Book, pal: Pal, w: 2 | 3): string[] {
  const { c } = pal;
  const p = new Pixels(w * 20, 20, skyOf(pal));
  const puffs =
    w === 2
      ? [
          [10, 12, 7],
          [21, 9, 9],
          [31, 13, 6],
        ]
      : [
          [10, 13, 7],
          [22, 9, 9],
          [36, 10, 8],
          [49, 13, 7],
        ];
  for (const [x, y, r] of puffs) p.disc(x, y, r + 1, c('sky', 5));
  for (const [x, y, r] of puffs) p.disc(x, y + 1, r, c('sky', 4));
  p.rect(4, 15, w * 20 - 8, 3, c('sky', 4));
  return [...Array(w).keys()].map((i) => {
    const name = `cloud${w}.${i}`;
    book.add(name, p.crop(i * 20, 0, 20, 20), { grav: PULL.down });
    return name;
  });
}

/** A round hill 4 blocks wide and 2 high in the distance (`hill.<col><row>`), the hero walks in front of it. */
export function addHill(book: Book, pal: Pal): string[][] {
  const { c } = pal;
  const p = new Pixels(80, 40, skyOf(pal));
  for (let x = 0; x < 80; x++) {
    const t = (x - 39.5) / 40;
    const top = Math.round(39 - 38 * Math.sqrt(Math.max(0, 1 - t * t)));
    p.rect(x, top, 1, 40 - top, c('sky', 1));
  }
  const names: string[][] = [[], []];
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 4; col++) {
      const name = `hill.${col}${row}`;
      book.add(name, p.crop(col * 20, row * 20, 20, 20), { grav: PULL.down });
      names[row].push(name);
    }
  return names;
}

/** The bolt's path through its column, top to bottom: x at each 10 pixels down (it ends on the ground, beside the hill). */
const PATH = [9, 12, 7, 11, 14, 9, 6, 10, 13, 9, 11];

/** The bolt as one picture BOLT blocks tall, on the lit sky: a pale core with a soft blue glow. */
export function boltPicture(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, BOLT * 20, litSkyOf(pal));
  const pts = PATH.map((x, i) => [x, Math.min(BOLT * 20 - 1, i * 10)] as const);
  for (let i = 1; i < pts.length; i++) {
    const [[x0, y0], [x1, y1]] = [pts[i - 1], pts[i]];
    for (const dx of [-2, -1, 1, 2]) p.line(x0 + dx, y0, x1 + dx, y1, c('flash', 1));
  }
  for (let i = 1; i < pts.length; i++) {
    const [[x0, y0], [x1, y1]] = [pts[i - 1], pts[i]];
    p.line(x0, y0, x1, y1, c('flash', 3)).line(x0 + 1, y0, x1 + 1, y1, c('flash', 2));
  }
  return p;
}

/** The bolt's blocks `bolt.0` (top) to `bolt.4`: each looks like the dark sky, and its twin `bolt.<n>.lit` shows the bolt. */
export function addBolt(book: Book, timed: Timed[], pal: Pal): string[] {
  const pic = boltPicture(pal);
  return [...Array(BOLT).keys()].map((i) => {
    const name = `bolt.${i}`;
    book.add(name, new Pixels(20, 20, skyOf(pal)), { grav: PULL.down });
    book.add(`${name}.lit`, pic.crop(0, i * 20, 20, 20), { grav: PULL.down });
    timed.push({ name, next: `${name}.lit`, ticks: DARK }, { name: `${name}.lit`, next: name, ticks: LIT });
    return name;
  });
}

/** A stepping stone (level 2), solid, dim gray on the dark; its twin `stone.lit` is the same stone, lit by the flash. */
export function addStone(book: Book, timed: Timed[], pal: Pal): void {
  const { c } = pal;
  const draw = (lit: boolean) => {
    const ramp = lit ? [c('sky', 2), c('flash', 2), c('flash', 3)] : [c('stone', 0), c('stone', 1), c('stone', 2)];
    const p = new Pixels(20, 20, lit ? litSkyOf(pal) : skyOf(pal));
    p.rect(1, 2, 18, 12, ramp[1]).rect(2, 1, 16, 1, ramp[1]).rect(2, 3, 15, 3, ramp[2]).rect(1, 12, 18, 2, ramp[0]);
    p.rect(5, 6, 3, 1, ramp[0]).rect(12, 9, 4, 1, ramp[0]);
    return p;
  };
  book.add('stone', draw(false), { solid: SOLID });
  book.add('stone.lit', draw(true), { solid: SOLID });
  timed.push({ name: 'stone', next: 'stone.lit', ticks: DARK }, { name: 'stone.lit', next: 'stone', ticks: LIT });
}

/**
 * Gives every block in `names` that shows any sky a lit twin, `<name>.lit`: the same picture and the same rules, with the
 * sky (and a storm cloud's grays) painted in the flash's colors. Each turns into its twin after DARK ticks and back after LIT.
 */
export function addLitTwins(book: Book, timed: Timed[], pal: Pal, names: Iterable<string>): void {
  const { c } = pal;
  const swap = new Map([
    [skyOf(pal), litSkyOf(pal)],
    [c('sky', 4), c('flash', 1)],
    [c('sky', 5), c('flash', 2)],
  ]);
  for (const name of names) {
    if (name.endsWith('.lit') || book.has(`${name}.lit`)) continue;
    const pic = book.pics.get(name)!;
    if (!pic.px.includes(skyOf(pal))) continue;
    book.add(
      `${name}.lit`,
      pic.crop(0, 0, 20, 20).map((_x, _y, k) => swap.get(k) ?? k),
      book.rulesOf(name),
    );
    timed.push({ name, next: `${name}.lit`, ticks: DARK }, { name: `${name}.lit`, next: name, ticks: LIT });
  }
}

/** A level's finished blocks: the book's, with each timed block given its next block and its ticks. */
export function finishBlocks(l: { book: Book; timed: Timed[] }) {
  const blocks = l.book.finish();
  for (const t of l.timed) {
    const b = blocks[l.book.n(t.name)];
    b.nextBl = l.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}
