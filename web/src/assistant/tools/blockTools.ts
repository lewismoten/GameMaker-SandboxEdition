// Tools for block sets (.bbl scenery, .mbl monster and .cbl hero pictures): each block's
// properties (BLOC.H blkstruct) and its 20 x 20 picture as palette numbers.
import { BLEN, BLOCK_COUNTS, newBlockSet, parseBlocks, serializeBlocks, type Block, type BlockKind } from '../../formats/blocks';
import { DRY_RUN, commit } from './run';
import { FILE, fileName, int, intRows, need } from './common';
import { json, ToolError, type JsonSchema, type ToolDef } from './types';

/** Each property's argument name, its Block field and a few words. */
const PROPS: [arg: string, field: keyof Block, about: string, min: number, max: number][] = [
  ['solid', 'solid', 'Solid sides: 1 top, 2 right, 4 bottom, 8 left (15 all).', 0, 15],
  ['gravity', 'grav', 'Gravity pull: 1 up, 2 right, 4 down, 8 left (0 none).', -128, 127],
  ['score', 'scorePts', 'Points when touched.', -32768, 32767],
  ['hit_points', 'chHitPt', 'Hit points added when touched (negative hurts).', -32768, 32767],
  ['touch_block', 'touchBl', 'Block it turns into when touched (itself: unchanged).', 0, 255],
  ['next_block', 'nextBl', 'Block it animates into after next_time ticks (itself: never).', 0, 255],
  ['next_time', 'ntime', 'Ticks (1/18 s) before next_block.', 0, 32767],
  ['pickup', 'obj', '1: the hero can pick it up.', 0, 255],
  ['effect', 'effect', 'Counter it changes: 1 lives, 3 money, 5-19 sequence counters, 20-29 extra.', 0, 255],
  ['effect_amount', 'eamt', 'How much the counter changes.', -32768, 32767],
  ['birth_monster', 'birthMon', 'Monster number it gives birth to.', 0, 255],
  ['birth_time', 'birthTime', 'Ticks between births (0 never).', 0, 32767],
];

function kindOf(name: string): BlockKind {
  const k = name.slice(-3) as BlockKind;
  if (!(k in BLOCK_COUNTS)) throw new ToolError(`${name} is not a block set (.bbl, .mbl or .cbl).`);
  return k;
}

function propsOf(b: Block): Record<string, number> {
  return Object.fromEntries(PROPS.map(([arg, field]) => [arg, b[field] as number]));
}

const pixelRows = (b: Block) => Array.from({ length: BLEN }, (_, y) => [...b.pixels.subarray(y * BLEN, y * BLEN + BLEN)]);

const isPlain = (b: Block, i: number, kind: BlockKind) => {
  const blank = newBlockSet(kind)[i];
  return b.pixels.every((p) => p === blank.pixels[0]) && PROPS.every(([, f]) => b[f] === blank[f]);
};

const listBlocks: ToolDef = {
  name: 'list_blocks',
  description: 'A block set’s blocks that are drawn or have properties, with their properties (not their pixels).',
  inputSchema: { type: 'object', properties: { file: FILE }, required: ['file'] },
  async run(a, ctx) {
    const name = fileName(a.file);
    const kind = kindOf(name);
    const blocks = parseBlocks(need(ctx, name), BLOCK_COUNTS[kind]);
    return json({
      file: name,
      count: blocks.length,
      blocks: blocks.flatMap((b, index) => (isPlain(b, index, kind) ? [] : [{ index, ...propsOf(b), colors: new Set(b.pixels).size }])),
    });
  },
};

const getBlock: ToolDef = {
  name: 'get_block',
  description: 'One block: its properties and its 20 rows of 20 palette numbers (255 is see-through in .mbl/.cbl).',
  inputSchema: { type: 'object', properties: { file: FILE, index: int('Block number.', 0, 149) }, required: ['file', 'index'] },
  async run(a, ctx) {
    const name = fileName(a.file);
    const kind = kindOf(name);
    const blocks = parseBlocks(need(ctx, name), BLOCK_COUNTS[kind]);
    const b = blocks[a.index as number];
    if (!b) throw new ToolError(`${name} has blocks 0-${blocks.length - 1}.`);
    return json({ file: name, index: a.index, ...propsOf(b), pixels: pixelRows(b) });
  },
};

const setBlock: ToolDef = {
  name: 'set_block',
  description: 'Changes one block’s properties and/or picture (20 rows of 20 palette numbers, or one fill color). Makes the block set if it is new.',
  writes: true,
  inputSchema: {
    type: 'object',
    properties: {
      file: FILE,
      index: int('Block number.', 0, 149),
      ...Object.fromEntries(
        PROPS.map(([arg, , description, minimum, maximum]): [string, JsonSchema] => [arg, { type: 'integer', description, minimum, maximum }]),
      ),
      pixels: intRows('20 rows of 20 palette numbers (0-255).', BLEN),
      fill_color: int('Paint the whole block this palette number.', 0, 255),
      dry_run: DRY_RUN,
    },
    required: ['file', 'index'],
  },
  async run(a, ctx) {
    const name = fileName(a.file);
    const kind = kindOf(name);
    const had = ctx.files.get(name);
    const blocks = had ? parseBlocks(had, BLOCK_COUNTS[kind]) : newBlockSet(kind);
    const i = a.index as number;
    const b = blocks[i];
    if (!b) throw new ToolError(`${name} has blocks 0-${blocks.length - 1}.`);
    const changed: string[] = [];
    for (const [arg, field] of PROPS)
      if (typeof a[arg] === 'number') {
        (b as unknown as Record<string, number>)[field] = a[arg];
        changed.push(arg);
      }
    if (typeof a.fill_color === 'number') (b.pixels.fill(a.fill_color), changed.push('fill'));
    if (a.pixels) {
      const rows = a.pixels as number[][];
      if (rows.length !== BLEN || rows.some((r) => r.length !== BLEN)) throw new ToolError('pixels must be 20 rows of 20 numbers.');
      rows.forEach((r, y) => r.forEach((c, x) => (b.pixels[y * BLEN + x] = c)));
      changed.push('pixels');
    }
    return commit(ctx, a, { summary: `Block ${i} of ${name}: ${changed.join(', ') || 'nothing'}`, files: { [name]: serializeBlocks(blocks) } });
  },
};

export const BLOCK_TOOLS: ToolDef[] = [listBlocks, getBlock, setBlock];
