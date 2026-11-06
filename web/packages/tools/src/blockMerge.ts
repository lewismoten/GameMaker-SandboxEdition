// Joining one background block set into another: the dropped set's drawn blocks move into the
// kept set's blank slots (a twin already there is reused), and the dropped set's maps follow
// their new numbers. The kept set is not renumbered. A block's colors are palette indices, drawn
// with whichever palette its scene shows, so no scene looks different afterward.
//
// Numbers that travel between scenes keep their number (PLAYGAME.C:2123-2133, :1969): a pickup,
// a block a sequence requires, a starting item, and block 0. They must land on the same slot, so
// they can only join a free slot of that number or an identical block already there.
import { BACKBL, emptyBlock, serializeBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';

export interface BblMergeInput {
  keep: Block[];
  drop: Block[];
  /** The dropped set's maps (every map its scenes open); each is renumbered. */
  dropMaps: GameMap[];
  /** Block numbers of the dropped set its maps draw, with everything those turn into. */
  dropUsed: ReadonlySet<number>;
  /** Numbers that must keep their number in the dropped set (pickups, required and starting inventory, 0). */
  dropPinned: ReadonlySet<number>;
  /** Slots of the kept set that are in use (drawn, linked to, or pinned): never given away even if they look blank. */
  keepUsed: ReadonlySet<number>;
}

export interface BblMerge {
  blocks: Block[];
  maps: GameMap[];
  /** Where each of the dropped set's drawn blocks is now. */
  at: Map<number, number>;
  /** The dropped blocks that moved into a slot of their own (the others reuse a twin). */
  fresh: number[];
}

/** A self-linked block's bytes, links normalized, to find an identical one elsewhere. */
const bytes = (b: Block) => serializeBlocks([{ ...b, nextBl: 0, touchBl: 0 }]).join(',');
const selfLinked = (b: Block, i: number) => b.nextBl === i && b.touchBl === i;
const isBlank = (b: Block, i: number) => {
  const mine = serializeBlocks([b]);
  return [false, true].some((t) => serializeBlocks([emptyBlock(i, t)]).every((v, k) => v === mine[k]));
};

/** The merge, or why the two sets can't share one file. */
export function mergeBackgroundSets(input: BblMergeInput): BblMerge | string {
  const { keep, drop, dropMaps, dropUsed, dropPinned, keepUsed } = input;
  const twins = new Map<string, number>();
  keep.forEach((b, i) => {
    if (!selfLinked(b, i) || (isBlank(b, i) && !keepUsed.has(i))) return;
    const k = bytes(b);
    if (!twins.has(k)) twins.set(k, i);
  });
  const free = keep.flatMap((b, i) => (isBlank(b, i) && !keepUsed.has(i) ? [i] : []));
  const at = new Map<number, number>();
  const fresh: number[] = [];
  const taken = new Set<number>();
  const take = (i: number, slot: number) => {
    at.set(i, slot);
    fresh.push(i);
    taken.add(slot);
    free.splice(free.indexOf(slot), 1);
  };
  const used = [...dropUsed].sort((a, b) => a - b);
  // numbers that travel first: same slot or an identical block there
  for (const i of used.filter((n) => dropPinned.has(n))) {
    const same = selfLinked(drop[i], i) && selfLinked(keep[i], i) && !free.includes(i) && bytes(keep[i]) === bytes(drop[i]);
    if (same) at.set(i, i);
    else if (free.includes(i)) take(i, i);
    else return `block ${i} is carried between scenes (a pickup, a required or starting item, or block 0), and number ${i} is taken in the other set`;
  }
  for (const i of used.filter((n) => !dropPinned.has(n))) {
    const twin = selfLinked(drop[i], i) ? twins.get(bytes(drop[i])) : undefined;
    if (twin !== undefined && !taken.has(twin)) at.set(i, twin);
    else {
      const slot = free[0];
      if (slot === undefined) return `their drawn blocks do not fit in one file of ${BACKBL}`;
      take(i, slot);
    }
  }
  const blocks = keep.map((b) => ({ ...b }));
  for (const i of fresh) {
    const b = { ...drop[i], pixels: drop[i].pixels.slice(), xtra: drop[i].xtra.slice() };
    const to = at.get(i)!;
    for (const k of ['nextBl', 'touchBl'] as const) {
      if (b[k] === i) b[k] = to;
      else if (at.has(b[k])) b[k] = at.get(b[k])!;
      else return `block ${i} turns into a block that is not drawn`;
    }
    blocks[to] = b;
  }
  const maps = dropMaps.map((m) => ({ ...m, blocks: m.blocks.map((v) => at.get(v) ?? v) }));
  return { blocks, maps, at, fresh };
}
