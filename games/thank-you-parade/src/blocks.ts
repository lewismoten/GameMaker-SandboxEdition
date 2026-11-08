// The parade's own ground blocks, printed in the poster inks. They carry the names and rules the level layout
// (kit/starter/map.ts reads level rows by these names) and the bot expect, but every picture is drawn here:
//   air:      sky (bare paper), edge (a striped parade barricade you can't pass), cloudL + cloudR (a flat printed cloud)
//   ground:   grass (a scalloped green verge over dotted soil), dirt, brick (vermilion brick), plank (a bleacher board)
//   scenery:  bush (a clipped hedge ball), flower (a marigold)
//   climbing: ladder (a brass ladder)
//   doors:    doorTop + doorBottom (the exit: a pennant gate), doorwayTop + doorwayBottom (the way in)
//   things:   coin, key (a brass key on a ribbon), spikes (traffic cones)
//   locks:    keySilver, gateTop + gate (brass), gateTopSilver + gateSilver (steel), as kit/starter/locks.ts lays them out
// and the signs: placards on striped poles, in the PC's 8x8 letters, up to seven blocks wide.
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { LEDGE, PULL, SOLID, type Book } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import type { Sign } from '../../kit/starter/sign';
import { halftone, inkLine, paperOf, stripes, type Pal } from './print';

const T = 255;
/** The counter a silver key adds to (the gold key adds to KEYS). */
export const SILVER_KEYS = 21;
const air = { grav: PULL.down };

/** A 20x20 block of bare paper. */
export const paperBlock = (pal: Pal): Pixels => new Pixels(20, 20, paperOf(pal));

/** `pic` (drawn on transparent) inked and laid on paper. */
export function onPaper(pal: Pal, pic: Pixels): Pixels {
  const out = new Pixels(pic.w, pic.h, paperOf(pal));
  return out.blit(inkLine(pic, pal.c('ink', 0)), 0, 0, T);
}

/** Adds the ground, door, lock and thing blocks every level shares, in one fixed order. */
export function addPrintBlocks(book: Book, pal: Pal): void {
  const { c, r } = pal;
  const ink = c('ink', 0);
  const paper = paperOf(pal);
  book.add('sky', paperBlock(pal), air);

  {
    // a parade barricade: a post with vermilion and paper stripes, an ink edge on both sides
    const p = new Pixels(20, 20, paper);
    p.rect(3, 0, 14, 20, c('paper', 3));
    stripes(p, 3, 0, 14, 20, c('red', 2), 10, 5);
    p.rect(3, 0, 1, 20, ink).rect(16, 0, 1, 20, ink);
    halftone(p, 12, 0, 4, 20, c('red', 0), 2, [c('red', 2)]);
    book.add('edge', p, { ...air, solid: SOLID });
  }
  {
    // a printed cloud: a flat paper shape, an ink line, halftone dots along its underside
    const p = new Pixels(40, 20, T);
    for (const [x, y, rr] of [
      [9, 12, 6],
      [17, 8, 7],
      [26, 10, 6],
      [32, 13, 4],
    ])
      p.disc(x, y, rr, c('white', 3));
    p.rect(4, 13, 32, 4, c('white', 3));
    halftone(p, 0, 12, 40, 6, c('paper', 1), 3, [c('white', 3)]);
    const out = onPaper(pal, p);
    book.add('cloudL', out.crop(0, 0, 20, 20), air);
    book.add('cloudR', out.crop(20, 0, 20, 20), air);
  }
  const soil = (top: boolean) => {
    const p = new Pixels(20, 20, c('dirt', 1));
    halftone(p, 0, 0, 20, 20, c('dirt', 2), 3);
    if (top) {
      // a green verge with a scalloped edge
      p.rect(0, 0, 20, 6, c('grass', 3));
      for (let x = 0; x < 20; x++) {
        const d = 6 + (x % 5 < 3 ? 1 : 0);
        p.rect(x, 6, 1, d - 6 + 1, c('grass', 3));
        p.set(x, d + 1, ink);
      }
      halftone(p, 0, 0, 20, 7, c('grass', 1), 2, [c('grass', 3)]);
      p.rect(0, 0, 20, 1, c('grass', 5));
    }
    return p;
  };
  book.add('grass', soil(true), { solid: SOLID });
  book.add('dirt', soil(false), { solid: SOLID });
  {
    const p = new Pixels(20, 20, c('brick', 3));
    for (let y = 0; y < 20; y += 5) {
      p.rect(0, y, 20, 1, ink);
      const off = (y / 5) % 2 ? 0 : 5;
      for (let x = off; x < 20; x += 10) p.rect(x, y, 1, 5, ink);
    }
    halftone(p, 0, 0, 20, 20, c('brick', 1), 2, [c('brick', 3)]);
    book.add('brick', p, { solid: SOLID });
  }
  {
    // a bleacher board: brass trim on top, a wood face, an ink underside, open paper beneath
    const p = new Pixels(20, 20, paper);
    p.rect(0, 0, 20, 2, c('gold', 4)).rect(0, 2, 20, 5, c('wood', 2)).rect(0, 7, 20, 1, ink);
    halftone(p, 0, 2, 20, 5, c('wood', 1), 2, [c('wood', 2)]);
    for (const x of [3, 16]) p.rect(x, 8, 2, 4, c('wood', 1)).rect(x, 12, 2, 1, ink);
    book.add('plank', p, { solid: LEDGE, grav: PULL.down });
  }
  {
    // a clipped hedge ball in a vermilion tub
    const p = new Pixels(20, 20, T);
    p.disc(10, 9, 7, c('green', 3));
    halftone(p, 0, 0, 20, 20, c('green', 1), (x, y) => (x + y > 20 ? 3 : 0), [c('green', 3)]);
    p.rect(5, 15, 10, 5, c('red', 2)).rect(5, 15, 10, 1, c('red', 4));
    book.add('bush', onPaper(pal, p), air);
  }
  {
    // a marigold on a stem
    const p = new Pixels(20, 20, T);
    p.rect(9, 10, 2, 10, c('green', 2)).rect(11, 14, 3, 2, c('green', 3));
    for (const [x, y] of [
      [10, 4],
      [7, 6],
      [13, 6],
      [8, 9],
      [12, 9],
    ])
      p.disc(x, y, 2.2, c('orange', 3));
    p.disc(10, 7, 1.6, c('red', 2));
    book.add('flower', onPaper(pal, p), air);
  }
  {
    const p = new Pixels(20, 20, paper);
    const g = r('gold');
    p.rect(3, 0, 3, 20, g[3]).rect(14, 0, 3, 20, g[3]);
    p.rect(3, 0, 1, 20, g[5]).rect(14, 0, 1, 20, g[5]);
    for (const y of [3, 13]) p.rect(6, y, 8, 2, g[2]).rect(6, y + 2, 8, 1, ink);
    p.rect(2, 0, 1, 20, ink).rect(6, 0, 1, 3, ink).rect(17, 0, 1, 20, ink).rect(13, 0, 1, 20, ink).rect(6, 5, 1, 8, ink).rect(6, 15, 1, 5, ink);
    book.add('ladder', p, { grav: PULL.none });
  }
  {
    // the exit: two striped poles with a pennant string between them and an arrow banner
    const p = new Pixels(20, 40, T);
    for (const x of [1, 16]) {
      p.rect(x, 4, 3, 36, c('paper', 3));
      stripes(p, x, 4, 3, 36, c('blue', 2), 6, 3);
      p.disc(x + 1, 3, 2, c('gold', 4));
    }
    for (let x = 4; x < 16; x += 4) p.rect(x, 6, 3, 2, c('red', 2)).rect(x + 1, 8, 1, 2, c('red', 2));
    p.rect(4, 12, 12, 9, c('red', 2)).rect(4, 12, 12, 1, c('red', 4));
    // the arrow, in paper
    p.rect(6, 15, 6, 3, c('paper', 3)).rect(12, 14, 1, 5, c('paper', 3)).rect(13, 15, 1, 3, c('paper', 3)).set(14, 16, c('paper', 3));
    const out = onPaper(pal, p);
    book.add('doorTop', out.crop(0, 0, 20, 20), air);
    book.add('doorBottom', out.crop(0, 20, 20, 20), air);
  }
  {
    // the way in: a navy curtain doorway with a brass rod
    const p = new Pixels(20, 40, T);
    p.rect(1, 6, 18, 34, c('blue', 1));
    for (let x = 2; x < 18; x += 4) p.rect(x, 7, 2, 33, c('blue', 2));
    p.rect(0, 4, 20, 3, c('gold', 3)).rect(0, 4, 20, 1, c('gold', 5));
    const out = onPaper(pal, p);
    book.add('doorwayTop', out.crop(0, 0, 20, 20), air);
    book.add('doorwayBottom', out.crop(0, 20, 20, 20), air);
  }
  {
    // a brass token with a star stamped in it
    const p = new Pixels(20, 20, T);
    p.disc(10, 10, 6, c('gold', 3));
    p.disc(10, 10, 4, c('gold', 4));
    p.rect(9, 7, 2, 7, c('gold', 1)).rect(7, 9, 6, 2, c('gold', 1));
    book.add('coin', onPaper(pal, p), { ...air, score: 10, touch: 'sky' });
  }
  book.add('key', keyPicture(pal, 'gold'), { ...air, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
  {
    // traffic cones
    const p = new Pixels(20, 20, T);
    for (const x of [5, 15]) {
      for (let y = 6; y < 18; y++) {
        const w = Math.floor((y - 6) / 2.4);
        p.rect(x - w, y, w * 2 + 1, 1, c('orange', 3));
      }
      p.rect(x - 3, 11, 7, 2, c('paper', 3));
      p.rect(x - 5, 18, 11, 2, c('orange', 1));
    }
    book.add('spikes', onPaper(pal, p), { solid: SOLID, hp: -10 });
  }
  // the locks
  book.add('keySilver', keyPicture(pal, 'silver'), { grav: PULL.down, score: 25, effect: SILVER_KEYS, eamt: 1, touch: 'sky' });
  book.add('gateTop', archPicture(pal, 'gold'), { grav: PULL.down });
  book.add('gate', gatePicture(pal, 'gold'), { solid: SOLID, effect: KEYS, eamt: -1, touch: 'sky' });
  book.add('gateTopSilver', archPicture(pal, 'silver'), { grav: PULL.down });
  book.add('gateSilver', gatePicture(pal, 'silver'), { solid: SOLID, effect: SILVER_KEYS, eamt: -1, touch: 'sky' });
}

function keyPicture(pal: Pal, metal: 'gold' | 'silver'): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const m = metal === 'gold' ? [c('gold', 2), c('gold', 4)] : [c('silver', 1), c('silver', 3)];
  p.disc(6, 8, 4, m[1]).disc(6, 8, 1.5, T);
  p.rect(9, 7, 9, 3, m[1]).rect(14, 10, 2, 3, m[1]).rect(17, 10, 1, 2, m[1]);
  p.rect(9, 9, 9, 1, m[0]);
  // a ribbon tied through the bow
  p.rect(2, 12, 3, 5, c('red', 2)).rect(5, 13, 2, 5, c('red', 3));
  return onPaper(pal, p);
}

function archPicture(pal: Pal, metal: 'gold' | 'silver'): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const m = metal === 'gold' ? c('gold', 3) : c('silver', 2);
  p.rect(0, 0, 20, 6, c('blue', 2)).rect(0, 5, 20, 2, m);
  p.rect(0, 7, 3, 13, c('blue', 2)).rect(17, 7, 3, 13, c('blue', 2));
  halftone(p, 0, 0, 20, 6, c('blue', 1), 3, [c('blue', 2)]);
  // a keyhole plate
  p.rect(8, 9, 4, 6, m).set(9, 11, c('ink', 0)).set(10, 11, c('ink', 0)).rect(9, 12, 2, 2, c('ink', 0));
  return onPaper(pal, p);
}

function gatePicture(pal: Pal, metal: 'gold' | 'silver'): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const m = metal === 'gold' ? [c('gold', 1), c('gold', 3), c('gold', 5)] : [c('silver', 0), c('silver', 2), c('silver', 3)];
  p.rect(0, 0, 3, 20, c('blue', 2)).rect(17, 0, 3, 20, c('blue', 2));
  for (let x = 4; x < 17; x += 3) p.rect(x, 0, 2, 20, m[1]).rect(x, 0, 1, 20, m[2]);
  p.rect(3, 4, 14, 2, m[0]).rect(3, 14, 14, 2, m[0]);
  p.disc(10, 10, 2.5, m[2]).set(10, 10, c('ink', 0));
  return onPaper(pal, p);
}

// ---- placards

const lettersAcross = (w: number): number => Math.floor((20 * w - 8) / 8);
const linesDown = (h: number): number => Math.floor((20 * h - 6) / 8);

function wrapWords(text: string, width: number, lines: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (word.length > width) throw new Error(`Placard word "${word}" is wider than ${width} letters`);
    if (!line) line = word;
    else if (line.length + 1 + word.length <= width) line += ` ${word}`;
    else {
      out.push(line);
      line = word;
    }
  }
  if (line) out.push(line);
  if (out.length > lines) throw new Error(`Placard "${text}" needs ${out.length} lines but holds ${lines}`);
  return out;
}

const ARROW_RIGHT = ['........', '....#...', '....##..', '#######.', '#######.', '....##..', '....#...', '........'];
function glyph(ch: string): number[] {
  if (ch === '→') return ARROW_RIGHT.map((row) => [...row].reduce((bits, k, x) => (k === '#' ? bits | (1 << x) : bits), 0));
  return [...FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8)];
}

/** A placard's picture: a paper card with a vermilion border, brass tacks at its corners and navy letters. */
function placard(pal: Pal, lines: string[], w: number, h: number, tone: 'red' | 'purple' | 'teal'): Pixels {
  const { c } = pal;
  const W = 20 * w;
  const H = 20 * h;
  const p = new Pixels(W, H, paperOf(pal));
  p.rect(1, 1, W - 2, H - 2, c(tone, 2));
  halftone(p, 1, 1, W - 2, H - 2, c(tone, 1), 2, [c(tone, 2)]);
  p.rect(3, 3, W - 6, H - 6, c('paper', 3));
  p.frame(0, 0, W, H, c('ink', 0)).frame(3, 3, W - 6, H - 6, c('ink', 0));
  for (const [x, y] of [
    [1, 1],
    [W - 3, 1],
    [1, H - 3],
    [W - 3, H - 3],
  ])
    p.rect(x, y, 2, 2, c('gold', 4));
  const top = 3 + Math.floor((H - 6 - (lines.length * 8 - 1)) / 2);
  lines.forEach((line, i) => {
    const x0 = Math.floor((W - line.length * 8) / 2);
    const y0 = top + i * 8;
    [...line].forEach((ch, k) => {
      const g = glyph(ch);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (g[y] & (1 << x)) p.set(x0 + k * 8 + x, y0 + y, c('blue', 0));
    });
  });
  return p;
}

function addPoles(book: Book, pal: Pal): [string, string] {
  if (!book.has('placardPoleL')) {
    const pole = (x: number) => {
      const p = paperBlock(pal);
      p.rect(x, 0, 3, 20, pal.c('paper', 3));
      stripes(p, x, 0, 3, 20, pal.c('red', 2), 10, 4);
      p.rect(x - 1, 0, 1, 20, pal.c('ink', 0)).rect(x + 3, 0, 1, 20, pal.c('ink', 0));
      return p;
    };
    book.add('placardPoleL', pole(4), air);
    book.add('placardPoleR', pole(13), air);
  }
  return ['placardPoleL', 'placardPoleR'];
}

/** A placard called `name`, `w` blocks wide (2 to 7) and `h` high, saying `text`; returns its blocks for StarterMap.sign(). */
export function addPlacard(book: Book, pal: Pal, name: string, text: string, w: number, h = 1, tone: 'red' | 'purple' | 'teal' = 'red'): Sign {
  if (w < 2 || w > 7) throw new Error(`Placard ${name} should be 2 to 7 blocks wide`);
  const lines = wrapWords(text, lettersAcross(w), linesDown(h));
  const pic = placard(pal, lines, w, h, tone);
  const board: string[][] = [];
  for (let row = 0; row < h; row++) {
    board.push([]);
    for (let col = 0; col < w; col++) {
      const id = `sign.${name}.${col}${row}`;
      board[row].push(id);
      book.add(id, pic.crop(col * 20, row * 20, 20, 20), air);
    }
  }
  return { board, legs: addPoles(book, pal) };
}
