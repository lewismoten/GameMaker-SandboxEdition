// The roads and streets of each block set, by block number: what games/realm/walkPaths.json
// lists (games/kit/walkPaths.ts) so the walkthrough's bot walks along them. A block counts when
// at least half of it is road or street (two of its four corners), bridges by their road half.
import type { BlockBook } from '../blocks/book';

const WAYS = /^(road|street):(full|(\d+))(:d)?$/;
const BRIDGE = /^bridge:\d+:(\d+)$/;
const corners = (m: number) => [1, 2, 4, 8].filter((b) => m & b).length;

/** True for a block a person would walk along, by its name in the book. */
export function isWay(name: string): boolean {
  const w = WAYS.exec(name);
  if (w) return w[2] === 'full' || corners(Number(w[3])) >= 2;
  const b = BRIDGE.exec(name);
  return !!b && corners(Number(b[1])) >= 2;
}

/** The book's road and street blocks. */
function waysOf(book: BlockBook): number[] {
  return [...book.index].filter(([name]) => isWay(name)).map(([, n]) => n);
}

/** Every block set's ways so far, by its file name: buildArea and buildWorld note theirs, build.ts writes them. */
export const WALK_PATHS: Record<string, number[]> = {};

export function noteWays(bbl: string, book: BlockBook): void {
  const ways = waysOf(book);
  if (ways.length) WALK_PATHS[bbl] = ways;
}
