// Sign blocks: a wooden board a few blocks wide with short words on it, standing on two
// posts. Say the words as a string; the board is cut into 20x20 blocks, one per square, and
// stamped on a map with StarterMap.sign(). Ordinary blocks, so a copy of the game can edit
// the words in the Blocks tab like any other picture.
//
//   addSign(book, pal, 'walk', '← → WALK', 4)        a board 4 blocks wide, one block high
//   addSign(book, pal, 'jump', 'SPACE JUMPS', 3, 2)  3 wide, 2 high: two lines
//
// The letters are the PC's 8x8 font at 1x (the same letters DOS prints), dark on cream, so
// they read at the game's size. ← → ↑ ↓ are drawn here. Words wrap by themselves; a board
// too small for its words is an error that says so.
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, type Book } from './book';
import { skyOf, type Pal } from './palette';

/** The arrows, drawn here (the 8x8 font has none): rows of 8, top to bottom, # is ink. */
const ARROWS: Record<string, string[]> = {
  '←': ['........', '...#....', '..##....', '.#######', '.#######', '..##....', '...#....', '........'],
  '→': ['........', '....#...', '....##..', '#######.', '#######.', '....##..', '....#...', '........'],
  '↑': ['...##...', '..####..', '.######.', '...##...', '...##...', '...##...', '...##...', '........'],
  '↓': ['...##...', '...##...', '...##...', '...##...', '.######.', '..####..', '...##...', '........'],
};

/** The 8 rows of a letter: bit x of a row is its x-th pixel from the left. */
function glyph(ch: string): number[] {
  const arrow = ARROWS[ch];
  if (arrow) return arrow.map((row) => [...row].reduce((bits, c, x) => (c === '#' ? bits | (1 << x) : bits), 0));
  return [...FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8)];
}

/** How many letters fit across a board `w` blocks wide. */
export const lettersAcross = (w: number): number => Math.floor((20 * w - 8) / 8);

/** How many lines fit down a board `h` blocks high (`tight`: the lines close together, 8 pixels apart instead of 9, one more line on a two-block board). */
export const linesDown = (h: number, tight = false): number => Math.floor((20 * h - 4) / (tight ? 8 : 9));

/** The words broken into lines that fit `width` letters, or an error saying they don't. */
export function wrapWords(text: string, width: number, lines: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (word.length > width) throw new Error(`Sign word "${word}" is wider than ${width} letters`);
    if (!line) line = word;
    else if (line.length + 1 + word.length <= width) line += ` ${word}`;
    else {
      out.push(line);
      line = word;
    }
  }
  if (line) out.push(line);
  if (out.length > lines) throw new Error(`Sign "${text}" needs ${out.length} lines but the board holds ${lines}`);
  return out;
}

/** The blocks of one sign, by row from the top: its board, then the row of two posts under it. */
export interface Sign {
  /** Block names, `h` rows of `w`. */
  board: string[][];
  /** The post blocks to stand under the board's left and right ends. */
  legs: [string, string];
}

/** The board's picture, w*20 by h*20. */
function boardPicture(pal: Pal, lines: string[], w: number, h: number, pitch = 9): Pixels {
  const { c } = pal;
  const p = new Pixels(20 * w, 20 * h, skyOf(pal));
  const W = 20 * w;
  const H = 20 * h;
  // wooden frame with a lit top edge, cream paper inside
  p.rect(1, 1, W - 2, H - 2, c('wood', 2));
  p.rect(1, 1, W - 2, 1, c('wood', 4)).rect(1, H - 2, W - 2, 1, c('wood', 0));
  p.rect(1, 1, 1, H - 2, c('wood', 3)).rect(W - 2, 1, 1, H - 2, c('wood', 1));
  p.rect(3, 3, W - 6, H - 6, c('parch', 3));
  p.rect(3, 3, W - 6, 1, c('parch', 4)).rect(3, H - 4, W - 6, 1, c('parch', 2));
  for (const [x, y] of [
    [2, 2],
    [W - 3, 2],
    [2, H - 3],
    [W - 3, H - 3],
  ])
    p.set(x, y, c('wood', 0));
  // the words, centered
  const top = 3 + Math.floor((H - 6 - (lines.length * pitch - 1)) / 2);
  lines.forEach((line, i) => {
    const x0 = Math.floor((W - line.length * 8) / 2);
    const y0 = top + i * pitch;
    [...line].forEach((ch, k) => {
      const g = glyph(ch);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (g[y] & (1 << x)) p.set(x0 + k * 8 + x, y0 + y, c('ink', 0));
    });
  });
  return p;
}

/** The two posts' blocks (added once, the first time a sign is). */
function addLegs(book: Book, pal: Pal): [string, string] {
  if (!book.has('signPostL')) {
    const w = pal.r('wood');
    const post = (x: number) => {
      const p = new Pixels(20, 20, skyOf(pal));
      p.rect(x, 0, 4, 20, w[2])
        .rect(x, 0, 1, 20, w[4])
        .rect(x + 3, 0, 1, 20, w[1]);
      return p;
    };
    book.add('signPostL', post(3), { grav: PULL.down });
    book.add('signPostR', post(13), { grav: PULL.down });
  }
  return ['signPostL', 'signPostR'];
}

/**
 * Adds the blocks of a sign called `name` to `book`: `w` blocks wide and `h` high, saying
 * `text` (`tight`: four lines may squeeze onto a two-block board). Returns the block names for StarterMap.sign().
 */
export function addSign(book: Book, pal: Pal, name: string, text: string, w: number, h = 1, tight = false): Sign {
  if (w < 2 || w > 4) throw new Error(`Sign ${name} should be 2 to 4 blocks wide`);
  const lines = wrapWords(text, lettersAcross(w), linesDown(h, tight));
  const pic = boardPicture(pal, lines, w, h, tight && lines.length * 9 - 1 > 20 * h - 6 ? 8 : 9);
  const board: string[][] = [];
  for (let row = 0; row < h; row++) {
    board.push([]);
    for (let col = 0; col < w; col++) {
      const id = `sign.${name}.${col}${row}`;
      board[row].push(id);
      book.add(id, pic.crop(col * 20, row * 20, 20, 20), { grav: PULL.down });
    }
  }
  return { board, legs: addLegs(book, pal) };
}
