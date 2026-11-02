// Background blocks that look the same: under every palette the set is shown with, their 400
// pixels are the same colors, and their rules match (solid sides, points, timers, what they turn
// into, the monster they birth). Two such blocks can become one and the maps follow, with no
// change to what any scene shows. Blocks that have the same shape in other colors are not
// folded: a scene has one palette (PLAYGAME.C:4244), so both colors must stay. They are only
// listed, for the author to see. Pure: no DOM, no files.
import { emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';

export interface LookInput {
  blocks: Block[];
  /** Every palette (768 bytes) a scene using this set shows. */
  palettes: Uint8Array[];
  /** Block numbers the set's maps draw, plus what they turn into (the closure). */
  used: ReadonlySet<number>;
  /** Numbers that must keep their number and picture game-wide (block 0, pickups, required and starting inventory). */
  pinned: ReadonlySet<number>;
}

export interface LookGroup {
  /** The block that stays: the pinned one if any, else the lowest number. */
  keep: number;
  /** The blocks that go; each is drawn exactly as `keep` is, and plays the same. */
  fold: number[];
}

export interface LookResult {
  groups: LookGroup[];
  /** Groups left alone because two of their blocks are pinned. */
  pinnedGroups: number[][];
  /** Blocks of one shape in different colors (not folded). */
  colorVariants: number[][];
}

const rules = (b: Block) => [b.birthMon, b.birthTime, ...b.xtra, b.solid, b.hitpt, b.scorePts, b.chHitPt, b.ntime, b.grav, b.obj, b.effect, b.eamt].join(',');

/** The block's colors under each palette. */
function look(b: Block, palettes: Uint8Array[]): string {
  return palettes.map((p) => Array.from(b.pixels, (v) => `${p[v * 3]}.${p[v * 3 + 1]}.${p[v * 3 + 2]}`).join(' ')).join('|');
}

/** The pixel pattern with colors renamed in order of first appearance: equal for blocks of one shape. */
function shape(b: Block): string {
  const seen = new Map<number, number>();
  return Array.from(b.pixels, (v) => seen.get(v) ?? (seen.set(v, seen.size), seen.size - 1)).join(',');
}

export function findLookAlikes({ blocks, palettes, used, pinned }: LookInput): LookResult {
  const nums = [...used].filter((i) => blocks[i]).sort((a, b) => a - b);
  const ids = (keys: string[]) => {
    const m = new Map<string, number>();
    return keys.map((k) => m.get(k) ?? (m.set(k, m.size), m.size - 1));
  };
  const at = new Map(nums.map((n, k) => [n, k]));
  let cls = ids(nums.map((n) => look(blocks[n], palettes) + '#' + rules(blocks[n])));
  // blocks that turn into different things are different, however alike they look now
  for (;;) {
    const next = ids(nums.map((n, k) => `${cls[k]}:${cls[at.get(blocks[n].nextBl) ?? -1] ?? -1}:${cls[at.get(blocks[n].touchBl) ?? -1] ?? -1}`));
    const done = new Set(next).size === new Set(cls).size;
    cls = next;
    if (done) break;
  }
  const byClass = new Map<number, number[]>();
  nums.forEach((n, k) => byClass.set(cls[k], [...(byClass.get(cls[k]) ?? []), n]));
  const out: LookResult = { groups: [], pinnedGroups: [], colorVariants: [] };
  for (const members of byClass.values()) {
    if (members.length < 2) continue;
    const pins = members.filter((n) => pinned.has(n));
    if (pins.length > 1) out.pinnedGroups.push(members);
    else {
      const keep = pins[0] ?? members[0];
      out.groups.push({ keep, fold: members.filter((n) => n !== keep) });
    }
  }
  const byShape = new Map<string, number[]>();
  for (const n of nums) {
    if (blocks[n].pixels.every((v) => v === blocks[n].pixels[0])) continue; // a flat fill has every shape
    const k = shape(blocks[n]);
    byShape.set(k, [...(byShape.get(k) ?? []), n]);
  }
  for (const members of byShape.values()) if (new Set(members.map((n) => look(blocks[n], palettes))).size > 1) out.colorVariants.push(members);
  return out;
}

/** The set with every folded block gone: `to[n]` is where block n went (itself if it stayed), maps renumbered. */
export function applyFold(blocks: Block[], maps: GameMap[], groups: LookGroup[]): { blocks: Block[]; maps: GameMap[]; to: number[] } {
  const to = blocks.map((_, i) => i);
  for (const g of groups) for (const f of g.fold) to[f] = g.keep;
  const gone = new Set(groups.flatMap((g) => g.fold));
  const out = blocks.map((b, i) => (gone.has(i) ? emptyBlock(i) : { ...b, nextBl: to[b.nextBl] ?? b.nextBl, touchBl: to[b.touchBl] ?? b.touchBl }));
  return { blocks: out, maps: maps.map((m) => ({ ...m, blocks: m.blocks.map((v) => to[v] ?? v) })), to };
}
