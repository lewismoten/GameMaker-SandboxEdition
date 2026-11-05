// The pictures of a graduation's outside arrival (graduationArrive.ts): the campus path, trees, banners on
// poles and the front of the hall, then the nods' own pictures (graduationNods.ts draws with these helpers).
// Every block is 20 x 20 on the sky color, so the signs and scenery sit flush like the Starters'.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Book, PULL, SOLID } from './book';
import { skyOf, type Pal } from './palette';

const air = { grav: PULL.down };

/** A fresh block of sky. */
export const skyBlock = (pal: Pal): Pixels => new Pixels(20, 20, skyOf(pal));

/** The path: paving stones, solid. */
function paving(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('parch', 2));
  p.rect(0, 0, 20, 1, c('parch', 3)).rect(0, 9, 20, 1, c('parch', 1)).rect(0, 19, 20, 1, c('parch', 1));
  p.rect(5, 1, 1, 8, c('parch', 1)).rect(14, 10, 1, 9, c('parch', 1));
  p.set(11, 4, c('parch', 3)).set(2, 14, c('parch', 3)).set(17, 5, c('parch', 1)).set(9, 15, c('parch', 1));
  return p;
}

/** A round tree in three blocks: the top and the bottom of the leaves, and the trunk. */
function tree(pal: Pal): Pixels[] {
  const { c, r } = pal;
  const g = r('grass');
  const big = new Pixels(20, 40, skyOf(pal));
  big.disc(10, 20, 9.6, c('ink', 0)).disc(10, 20, 8.6, g[2]);
  big.disc(7, 15, 3.4, g[3]).disc(6, 14, 1.6, g[4]).disc(13, 24, 3, g[1]).disc(14, 17, 2, g[3]);
  big.rect(6, 22, 3, 1, g[1]).rect(12, 12, 2, 1, g[4]);
  const trunk = skyBlock(pal);
  const w = r('wood');
  trunk.rect(7, 0, 6, 20, c('ink', 0)).rect(8, 0, 4, 20, w[2]).rect(8, 0, 1, 20, w[4]).rect(11, 0, 1, 20, w[1]);
  trunk.rect(5, 17, 10, 3, w[2]).rect(5, 17, 10, 1, c('ink', 0)).rect(5, 19, 10, 1, w[1]);
  return [big.crop(0, 0, 20, 20), big.crop(0, 20, 20, 20), trunk];
}

/** A pole with a pennant at its top, and the pole alone. */
function pole(pal: Pal, flag: boolean, hue: string): Pixels {
  const { c, r } = pal;
  const p = skyBlock(pal);
  const w = r('wood');
  p.rect(8, 0, 4, 20, c('ink', 0)).rect(9, 0, 2, 20, w[3]).rect(9, 0, 1, 20, w[4]);
  if (flag) {
    const f = r(hue);
    p.rect(11, 1, 8, 7, c('ink', 0)).rect(11, 2, 7, 5, f[3]).rect(11, 2, 7, 1, f[4]).rect(11, 6, 7, 1, f[1]);
    p.rect(8, 0, 4, 2, c('gold', 4));
  }
  return p;
}

/** The hall's front: stone wall, a window, a column, the gold cornice and the purple roof. */
function hallPieces(pal: Pal): Record<string, Pixels> {
  const { c, r } = pal;
  const s = r('stone');
  const wall = (): Pixels => {
    const p = new Pixels(20, 20, s[2]);
    for (const y of [4, 9, 14, 19]) p.rect(0, y, 20, 1, s[1]);
    for (const [x, y] of [
      [6, 0],
      [14, 5],
      [4, 10],
      [12, 15],
    ] as const)
      p.rect(x, y, 1, 4, s[1]);
    p.rect(0, 0, 20, 1, s[3]);
    return p;
  };
  const window = wall();
  window
    .rect(5, 3, 10, 15, c('gold', 1))
    .rect(6, 4, 8, 13, c('gold', 4))
    .disc(10, 6, 4, c('gold', 4))
    .rect(6, 10, 8, 1, c('gold', 2))
    .rect(9, 4, 2, 13, c('gold', 2));
  window.rect(4, 17, 12, 2, s[4]);
  const column = wall();
  column.rect(3, 0, 14, 20, s[3]).rect(3, 0, 2, 20, s[4]).rect(14, 0, 3, 20, s[1]).rect(7, 0, 1, 20, s[4]);
  const cornice = new Pixels(20, 20, s[2]);
  cornice.rect(0, 0, 20, 8, c('gold', 3)).rect(0, 0, 20, 2, c('gold', 5)).rect(0, 7, 20, 1, c('gold', 1));
  for (let x = 1; x < 20; x += 4) cornice.rect(x, 8, 2, 4, s[4]);
  cornice.rect(0, 12, 20, 8, s[2]).rect(0, 12, 20, 1, s[1]);
  const roof = new Pixels(20, 20, c('purple', 2));
  roof.rect(0, 0, 20, 3, c('purple', 3)).rect(0, 3, 20, 1, c('purple', 4)).rect(0, 12, 20, 1, c('purple', 1)).rect(0, 17, 20, 3, c('purple', 1));
  for (let x = 0; x < 20; x += 4) roof.rect(x, 4, 1, 8, c('purple', 1));
  return { hallWall: wall(), hallWindow: window, hallColumn: column, hallCornice: cornice, hallRoof: roof };
}

/** `door` with its sky shown through as `wall` (the exit door set into the hall's front). */
export const inWall = (pal: Pal, door: Pixels, wall: Pixels): Pixels => door.map((x, y, v) => (v === skyOf(pal) ? wall.get(x, y) : v));

/** Adds the campus scenery to `book` (after the Starter set). */
export function addCampusBlocks(book: Book, pal: Pal): void {
  book.add('paving', paving(pal), { solid: SOLID });
  const [top, low, trunk] = tree(pal);
  book.add('treeTop', top, air);
  book.add('treeLow', low, air);
  book.add('trunk', trunk, air);
  book.add('poleTop', pole(pal, true, 'red'), air);
  book.add('poleTop2', pole(pal, true, 'blue'), air);
  book.add('pole', pole(pal, false, 'red'), air);
  const hall = hallPieces(pal);
  for (const [name, pic] of Object.entries(hall)) book.add(name, pic, air);
  book.add('hallDoorTop', inWall(pal, book.pics.get('doorTop')!, hall.hallWall), air);
  book.add('hallDoorBottom', inWall(pal, book.pics.get('doorBottom')!, hall.hallWall), air);
}

/** Two digits-high text, 2x, in `ink` on `bg`, centered in a block (for the countdown's numbers). */
export function bigDigit(ch: string, bg: number, ink: number): Pixels {
  const p = new Pixels(20, 20, bg);
  const g = FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (g[y] & (1 << x)) p.rect(2 + x * 2, 2 + y * 2, 2, 2, ink);
  return p;
}

/** Text in the 8x8 font at 1x, centered on a block of `bg` `w` pixels wide. */
export function smallText(w: number, text: string, bg: number, ink: number, edge?: number): Pixels {
  const p = new Pixels(w, 20, bg);
  const x0 = Math.floor((w - text.length * 8) / 2);
  [...text].forEach((ch, i) => {
    const g = FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8);
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++)
        if (g[y] & (1 << x)) {
          if (edge !== undefined)
            for (const [dx, dy] of [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ] as const)
              p.set(x0 + i * 8 + x + dx, 6 + y + dy, edge);
          p.set(x0 + i * 8 + x, 6 + y, ink);
        }
  });
  return p;
}
