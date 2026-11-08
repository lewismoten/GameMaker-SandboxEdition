// UNDER THE HOOD's look and its own blocks, added to the Starter block set before the signs. The world is a
// hex dump: a dark green screen, rows of dim bytes behind, bright green ground.
//   hex0..hex7  background: two rows of two bytes each in a dim 3x5 font (air, like sky)
//   panel       a wall: a lit green slab, solid on all four sides
//   arch        the top of a doorway in a panel wall (passable)
//   b50 b6C b61 b79  the four bytes of "Play", highlighted as a hex editor marks a selection: the byte
//               above, its letter below. Touch one and counter 22 goes up by one.
//   playGate    a four-byte slot showing Play, dim: solid, a touch takes 4 off counter 22 and it opens
//   goPlate     the slot with G O and two spaces: 4 bytes, it fits, a bump opens it
//   startPlate  the slot with S T A R and the T left over: 5 bytes; a bump turns it into jamPlate
//   jamPlate    NO ROOM: solid for good (a word longer than its slot never fits)
//   floppy      a backup disk: touch it and counter 23 goes up by one
//   backupGate  a panel with a disk slot: a touch takes the backup's 1 off counter 23 and it opens
//   creditsL/R  a gold plaque saying CREDITS, hung on the wall (passable, nothing to change)
// The hero's counters 22 and 23 start at 1 (a counter shows one less than it holds).
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { micro } from '@lewismoten/gamemaker-sandbox-tools/kit/microText';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { buildStarterPalette, skyOf, type Pal } from '../../kit/starter/palette';

/** The counter a byte adds to and the PLAY gate spends. */
export const BYTES = 22;
/** The counter the backup disk adds to and the backup gate spends. */
export const BACKUP = 23;
/** The four bytes of "Play" as the player stores it at 0x2575B (web/packages/engine/src/player/patchTable.ts). */
export const PLAY_BYTES: [string, string][] = [
  ['50', 'P'],
  ['6C', 'l'],
  ['61', 'a'],
  ['79', 'y'],
];

type RGB = [number, number, number];

/** The Starter palette made a terminal: a dark green sky, green ground, and a `term` ramp of phosphor greens (and `dump`, the dim green of the background bytes). */
export function hoodPalette(): Pal {
  const pal = buildStarterPalette((b) => {
    b.ramp('term', 6, [10, 40, 22], [190, 255, 200], [60, 190, 100]);
    b.ramp('dump', 1, [30, 78, 44], [30, 78, 44]);
  }, 'under-the-hood');
  const set = (name: string, i: number, rgb: RGB) => {
    const at = pal.c(name, i) * 3;
    for (let k = 0; k < 3; k++) pal.pal[at + k] = rgb[k] >> 2; // the palette holds 6 bits a color
  };
  const sky: RGB[] = [
    [4, 12, 8],
    [6, 16, 10],
    [8, 20, 12],
    [10, 26, 16],
    [16, 36, 22],
    [24, 50, 30],
  ];
  sky.forEach((rgb, i) => set('sky', i, rgb));
  const grass: RGB[] = [
    [20, 90, 44],
    [30, 120, 60],
    [50, 160, 80],
    [80, 200, 110],
    [130, 235, 150],
    [190, 255, 200],
  ];
  grass.forEach((rgb, i) => set('grass', i, rgb));
  const dirt: RGB[] = [
    [8, 30, 16],
    [14, 44, 24],
    [18, 56, 30],
    [24, 70, 38],
    [32, 86, 48],
    [44, 104, 60],
  ];
  dirt.forEach((rgb, i) => set('dirt', i, rgb));
  return pal;
}

/** One letter of the PC's 8x8 font, in `col`, its top-left at (x, y). */
function letter(p: Pixels, x: number, y: number, ch: string, col: number): void {
  const at = ch.charCodeAt(0) * 8;
  for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) if (FONT8X8[at + yy] & (1 << xx)) p.set(x + xx, y + yy, col);
}

/** Bytes for the background, chosen once from a fixed seed; none that reads as a number people avoid or a word. */
function backgroundBytes(): string[] {
  const avoid = new Set(['88', '14', '66', '69', 'DE', 'AD', 'BE', 'EF', 'FA', 'CE', '00', 'A5', 'B0', '0B']);
  const rand = rng(1994);
  const out: string[] = [];
  while (out.length < 32) {
    const b = Math.floor(rand() * 256)
      .toString(16)
      .toUpperCase()
      .padStart(2, '0');
    if (!avoid.has(b)) out.push(b);
  }
  return out;
}

/** A background block: two rows of two dim bytes on the dark sky. */
function hexPicture(pal: Pal, bytes: string[]): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const dim = pal.c('dump', 0);
  micro(p, 1, 3, `${bytes[0]} ${bytes[1]}`, dim);
  micro(p, 1, 12, `${bytes[2]} ${bytes[3]}`, dim);
  return p;
}

/** A wall slab: lit top and left, shadowed bottom and right, faint scanlines. */
function panelPicture(pal: Pal): Pixels {
  const t = pal.r('term');
  const p = new Pixels(20, 20, t[1]);
  for (let y = 2; y < 20; y += 4) p.rect(1, y, 18, 1, t[0]);
  p.rect(0, 0, 20, 1, t[3]).rect(0, 0, 1, 20, t[2]).rect(0, 19, 20, 1, pal.c('ink', 0)).rect(19, 0, 1, 20, pal.c('ink', 0));
  return p;
}

/** The top of a doorway: a slab over the opening and thin posts at the sides. */
function archPicture(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const panel = panelPicture(pal);
  p.blit(panel.crop(0, 0, 20, 6), 0, 0);
  p.rect(0, 6, 2, 14, pal.c('term', 1)).rect(18, 6, 2, 14, pal.c('term', 1));
  p.rect(0, 6, 1, 14, pal.c('term', 2));
  return p;
}

/** A highlighted byte: a bright box, the byte in hex at the top and its letter under it. */
function bytePicture(pal: Pal, hex: string, ch: string): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const t = pal.r('term');
  const ink = pal.c('ink', 0);
  p.rect(1, 0, 18, 19, ink).rect(2, 1, 16, 17, t[4]).rect(2, 1, 16, 1, t[5]);
  micro(p, 7, 2, hex, ink);
  letter(p, 6, 9, ch, ink);
  return p;
}

/**
 * A four-byte slot: a framed 2 x 2 grid of the PC's 8x8 letters, read left to right, top to bottom. A space
 * shows as a short line, so you can count all four bytes. `frame` colors the rim.
 */
function slotPicture(pal: Pal, chars: string, frame: number, ink: number): Pixels {
  const p = panelPicture(pal);
  const t = pal.r('term');
  p.rect(0, 0, 20, 20, pal.c('ink', 0)).rect(0, 0, 20, 1, frame).rect(0, 19, 20, 1, frame).rect(0, 0, 1, 20, frame).rect(19, 0, 1, 20, frame);
  p.rect(1, 1, 18, 18, t[0]);
  [...chars].forEach((ch, i) => {
    const x = 2 + (i % 2) * 8;
    const y = 2 + Math.floor(i / 2) * 8;
    if (ch === ' ') p.rect(x + 1, y + 6, 6, 1, t[3]);
    else letter(p, x, y, ch, ink);
  });
  return p;
}

/** START in a four-byte slot: S T A R fill it, and the T is left over, sticking out in red. */
function startPicture(pal: Pal): Pixels {
  const p = slotPicture(pal, 'STAR', pal.c('term', 3), pal.c('term', 5));
  const red = pal.r('red');
  p.rect(16, 11, 4, 7, pal.c('ink', 0));
  micro(p, 17, 12, 'T', red[4]);
  return p;
}

/** The plate after a too-long word was tried: red, NO ROOM, shut for good. */
function jamPicture(pal: Pal): Pixels {
  const p = panelPicture(pal);
  const ink = pal.c('ink', 0);
  const red = pal.r('red');
  p.rect(1, 3, 18, 14, ink).rect(2, 4, 16, 12, red[2]).rect(3, 5, 14, 10, red[0]);
  micro(p, 7, 6, 'NO', red[4]);
  micro(p, 3, 11, 'ROOM', red[4]);
  return p;
}

/** A 3.5-inch disk: a blue body, a metal shutter at the top and a white label saying COPY. */
function floppyPicture(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const b = pal.r('blue');
  const s = pal.r('stone');
  p.rect(1, 1, 18, 18, ink).rect(2, 2, 16, 16, b[2]).rect(2, 2, 16, 1, b[3]);
  p.rect(6, 2, 8, 6, s[3]).rect(10, 3, 2, 4, ink);
  p.rect(2, 10, 16, 7, pal.c('white', 3));
  micro(p, 3, 11, 'COPY', ink);
  return p;
}

/** A gold plaque, two blocks wide, saying CREDITS. */
function creditsPicture(pal: Pal): Pixels {
  const p = new Pixels(40, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const g = pal.r('gold');
  p.rect(1, 3, 38, 14, ink).rect(2, 4, 36, 12, g[3]).rect(2, 4, 36, 1, g[5]).rect(2, 15, 36, 1, g[1]);
  micro(p, 20 - 14, 8, 'CREDITS', ink);
  return p;
}

/** The backup gate: a panel with a disk slot and COPY? over it. */
function backupGatePicture(pal: Pal): Pixels {
  const p = panelPicture(pal);
  const t = pal.r('term');
  const ink = pal.c('ink', 0);
  p.rect(2, 3, 16, 14, ink).rect(3, 4, 14, 12, t[0]);
  micro(p, 3, 6, 'COPY', t[5]);
  p.rect(4, 12, 12, 2, ink).rect(4, 14, 12, 1, t[2]);
  return p;
}

/** Adds UNDER THE HOOD's blocks to `book` (after addStarterBlocks). */
export function addHoodBlocks(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  const bytes = backgroundBytes();
  for (let i = 0; i < 8; i++) book.add(`hex${i}`, hexPicture(pal, bytes.slice(i * 4, i * 4 + 4)), air);
  book.add('panel', panelPicture(pal), { solid: SOLID });
  book.add('arch', archPicture(pal), air);
  for (const [hex, ch] of PLAY_BYTES) book.add(`b${hex}`, bytePicture(pal, hex, ch), { ...air, score: 25, effect: BYTES, eamt: 1, touch: 'sky' });
  book.add('playGate', slotPicture(pal, 'Play', pal.c('term', 3), pal.c('term', 2)), { solid: SOLID, effect: BYTES, eamt: -4, touch: 'sky' });
  book.add('jamPlate', jamPicture(pal), { solid: SOLID });
  book.add('goPlate', slotPicture(pal, 'GO  ', pal.c('term', 5), pal.c('term', 5)), { solid: SOLID, touch: 'sky' });
  book.add('startPlate', startPicture(pal), { solid: SOLID, touch: 'jamPlate' });
  book.add('floppy', floppyPicture(pal), { ...air, score: 25, effect: BACKUP, eamt: 1, touch: 'sky' });
  book.add('backupGate', backupGatePicture(pal), { solid: SOLID, effect: BACKUP, eamt: -1, touch: 'sky' });
  const plaque = creditsPicture(pal);
  book.add('creditsL', plaque.crop(0, 0, 20, 20), air);
  book.add('creditsR', plaque.crop(20, 0, 20, 20), air);
}
