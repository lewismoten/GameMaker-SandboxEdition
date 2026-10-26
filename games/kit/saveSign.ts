// The save sign: a cream board with a blue floppy disk, SAVE and F5 on it, framed in a dashed
// pink stitch, on two wooden posts. Every game with a felt egg puts exactly one in the level the
// player reaches next after the egg's level (or near the exit of that level when the ending comes
// next), and no other sign in any game looks like it: players who learn the look can tell an egg
// was in the level before. The words never name the egg. A game's ordinary save reminders keep
// the game's own look instead.
//
// It is drawn in fixed colors (8-bit RGB below) and put into a game's palette by nearest color,
// as the cameos are (cameos.ts), so it looks the same in every game. The board is two blocks
// wide (40x20) and the posts the two blocks under it; a game whose view has no ground under a
// sign (a flying shooter) may use the board alone. about.json "saveSign" records where it is:
// { "map": "s2b.map", "at": [x, y], "after": <the egg's map> } (the board's left block);
// saveSignCheck.ts checks it. A game whose block set is full uses putSaveSign.
import { Pixels } from './pixels';
import { emptyBlock, type Block } from '../../web/src/formats/blocks';
import { MLEN, type GameMap } from '../../web/src/formats/map';

/** The sign's colors, 8-bit RGB. */
const RGB = {
  ink: [32, 24, 42],
  face: [244, 236, 214],
  shade: [222, 210, 180],
  stitch: [242, 143, 184],
  disk: [47, 85, 176],
  diskDark: [28, 52, 116],
  shutter: [200, 204, 212],
  slot: [90, 94, 104],
  label: [250, 250, 250],
  line: [154, 168, 200],
  key: [212, 58, 42],
  wood: [154, 106, 58],
  woodDark: [106, 68, 34],
  woodLight: [192, 140, 82],
} as const;
type Ink = keyof typeof RGB;

/** The board, 40x20, as color names ('' = the ground shows through). */
function board(): Ink[][] {
  const g: Ink[][] = Array.from({ length: 20 }, () => Array<Ink>(40).fill('face'));
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 40; x++) {
      const edge = x === 0 || y === 0 || x === 39 || y === 19;
      if (edge) g[y][x] = 'ink';
      else if (y >= 15 || x >= 37) g[y][x] = 'shade';
    }
  // the stitch: dashes two on, one off, two pixels in from the edge
  for (let x = 3; x <= 36; x++) if (x % 3 !== 2) ((g[2][x] = 'stitch'), (g[17][x] = 'stitch'));
  for (let y = 3; y <= 16; y++) if (y % 3 !== 2) ((g[y][2] = 'stitch'), (g[y][37] = 'stitch'));
  // the floppy disk
  const disk = [
    'dddddddddd.',
    'dDsssssDDdd',
    'dDsSsssDDDd',
    'dDsSsssDDDd',
    'dDsssssDDDd',
    'dDDDDDDDDDd',
    'dDLLLLLLLDd',
    'dDLlllllLDd',
    'dDLLLLLLLDd',
    'dDLlllllLDd',
    'dDLLLLLLLDd',
    'ddddddddddd',
  ];
  const dk: Record<string, Ink> = { d: 'ink', D: 'disk', s: 'shutter', S: 'slot', L: 'label', l: 'line' };
  disk.forEach((row, y) => [...row].forEach((ch, x) => ch in dk && (g[4 + y][5 + x] = dk[ch])));
  g[5][6] = 'diskDark';
  // SAVE, 3x5 letters
  const letters: Record<string, string[]> = {
    S: ['###', '#..', '###', '..#', '###'],
    A: ['.#.', '#.#', '###', '#.#', '#.#'],
    V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
    E: ['###', '#..', '##.', '#..', '###'],
  };
  [...'SAVE'].forEach((ch, i) => letters[ch].forEach((row, y) => [...row].forEach((c, x) => c === '#' && (g[4 + y][19 + i * 4 + x] = 'ink'))));
  // F5, 4x7, in red
  const key = [
    ['####', '#...', '#...', '###.', '#...', '#...', '#...'],
    ['####', '#...', '###.', '...#', '...#', '#..#', '.##.'],
  ];
  key.forEach((rows, i) => rows.forEach((row, y) => [...row].forEach((c, x) => c === '#' && (g[10 + y][21 + i * 6 + x] = 'key'))));
  // round the corners
  for (const [x, y] of [
    [0, 0],
    [39, 0],
    [0, 19],
    [39, 19],
  ])
    g[y][x] = '' as Ink;
  return g;
}

/** The posts under the board, 40x20 ('' = ground). */
function posts(): Ink[][] {
  const g: Ink[][] = Array.from({ length: 20 }, () => Array<Ink>(40).fill('' as Ink));
  for (const px of [7, 30])
    for (let y = 0; y < 19; y++) {
      g[y][px - 1] = 'ink';
      g[y][px] = 'woodLight';
      g[y][px + 1] = 'wood';
      g[y][px + 2] = 'woodDark';
      g[y][px + 3] = 'ink';
    }
  return g;
}

const BOARD = board();
const POSTS = posts();

/** Nearest palette entry (palette 6-bit, 768 bytes) to an 8-bit color, among `use`. */
function nearest(pal: Uint8Array, rgb: readonly number[], use: number[]): number {
  let best = use[0];
  let bd = Infinity;
  for (const j of use) {
    const d = 3 * (rgb[0] - pal[j * 3] * 4.05) ** 2 + 4 * (rgb[1] - pal[j * 3 + 1] * 4.05) ** 2 + 2 * (rgb[2] - pal[j * 3 + 2] * 4.05) ** 2;
    if (d < bd) ((bd = d), (best = j));
  }
  return best;
}

export interface SaveSignOptions {
  /** The palette entries it may use (default every entry but 255). */
  use?: number[];
}

/**
 * The sign's blocks in a game's palette (768 bytes, 6-bit): the board's left and right
 * halves and, when `under` has them, the posts' left and right halves, each drawn over the
 * matching 20x20 picture of what lies there (the ground the sign stands on).
 */
export function saveSignBlocks(
  pal: Uint8Array,
  under: { board: [Pixels, Pixels]; posts?: [Pixels, Pixels] },
  o: SaveSignOptions = {},
): { board: [Pixels, Pixels]; posts?: [Pixels, Pixels] } {
  const use = o.use ?? Array.from({ length: 255 }, (_, i) => i);
  const memo = new Map<Ink, number>();
  const ink = (k: Ink) => {
    if (!memo.has(k)) memo.set(k, nearest(pal, RGB[k], use));
    return memo.get(k)!;
  };
  const half = (g: Ink[][], bg: Pixels, left: number) => {
    const p = new Pixels(20, 20);
    p.blit(bg, 0, 0);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const k = g[y][left + x];
        if (k) p.set(x, y, ink(k));
      }
    return p;
  };
  return {
    board: [half(BOARD, under.board[0], 0), half(BOARD, under.board[1], 20)],
    posts: under.posts && [half(POSTS, under.posts[0], 0), half(POSTS, under.posts[1], 20)],
  };
}

/**
 * Whether two blocks side by side (20x20 each, in `pal`) show the sign's board: nearly every
 * pixel of the board is close to the sign's color there.
 */
export function looksLikeSaveSign(left: Uint8Array, right: Uint8Array, pal: Uint8Array): boolean {
  let n = 0;
  let near = 0;
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 40; x++) {
      const k = BOARD[y][x];
      if (!k) continue;
      n++;
      const c = (x < 20 ? left : right)[y * 20 + (x % 20)];
      const rgb = RGB[k];
      const d = Math.hypot(rgb[0] - pal[c * 3] * 4.05, rgb[1] - pal[c * 3 + 1] * 4.05, rgb[2] - pal[c * 3 + 2] * 4.05);
      if (d < 90) near++;
    }
  return near >= n * 0.9;
}

/**
 * For a game whose block set is full: a copy of `bbl` for one map's scenes, with the sign in
 * blocks that map never shows (none on it, none a block there turns into, and never a pickup,
 * as the inventory draws what is carried from the scene's set), and the sign put on `map`:
 * the board at (x, y), the posts below it unless `posts` is false. Save the copy as the
 * scene's own .bbl.
 */
export function putSaveSign(bbl: Block[], map: GameMap, pal: Uint8Array, x: number, y: number, o: SaveSignOptions & { posts?: boolean } = {}): Block[] {
  const posts = o.posts ?? true;
  const shown = new Set(map.blocks);
  for (let grew = true; grew;) {
    grew = false;
    for (const n of [...shown]) for (const m of [bbl[n].nextBl, bbl[n].touchBl]) if (m < bbl.length && !shown.has(m)) (shown.add(m), (grew = true));
  }
  const carried = new Set(bbl.flatMap((b, n) => (b.obj ? [n, b.nextBl, b.touchBl] : [])));
  const free = bbl.map((_, n) => n).filter((n) => n > 0 && !shown.has(n) && !carried.has(n));
  const need = posts ? 4 : 2;
  if (free.length < need) throw new Error('No room in the block set for the save sign');
  const nums = free.slice(-need);
  const at = (dx: number, dy: number) => (y + dy) * MLEN + x + dx;
  const pic = (dx: number, dy: number) => {
    const p = new Pixels(20, 20);
    p.px.set(bbl[map.blocks[at(dx, dy)]].pixels);
    return p;
  };
  const sign = saveSignBlocks(pal, { board: [pic(0, 0), pic(1, 0)], posts: posts ? [pic(0, 1), pic(1, 1)] : undefined }, o);
  const out = bbl.map((b) => ({ ...b, pixels: Uint8Array.from(b.pixels), xtra: Uint8Array.from(b.xtra) }));
  const cells: [Pixels, number, number][] = [
    [sign.board[0], 0, 0],
    [sign.board[1], 1, 0],
  ];
  if (sign.posts) cells.push([sign.posts[0], 0, 1], [sign.posts[1], 1, 1]);
  cells.forEach(([p, dx, dy], k) => {
    out[nums[k]] = { ...emptyBlock(nums[k]), pixels: Uint8Array.from(p.px) };
    map.blocks[at(dx, dy)] = nums[k];
  });
  return out;
}
