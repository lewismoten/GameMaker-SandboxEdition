// STICK MAN STARS' signs, cut into blocks that repeat: a sign is a left cap, a row of letter blocks, a right cap,
// and one post under its middle.
//   - the caps are the board's two ends, the same for every sign;
//   - a letter block holds five tiny 3 by 5 letters and draws the board's top and bottom edges itself, so blocks
//     of the same five letters are one block, made once, wherever they stand (chunks keyed by their text);
//   - the post: one centered post block under a board an odd number of blocks wide, or a post split over the
//     two middle blocks of an even one. A name board over a house's door has no post (it rests on the roof).
// Wording is written in chunks of five ("PICK |STARS"), so a chunk like "STARS" is drawn once and used by several signs.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { StarterMap } from '../../kit/starter/map';

/** The tiny letters, 3 wide and 5 high, row by row (# is ink). */
const TINY: Record<string, string> = {
  A: '.#. #.# ### #.# #.#',
  B: '##. #.# ##. #.# ##.',
  C: '.## #.. #.. #.. .##',
  D: '##. #.# #.# #.# ##.',
  E: '### #.. ##. #.. ###',
  F: '### #.. ##. #.. #..',
  G: '.## #.. #.# #.# .##',
  H: '#.# #.# ### #.# #.#',
  I: '### .#. .#. .#. ###',
  J: '..# ..# ..# #.# .#.',
  K: '#.# #.# ##. #.# #.#',
  L: '#.. #.. #.. #.. ###',
  M: '#.# ### #.# #.# #.#',
  N: '##. #.# #.# #.# #.#',
  O: '.#. #.# #.# #.# .#.',
  P: '##. #.# ##. #.. #..',
  Q: '.#. #.# #.# ##. .##',
  R: '##. #.# ##. #.# #.#',
  S: '.## #.. .#. ..# ##.',
  T: '### .#. .#. .#. .#.',
  U: '#.# #.# #.# #.# ###',
  V: '#.# #.# #.# #.# .#.',
  W: '#.# #.# #.# ### #.#',
  X: '#.# #.# .#. #.# #.#',
  Y: '#.# #.# .#. .#. .#.',
  Z: '### ..# .#. #.. ###',
  '1': '.#. ##. .#. .#. ###',
  '3': '##. ..# .#. ..# ##.',
  '5': '### #.. ##. ..# ##.',
  ' ': '... ... ... ... ...',
  '.': '... ... ... ... .#.',
  ',': '... ... ... .#. #..',
  ':': '... .#. ... .#. ...',
  '!': '.#. .#. .#. ... .#.',
  '?': '##. ..# .#. ... .#.',
  "'": '.#. .#. ... ... ...',
  '→': '#.. ##. ### ##. #..',
};

/** The glyph's 15 cells, top row first. */
function cells(ch: string): string {
  const g = TINY[ch];
  if (g === undefined) throw new Error(`No tiny letter for "${ch}"`);
  return g.replaceAll(' ', '');
}

/** The board's rows inside a 20-pixel block: its top edge, the paper, the letters' row and its bottom edge. */
const TOP = 7;
const LETTERS = 11;
/** How far in from the block's edge each cap's board begins (the rest of the cap block is sky). */
const CAP = 13;

export interface SmallSign {
  /** Block names, left to right (caps included). */
  board: string[];
  /** Where its post blocks stand under the board: [offset from its left, block name]. Empty for a name board. */
  posts: [number, string][];
}

/** Draws the board's frame across x0..x1 of `p` (inclusive): the wood edges top and bottom and the cream paper. */
function frame(p: Pixels, pal: Pal, x0: number, x1: number): void {
  const { c } = pal;
  const w = x1 - x0 + 1;
  p.rect(x0, TOP, w, 1, c('wood', 4)).rect(x0, TOP + 1, w, 1, c('wood', 2));
  p.rect(x0, TOP + 2, w, 18 - TOP - 2, c('parch', 3));
  p.rect(x0, TOP + 2, w, 1, c('parch', 4));
  p.rect(x0, 18, w, 1, c('wood', 2)).rect(x0, 19, w, 1, c('wood', 0));
}

/** The shared blocks: both caps and the post (whole, and split over two blocks). Added once. */
function addShared(book: Book, pal: Pal): void {
  if (book.has('sgn.capL')) return;
  const { c } = pal;
  const blank = () => new Pixels(20, 20, skyOf(pal));
  const air = { grav: PULL.down };
  const left = blank();
  frame(left, pal, CAP, 19);
  left.rect(CAP, TOP, 1, 20 - TOP, c('wood', 3)).rect(CAP + 1, TOP + 1, 1, 19 - TOP - 1, c('wood', 2));
  left.set(CAP, TOP, c('wood', 0)).set(CAP, 19, c('wood', 0)).set(CAP, TOP, skyOf(pal)).set(CAP, 19, skyOf(pal));
  book.add('sgn.capL', left, air);
  const right = blank();
  frame(right, pal, 0, 19 - CAP);
  right.rect(19 - CAP, TOP, 1, 20 - TOP, c('wood', 1)).rect(18 - CAP, TOP + 1, 1, 19 - TOP - 1, c('wood', 2));
  right.set(19 - CAP, TOP, skyOf(pal)).set(19 - CAP, 19, skyOf(pal));
  book.add('sgn.capR', right, air);
  const w = pal.r('wood');
  const post = (x: number) =>
    blank()
      .rect(x, 0, 4, 20, w[2])
      .rect(x, 0, 1, 20, w[4])
      .rect(x + 3, 0, 1, 20, w[1]);
  book.add('sgn.post', post(8), air);
  book.add('sgn.postL', post(18), air);
  book.add('sgn.postR', post(-2), air);
}

/** The block for one chunk of five letters (made the first time those five letters are asked for). */
function chunkBlock(book: Book, pal: Pal, text: string): string {
  const id = `sgn.${text}`;
  if (book.has(id)) return id;
  const p = new Pixels(20, 20, skyOf(pal));
  frame(p, pal, 0, 19);
  [...text].forEach((ch, k) => {
    const g = cells(ch);
    for (let i = 0; i < 15; i++) if (g[i] === '#') p.set(k * 4 + (i % 3), LETTERS + Math.floor(i / 3), pal.c('ink', 0));
  });
  book.add(id, p, { grav: PULL.down });
  return id;
}

/** A sign saying `chunks` ("PICK |STARS", each chunk five letters). `post` false: a name board with no post. */
export function smallSign(book: Book, pal: Pal, chunks: string, post = true): SmallSign {
  addShared(book, pal);
  const parts = chunks.split('|');
  for (const part of parts) if ([...part].length !== 5) throw new Error(`Sign chunk "${part}" should be five letters`);
  const board = ['sgn.capL', ...parts.map((t) => chunkBlock(book, pal, t)), 'sgn.capR'];
  const mid = Math.floor(board.length / 2);
  const posts: [number, string][] = !post
    ? []
    : board.length % 2
      ? [[mid, 'sgn.post']]
      : [
          [mid - 1, 'sgn.postL'],
          [mid, 'sgn.postR'],
        ];
  return { board, posts };
}

/** Stamps sign `s` with its board at level (x, y) and its post under it. */
export function stampSign(m: StarterMap, x: number, y: number, s: SmallSign): void {
  s.board.forEach((name, dx) => m.set(x + dx, y, name));
  for (const [dx, name] of s.posts) m.set(x + dx, y + 1, name);
}
