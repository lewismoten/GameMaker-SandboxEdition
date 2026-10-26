// Block groups: a picture drawn across several blocks of one set (a sign, a mirror, a poster, a
// monster 2 blocks wide), with a name and a cols x rows layout. Editor-only: the groups live in
// the companion file's "groups" section of the block set, never in the .bbl/.mbl/.cbl itself.
// Pure helpers to read, change, join and split them; the block editor and the character editor
// both use them.
import { BLEN } from '../../../formats/blocks';

export interface BlockGroup {
  name: string;
  cols: number;
  rows: number;
  /** Block numbers row by row (cols x rows of them); -1 leaves a cell empty. */
  cells: number[];
}

/** The companion section the groups are kept in. */
const SECTION = 'groups';
export const MAX_SIDE = 8;

interface ExtrasStore {
  extras<T>(file: string, section: string, fallback: T): T;
  setExtras(file: string, section: string, value: unknown): void;
}

/** A stored group made safe to use: sizes clamped, cells of the right count, block numbers in range. */
function clean(g: Partial<BlockGroup>, count: number): BlockGroup | undefined {
  const side = (v: unknown) => Math.max(1, Math.min(MAX_SIDE, Math.round(Number(v)) || 1));
  const cols = side(g.cols);
  const rows = side(g.rows);
  const raw = Array.isArray(g.cells) ? g.cells : [];
  const cells = Array.from({ length: cols * rows }, (_, i) => {
    const v = Math.round(Number(raw[i]));
    return Number.isFinite(v) && v >= 0 && v < count ? v : -1;
  });
  if (!cells.some((c) => c >= 0)) return undefined;
  return { name: typeof g.name === 'string' && g.name.trim() ? g.name.trim().slice(0, 40) : 'Group', cols, rows, cells };
}

/** The set's groups (blocks numbered 0..count-1). */
export function readGroups(store: ExtrasStore, file: string, count: number): BlockGroup[] {
  const v = store.extras<unknown>(file, SECTION, []);
  return (Array.isArray(v) ? v : []).flatMap((g: Partial<BlockGroup>) => clean(g, count) ?? []);
}

export function writeGroups(store: ExtrasStore, file: string, groups: BlockGroup[]): void {
  store.setExtras(file, SECTION, groups.length ? groups.map((g) => ({ name: g.name, cols: g.cols, rows: g.rows, cells: [...g.cells] })) : undefined);
}

/** The groups that hold `block`. */
export function groupsWith(groups: BlockGroup[], block: number): BlockGroup[] {
  return groups.filter((g) => g.cells.includes(block));
}

/** Where `block` first sits in the group. */
export function cellOf(g: BlockGroup, block: number): { col: number; row: number } | undefined {
  const i = g.cells.indexOf(block);
  return i < 0 ? undefined : { col: i % g.cols, row: Math.floor(i / g.cols) };
}

/** A group of `cols` x `rows` blocks numbered on from `start`, row by row ("Group with neighbors"). */
export function neighborGroup(name: string, start: number, cols: number, rows: number, count: number): BlockGroup {
  return clean({ name, cols, rows, cells: Array.from({ length: cols * rows }, (_, i) => start + i) }, count)!;
}

/** A group of the chosen blocks, in the order given, laid out `cols` wide. */
export function groupOf(name: string, blocks: number[], cols: number, rows: number, count: number): BlockGroup | undefined {
  return clean({ name, cols, rows, cells: blocks }, count);
}

/** A layout for n blocks: 2 x 2 for four, else one row. */
export function layoutFor(n: number): { cols: number; rows: number } {
  if (n === 4) return { cols: 2, rows: 2 };
  if (n > MAX_SIDE) {
    const cols = Math.ceil(Math.sqrt(n));
    return { cols, rows: Math.ceil(n / cols) };
  }
  return { cols: Math.max(1, n), rows: 1 };
}

/** Two groups with the same layout and blocks. */
export function sameGroup(a: BlockGroup, b: BlockGroup): boolean {
  return a.cols === b.cols && a.rows === b.rows && a.cells.every((c, i) => c === b.cells[i]);
}

/** The group's blocks as one picture (cols*20 x rows*20); empty cells are `empty`. */
export function joinGroup(g: BlockGroup, blocks: { pixels: Uint8Array }[], empty: number): Uint8Array {
  const w = g.cols * BLEN;
  const out = new Uint8Array(w * g.rows * BLEN).fill(empty);
  g.cells.forEach((b, i) => {
    const px = blocks[b]?.pixels;
    if (!px) return;
    const ox = (i % g.cols) * BLEN;
    const oy = Math.floor(i / g.cols) * BLEN;
    for (let y = 0; y < BLEN; y++) out.set(px.subarray(y * BLEN, (y + 1) * BLEN), (oy + y) * w + ox);
  });
  return out;
}

/** Splits one picture back into the group's blocks; a block in the group twice takes its first cell. */
export function splitGroup(g: BlockGroup, big: Uint8Array): Map<number, Uint8Array> {
  const w = g.cols * BLEN;
  const out = new Map<number, Uint8Array>();
  g.cells.forEach((b, i) => {
    if (b < 0 || out.has(b)) return;
    const ox = (i % g.cols) * BLEN;
    const oy = Math.floor(i / g.cols) * BLEN;
    const px = new Uint8Array(BLEN * BLEN);
    for (let y = 0; y < BLEN; y++) px.set(big.subarray((oy + y) * w + ox, (oy + y) * w + ox + BLEN), y * BLEN);
    out.set(b, px);
  });
  return out;
}
