// Game-wide tiled signs, inspired by Stick Man Stars (Lewis Moten / Claude Sonnet 5.5).
// OpenAI Codex separated the frame from the shared 3x5 letter tiles and centered post.
import { MICRO_GLYPHS, type MicroGlyphs } from '../microFont';
import { Pixels } from './pixels';

export interface TiledSignText {
  /** Rows of explicit chunks, e.g. [['PICK ', 'STARS']]. Plan repeated chunks across the game. */
  rows: readonly (readonly string[])[];
  post?: boolean;
}

export interface TiledSign {
  /** Frame and letters, excluding the post; block names by row. */
  board: string[][];
  /** One centered post, or none for a wall sign. */
  post?: { x: number; block: string };
}

export interface TiledSignOptions {
  colors: { background: number; paper: number; ink: number; wood: number; highlight: number; shadow: number };
  /** Three-pixel letters with a one-pixel gap: four or five fit a 20-pixel block. */
  lettersPerBlock?: 4 | 5;
  glyphs?: MicroGlyphs;
  /** Remaining budget in the game's block set, after its other art (default 100). */
  maxBlocks?: number;
  prefix?: string;
}

/** Build once with every sign from every level. Returned names are local to this set. */
export function buildTiledSigns<K extends string>(
  texts: Record<K, TiledSignText>,
  options: TiledSignOptions,
): {
  blocks: Map<string, Pixels>;
  signs: Record<K, TiledSign>;
} {
  const { colors: c, lettersPerBlock: count = 5, glyphs = MICRO_GLYPHS, maxBlocks = 100, prefix = 'tiledSign' } = options;
  if (count !== 4 && count !== 5) throw new Error('A sign block holds four or five tiny letters');
  if (!Number.isInteger(maxBlocks) || maxBlocks < 0 || maxBlocks > 100) throw new Error('Sign block budget must be 0 to 100');
  const blocks = new Map<string, Pixels>();
  const signs = {} as Record<K, TiledSign>;
  const name = (id: string) => `${prefix}.${id}`;
  const add = (id: string, pic: Pixels) => {
    const key = name(id);
    if (blocks.has(key)) return key;
    if (blocks.size >= maxBlocks) throw new Error(`Signs exceed the ${maxBlocks}-block budget at ${id}`);
    blocks.set(key, pic);
    return key;
  };
  const frame = (id: string) => {
    const key = name(id);
    if (blocks.has(key)) return key;
    const p = new Pixels(20, 20, c.background);
    if (id === 'post') p.rect(8, 0, 4, 20, c.wood).rect(8, 0, 1, 20, c.highlight).rect(11, 0, 1, 20, c.shadow);
    else {
      // Vertical edges occupy the inner three pixels of their tiles. Horizontal edges
      // include paper up to the next row, so the bottom meets the post without a gap.
      const left = id.includes('left');
      const right = id.includes('right');
      const top = id.includes('top');
      const bottom = id.includes('bottom');
      if (left || right) {
        const x = left ? 17 : 0;
        p.rect(x, 0, 3, 20, c.wood);
        p.rect(left ? 17 : 2, 0, 1, 20, left ? c.highlight : c.shadow);
      } else {
        p.rect(0, 0, 20, 20, c.paper);
        p.rect(0, top ? 0 : 17, 20, 3, c.wood);
      }
      if (top) p.rect(left ? 17 : 0, 0, left || right ? 3 : 20, 1, c.highlight);
      if (bottom) p.rect(left ? 17 : 0, 19, left || right ? 3 : 20, 1, c.shadow);
    }
    return add(id, p);
  };
  const letters = (raw: string) => {
    const text = raw.toUpperCase();
    if ([...text].length > count) throw new Error(`Sign chunk "${raw}" exceeds ${count} letters`);
    const padded = text.padEnd(count, ' ');
    const key = name(`letters:${padded}`);
    if (blocks.has(key)) return key;
    const p = new Pixels(20, 20, c.paper);
    const x0 = Math.floor((20 - (count * 4 - 1)) / 2);
    [...padded].forEach((ch, k) => {
      const glyph = glyphs[ch];
      if (glyph === undefined) throw new Error(`No tiny sign glyph for "${ch}"`);
      for (let i = 0; i < 15; i++) if (glyph[i] === '1') p.set(x0 + k * 4 + (i % 3), 7 + Math.floor(i / 3), c.ink);
    });
    return add(`letters:${padded}`, p);
  };
  for (const key of Object.keys(texts) as K[]) {
    const { rows, post = true } = texts[key];
    if (!rows.length || rows.some((r) => !r.length)) throw new Error(`Sign ${key} needs nonempty rows`);
    let width = Math.max(...rows.map((r) => r.length));
    // Odd interior width gives an exact center in one block, with no split post artwork.
    if (width % 2 === 0) width++;
    const edge = (side: string) => [frame(`${side}-left`), ...Array.from({ length: width }, () => frame(side)), frame(`${side}-right`)];
    const board = [edge('top')];
    for (const row of rows) {
      const padding = Math.floor((width - row.length) / 2);
      board.push([frame('left'), ...Array.from({ length: width }, (_, x) => letters(row[x - padding] ?? '')), frame('right')]);
    }
    board.push(edge('bottom'));
    signs[key] = { board, ...(post ? { post: { x: (width + 1) / 2, block: frame('post') } } : {}) };
  }
  return { blocks, signs };
}

/** Stamp a board and its centered post into a named-block map. A taller post reuses the same tile. */
export function stampTiledSign(map: { set(x: number, y: number, block: string): unknown }, x: number, y: number, sign: TiledSign, postHeight = 1): void {
  if (!Number.isInteger(postHeight) || postHeight < 0) throw new Error('Post height must be a nonnegative integer');
  sign.board.forEach((row, dy) => row.forEach((block, dx) => map.set(x + dx, y + dy, block)));
  if (sign.post) for (let dy = 0; dy < postHeight; dy++) map.set(x + sign.post.x, y + sign.board.length + dy, sign.post.block);
}
