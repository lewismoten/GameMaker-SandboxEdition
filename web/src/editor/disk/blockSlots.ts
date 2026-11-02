// A block file's slots: which are blank (nothing drawn, nothing set), which are taken, and what
// moves where when one file's blocks join another's. Shared by the monster-block merge.
import { BLOCK_SIZE, emptyBlock, parseBlocks, serializeBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

/** Both blank looks: opaque (background blocks) and transparent (sprites). */
export function isBlank(b: Block, index: number): boolean {
  const s = serializeBlocks([b]);
  return [false, true].some((t) => serializeBlocks([emptyBlock(index, t)]).every((v, i) => v === s[i]));
}

export const readBlocks = (bytes: Uint8Array, count: number): Block[] => parseBlocks(bytes.subarray(0, count * BLOCK_SIZE), count);

/** A block's bytes with its two "points at itself" links normalized, to find a twin elsewhere. */
export function twinKey(b: Block, index: number): string | undefined {
  if (b.nextBl !== index || b.touchBl !== index) return undefined;
  return serializeBlocks([{ ...b, nextBl: 0, touchBl: 0 }]).join(',');
}

/** Where each of `from`'s taken blocks lands in `into`: a twin already there (or already placed), else the first blank slot. Only `needed` blocks move when given: the others are not drawn by anything. */
export function placeBlocks(
  from: Block[],
  into: Block[],
  reserved: ReadonlySet<number> = new Set(),
  needed?: ReadonlySet<number>,
): { at: Map<number, number>; fresh: number[] } | undefined {
  const twins = new Map<string, number>();
  into.forEach((b, i) => {
    const k = isBlank(b, i) ? undefined : twinKey(b, i);
    if (k && !twins.has(k)) twins.set(k, i);
  });
  const blank = into.map((b, i) => (isBlank(b, i) && !reserved.has(i) ? i : -1)).filter((i) => i >= 0);
  const at = new Map<number, number>();
  const fresh: number[] = [];
  for (let i = 0; i < from.length; i++) {
    if (isBlank(from[i], i) || (needed && !needed.has(i))) continue;
    const k = twinKey(from[i], i);
    const twin = k ? twins.get(k) : undefined;
    if (twin !== undefined) at.set(i, twin);
    else {
      const slot = blank.shift();
      if (slot === undefined) return undefined;
      at.set(i, slot);
      fresh.push(i);
      if (k) twins.set(k, slot); // a later identical block of `from` shares this slot
    }
  }
  return { at, fresh };
}
