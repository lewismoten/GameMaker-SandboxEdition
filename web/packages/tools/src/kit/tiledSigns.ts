// Game-wide tiled signs, inspired by Stick Man Stars (Lewis Moten / Claude Sonnet 5.5).
// OpenAI Codex (GPT-6.1 Sol), directed by Lewis Moten: uniform pixels and two-line micro boards.
import { MICRO_GLYPHS, type MicroGlyphs } from '../microFont';
import { compactGlyph, microSignLayout, microSignLine } from './tiledSignFont';
import { Pixels } from './pixels';

export interface TiledSignText {
  /** Text lines split into optional chunks; joined without block padding, then whitespace normalized. */
  rows: readonly (readonly string[])[];
  post?: boolean;
  /** Override the builder’s maximum total width for this board. */
  maxWidth?: number;
}

export interface TiledSign {
  /** Frame and letters, excluding the post; block names by row. */
  board: string[][];
  /** One centered post, or none for a wall sign. */
  post?: {
    x: number;
    block: string;
    /** Second half of a post centered on a tile boundary. */
    rightBlock?: string;
  };
}

export interface TiledSignOptions {
  colors: { background: number; paper: number; ink: number; wood: number; highlight: number; shadow: number };
  /** Three uses larger 6×10 letters; four/five use the compact 3×5 font. */
  lettersPerBlock?: 3 | 4 | 5;
  /** Four 4×8 letters per block, with nine-pixel line spacing. */
  compact?: boolean;
  /** Two centered 3×5 text lines per block row, continuous across one framed board. */
  font?: 'micro';
  /** Maximum total board width in blocks, including side tiles when used. Wraps at spaces. */
  maxWidth?: number;
  glyphs?: MicroGlyphs;
  /** Remaining budget in the game's block set, after its other art (default 100). */
  maxBlocks?: number;
  prefix?: string;
}

/** Build with every sign, optionally selecting one map’s vocabulary. Names are local to this set. */
export function buildTiledSigns<K extends string, S extends K = K>(
  texts: Record<K, TiledSignText>,
  options: TiledSignOptions & { /** Allocate only these signs for a map with its own block set. */ include?: readonly S[] },
): {
  blocks: Map<string, Pixels>;
  signs: Record<S, TiledSign>;
} {
  const { colors: c, lettersPerBlock: count = 5, glyphs = MICRO_GLYPHS, maxBlocks = 100, prefix = 'tiledSign' } = options;
  if (count !== 3 && count !== 4 && count !== 5) throw new Error('A sign block holds three, four or five letters');
  if (!Number.isInteger(maxBlocks) || maxBlocks < 0 || maxBlocks > 100) throw new Error('Sign block budget must be 0 to 100');
  const { compact = false, maxWidth, font } = options;
  const micro = font === 'micro';
  if (micro && (compact || options.lettersPerBlock !== undefined)) throw new Error('Micro signs use their own four-letter rows');
  if (compact && options.lettersPerBlock !== undefined && count !== 4) throw new Error('Compact signs hold four letters per block');
  if (maxWidth !== undefined && (!Number.isInteger(maxWidth) || maxWidth < (micro ? 1 : 3)))
    throw new Error(`Sign maxWidth must be an integer of at least ${micro ? 1 : 3} blocks`);
  const blocks = new Map<string, Pixels>();
  const signs = {} as Record<S, TiledSign>;
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
  const glyphWidth = compact ? 4 : count === 3 && !micro ? 6 : 3;
  const glyphHeight = compact ? 8 : count === 3 && !micro ? 10 : 5;
  const pitch = compact ? 5 : count === 3 && !micro ? 7 : count === 4 && !micro ? 5 : 4;
  const advance = (ch: string) => (ch === ' ' && count === 3 && !compact && !micro ? 3 : pitch);
  const textWidth = (line: string) => [...line].reduce((w, ch) => w + advance(ch), 0) - pitch + glyphWidth;
  for (const key of options.include ?? (Object.keys(texts) as S[])) {
    if (!Object.hasOwn(texts, key)) throw new Error(`Unknown sign ${key}`);
    if (Object.hasOwn(signs, key)) continue;
    const { rows, post = true, maxWidth = options.maxWidth } = texts[key];
    if (maxWidth !== undefined && (!Number.isInteger(maxWidth) || maxWidth < (micro ? 1 : 3)))
      throw new Error(`Sign maxWidth must be an integer of at least ${micro ? 1 : 3} blocks`);
    let lines = rows.map((r) =>
      r
        .join('')
        .replace(/[a-z]/g, (ch) => ch.toUpperCase())
        .replace(/\s+/g, ' ')
        .trim(),
    );
    if (!lines.length || lines.some((r) => !r.length)) throw new Error(`Sign ${key} needs nonempty rows`);
    if (!micro && maxWidth !== undefined) {
      const interior = maxWidth - 2;
      const capacity = interior * 20 - 4;
      lines = lines.flatMap((line) => {
        const wrapped: string[] = [];
        let current = '';
        for (const word of line.split(' ')) {
          if (textWidth(word) > capacity) throw new Error(`Sign ${key} word "${word}" exceeds maxWidth ${maxWidth}`);
          const next = current ? `${current} ${word}` : word;
          if (textWidth(next) > capacity) {
            wrapped.push(current);
            current = word;
          } else current = next;
        }
        wrapped.push(current);
        return wrapped;
      });
    }
    const microLayout = micro ? microSignLayout(lines, maxWidth, key) : undefined;
    if (microLayout) lines = microLayout.lines;
    const microLines = microLayout ? lines.map((line) => microSignLine(line, glyphs, microLayout.width * 20 - 2)) : undefined;
    const widths = microLines ? microLines.map((line) => line.width) : lines.map(textWidth);
    let width = Math.ceil((Math.max(...widths) + 4) / 20);
    if (microLayout) width = microLayout.width;
    const board: string[][] = [];
    const height = micro ? Math.ceil(lines.length / 2) : compact ? Math.ceil((lines.length * 9 - 1 + 6) / 20) : lines.length;
    const picture = new Pixels(width * 20, height * 20, c.paper);
    lines.forEach((line, row) => {
      const x0 = Math.floor((picture.w - widths[row]) / 2);
      const y0 = micro
        ? Math.floor(row / 2) * 20 + (row === lines.length - 1 && row % 2 === 0 ? 7 : 4 + (row % 2) * 7)
        : compact
          ? Math.floor((picture.h - (lines.length * 9 - 1)) / 2) + row * 9
          : row * 20 + Math.floor((20 - glyphHeight) / 2);
      let pen = x0;
      [...line].forEach((ch, index) => {
        const glyph = glyphs[ch];
        if (glyph === undefined) throw new Error(`No tiny sign glyph for "${ch}"`);
        const ink = compact ? compactGlyph(ch, glyph) : micro ? microLines![row].glyphs[index] : glyph;
        const drawnWidth = micro ? ink.length / 5 : glyphWidth;
        for (let y = 0; y < glyphHeight; y++)
          for (let x = 0; x < drawnWidth; x++)
            if (ink[micro ? y * drawnWidth + x : compact ? y * 4 + x : Math.floor((y * 5) / glyphHeight) * 3 + Math.floor((x * 3) / glyphWidth)] === '1')
              picture.set(pen + x, y0 + y, c.ink);
        pen += micro ? drawnWidth + 1 : advance(ch);
      });
    });
    for (let row = 0; row < height; row++) {
      const top = row === 0;
      const bottom = row === height - 1;
      const side = top && bottom ? 'single' : top ? 'top' : bottom ? 'bottom' : 'middle';
      const edge = (left: boolean) => {
        const p = new Pixels(20, 20, c.background);
        const x = left ? 17 : 0;
        p.rect(x, 0, 3, 20, c.wood).rect(left ? 17 : 2, 0, 1, 20, left ? c.highlight : c.shadow);
        if (top) p.rect(x, 0, 3, 1, c.highlight);
        if (bottom) p.rect(x, 19, 3, 1, c.shadow);
        return add(`${side}-${left ? 'left' : 'right'}`, p);
      };
      const strip = picture.crop(0, row * 20, width * 20, 20);
      if (top) strip.rect(0, 0, strip.w, micro ? 1 : 3, c.wood).rect(0, 0, strip.w, 1, c.highlight);
      if (bottom) strip.rect(0, micro ? 19 : 17, strip.w, micro ? 1 : 3, c.wood).rect(0, 19, strip.w, 1, c.shadow);
      if (micro) {
        // Only the outer edges are framed; letters cross every interior tile seam.
        strip.rect(0, 0, 1, 20, c.highlight);
        strip.rect(strip.w - 1, 0, 1, 20, c.shadow);
        if (top) strip.set(strip.w - 1, 0, c.wood);
        if (bottom) strip.set(0, 19, c.wood);
      }
      const left = micro ? undefined : edge(true);
      const tiles = Array.from({ length: width }, (_, x) => add(`letters:${blocks.size}`, strip.crop(x * 20, 0, 20, 20)));
      board.push(micro ? tiles : [left!, ...tiles, edge(false)]);
    }
    const postPicture = new Pixels(40, 20, c.background).rect(18, 0, 4, 20, c.wood).rect(18, 0, 1, 20, c.highlight).rect(21, 0, 1, 20, c.shadow);
    const offset = micro ? 0 : 1;
    const pole = !post
      ? undefined
      : width % 2
        ? { x: offset + Math.floor(width / 2), block: add('post', postPicture.crop(10, 0, 20, 20)) }
        : {
            x: offset + width / 2 - 1,
            block: add('post-left', postPicture.crop(0, 0, 20, 20)),
            rightBlock: add('post-right', postPicture.crop(20, 0, 20, 20)),
          };
    signs[key] = { board, ...(post ? { post: pole } : {}) };
  }
  return { blocks, signs };
}

/** Stamp a board and its centered post into a named-block map. A taller post reuses the same tile. */
export function stampTiledSign(map: { set(x: number, y: number, block: string): unknown }, x: number, y: number, sign: TiledSign, postHeight = 1): void {
  if (!Number.isInteger(postHeight) || postHeight < 0) throw new Error('Post height must be a nonnegative integer');
  sign.board.forEach((row, dy) => row.forEach((block, dx) => map.set(x + dx, y + dy, block)));
  if (sign.post)
    for (let dy = 0; dy < postHeight; dy++) {
      map.set(x + sign.post.x, y + sign.board.length + dy, sign.post.block);
      if (sign.post.rightBlock) map.set(x + sign.post.x + 1, y + sign.board.length + dy, sign.post.rightBlock);
    }
}

/** Stack equally wide, one-row plaques on one centered post; zero height floats the stack. */
export function stampMicroPlaques(
  map: { set(x: number, y: number, block: string): unknown },
  x: number,
  y: number,
  plaques: readonly TiledSign[],
  postHeight = 1,
): void {
  if (!plaques.length) throw new Error('A plaque stack needs at least one plaque');
  if (!Number.isInteger(postHeight) || postHeight < 0) throw new Error('Post height must be a nonnegative integer');
  const width = plaques[0].board[0]?.length;
  if (plaques.some((p) => p.board.length !== 1 || p.board[0].length !== width) || (width !== 1 && width !== 2))
    throw new Error('Stacked micro plaques must be one row and the same width (1 or 2 blocks)');
  const last = plaques.at(-1)!;
  if (postHeight && !last.post) throw new Error('The bottom plaque needs a post for a mounted stack');
  plaques.forEach((plaque, i) => stampTiledSign(map, x, y + i, plaque, i === plaques.length - 1 ? postHeight : 0));
}
