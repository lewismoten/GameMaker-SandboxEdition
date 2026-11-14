// Game-wide tiled signs, inspired by Stick Man Stars (Lewis Moten / Claude Sonnet 5.5).
// OpenAI Codex separated the frame from the shared 3x5 letter tiles and centered post.
import { MICRO_GLYPHS, type MicroGlyphs } from '../microFont';
import { Pixels } from './pixels';

export interface TiledSignText {
  /** Text lines split into optional chunks; joined without block padding, then whitespace normalized. */
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
  /** Three uses larger 5×10 letters; four/five use the compact 3×5 font. */
  lettersPerBlock?: 3 | 4 | 5;
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
  if (count !== 3 && count !== 4 && count !== 5) throw new Error('A sign block holds three, four or five letters');
  if (!Number.isInteger(maxBlocks) || maxBlocks < 0 || maxBlocks > 100) throw new Error('Sign block budget must be 0 to 100');
  const blocks = new Map<string, Pixels>();
  const signs = {} as Record<K, TiledSign>;
  const pictures = new Map<string, string>();
  const add = (id: string, pic: Pixels) => {
    // Centering can split a glyph across tiles. Deduplicate actual pixels, including
    // blank tiles and repeated fragments, rather than assuming chunks align to blocks.
    const pixels = pic.px.join(',');
    const shared = pictures.get(pixels);
    if (shared) return shared;
    if (blocks.size >= maxBlocks) throw new Error(`Signs exceed the ${maxBlocks}-block budget at ${id}`);
    const key = `${prefix}.${id}`;
    blocks.set(key, pic);
    pictures.set(pixels, key);
    return key;
  };
  const glyphWidth = count === 3 ? 5 : 3;
  const glyphHeight = count === 3 ? 10 : 5;
  const pitch = count === 3 ? 6 : count === 4 ? 5 : 4;
  for (const key of Object.keys(texts) as K[]) {
    const { rows, post = true } = texts[key];
    const lines = rows.map((r) => r.join('').toUpperCase().replace(/\s+/g, ' ').trim());
    if (!lines.length || lines.some((r) => !r.length)) throw new Error(`Sign ${key} needs nonempty rows`);
    const widths = lines.map((line) => ([...line].length - 1) * pitch + glyphWidth);
    let width = Math.ceil((Math.max(...widths) + 4) / 20);
    // Odd interior width puts the shared post exactly under the center block.
    if (post && width % 2 === 0) width++;
    const board: string[][] = [];
    lines.forEach((line, row) => {
      const top = row === 0;
      const bottom = row === lines.length - 1;
      const side = top && bottom ? 'single' : top ? 'top' : bottom ? 'bottom' : 'middle';
      const edge = (left: boolean) => {
        const p = new Pixels(20, 20, c.background);
        const x = left ? 17 : 0;
        p.rect(x, 0, 3, 20, c.wood).rect(left ? 17 : 2, 0, 1, 20, left ? c.highlight : c.shadow);
        if (top) p.rect(x, 0, 3, 1, c.highlight);
        if (bottom) p.rect(x, 19, 3, 1, c.shadow);
        return add(`${side}-${left ? 'left' : 'right'}`, p);
      };
      const strip = new Pixels(width * 20, 20, c.paper);
      if (top) strip.rect(0, 0, strip.w, 3, c.wood).rect(0, 0, strip.w, 1, c.highlight);
      if (bottom) strip.rect(0, 17, strip.w, 3, c.wood).rect(0, 19, strip.w, 1, c.shadow);
      const x0 = Math.floor((strip.w - widths[row]) / 2);
      const y0 = Math.floor((20 - glyphHeight) / 2);
      [...line].forEach((ch, k) => {
        const glyph = glyphs[ch];
        if (glyph === undefined) throw new Error(`No tiny sign glyph for "${ch}"`);
        for (let y = 0; y < glyphHeight; y++)
          for (let x = 0; x < glyphWidth; x++)
            if (glyph[Math.floor((y * 5) / glyphHeight) * 3 + Math.floor((x * 3) / glyphWidth)] === '1') strip.set(x0 + k * pitch + x, y0 + y, c.ink);
      });
      board.push([edge(true), ...Array.from({ length: width }, (_, x) => add(`letters:${blocks.size}`, strip.crop(x * 20, 0, 20, 20))), edge(false)]);
    });
    const postBlock = () => add('post', new Pixels(20, 20, c.background).rect(8, 0, 4, 20, c.wood).rect(8, 0, 1, 20, c.highlight).rect(11, 0, 1, 20, c.shadow));
    signs[key] = { board, ...(post ? { post: { x: (width + 1) / 2, block: postBlock() } } : {}) };
  }
  return { blocks, signs };
}

/** Stamp a board and its centered post into a named-block map. A taller post reuses the same tile. */
export function stampTiledSign(map: { set(x: number, y: number, block: string): unknown }, x: number, y: number, sign: TiledSign, postHeight = 1): void {
  if (!Number.isInteger(postHeight) || postHeight < 0) throw new Error('Post height must be a nonnegative integer');
  sign.board.forEach((row, dy) => row.forEach((block, dx) => map.set(x + dx, y + dy, block)));
  if (sign.post) for (let dy = 0; dy < postHeight; dy++) map.set(x + sign.post.x, y + sign.board.length + dy, sign.post.block);
}
