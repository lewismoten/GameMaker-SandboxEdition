// Several scenes' background blocks as one .BBL. A scene uses the blocks on its map and every
// block those change into (next and touch). Two used blocks become one when their pixels and
// settings match and their next and touch blocks are one too (partition refinement, as when
// a state machine is minimized), so duplicates merge and unused blocks drop out. PLAYGAME
// runs a block's timer for its number from the scene's start, set only by its settings, so a
// merged block plays as both did. Each scene gets its map renumbered.
import { BACKBL, emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';

export interface SceneBlocks {
  blocks: Block[];
  map: GameMap;
}

export interface SharedBlocks {
  /** The shared set, BACKBL blocks (empty ones after the used). */
  blocks: Block[];
  /** Per scene, local block number to the shared one (-1: unused). */
  numbers: number[][];
  /** Per scene, its map with the shared numbers. */
  maps: GameMap[];
}

const settings = (b: Block) =>
  [b.birthMon, b.birthTime, ...b.xtra, b.solid, b.hitpt, b.scorePts, b.chHitPt, b.ntime, b.grav, b.obj, b.effect, b.eamt].join(',') + '|' + b.pixels.join(',');

/** Each scene's used block numbers: the map's, then what they change into. */
function used(s: SceneBlocks): Set<number> {
  const seen = new Set<number>();
  const todo = [...new Set(s.map.blocks)];
  while (todo.length) {
    const i = todo.pop()!;
    if (seen.has(i)) continue;
    seen.add(i);
    todo.push(s.blocks[i].nextBl, s.blocks[i].touchBl);
  }
  return seen;
}

/**
 * One set for `scenes`. Scene 0's block 0 stays block 0; a block at a number listed in `pin`
 * (such as a felt egg the desk knows by number) keeps that number. Throws when the used blocks
 * don't fit BACKBL or two different blocks want one pinned number.
 */
export function shareBlocks(scenes: SceneBlocks[], pin: number[] = []): SharedBlocks {
  const nodes: { s: number; i: number }[] = [];
  const node = new Map<string, number>();
  scenes.forEach((s, k) => {
    const u = used(s);
    if (k === 0) u.add(0);
    for (const i of [...u].sort((a, b) => a - b)) {
      node.set(`${k}:${i}`, nodes.length);
      nodes.push({ s: k, i });
    }
  });
  const blockOf = (n: { s: number; i: number }) => scenes[n.s].blocks[n.i];
  const at = (s: number, i: number) => node.get(`${s}:${i}`)!;
  // refine classes until the next and touch blocks' classes split nothing more
  const ids = (keys: string[]) => {
    const m = new Map<string, number>();
    return keys.map((k) => m.get(k) ?? (m.set(k, m.size), m.size - 1));
  };
  let cls = ids(nodes.map((n) => settings(blockOf(n))));
  for (;;) {
    const next = ids(nodes.map((n, k) => `${cls[k]}:${cls[at(n.s, blockOf(n).nextBl)]}:${cls[at(n.s, blockOf(n).touchBl)]}`));
    const done = new Set(next).size === new Set(cls).size;
    cls = next;
    if (done) break;
  }
  // number the classes: pinned first, then in order of first use
  const number = new Map<number, number>();
  nodes.forEach((n, k) => {
    if (!pin.includes(n.i) || number.has(cls[k])) return;
    if ([...number.values()].includes(n.i)) throw new Error(`Two different blocks want pinned number ${n.i}`);
    number.set(cls[k], n.i);
  });
  const taken = new Set(number.values());
  let free = 0;
  nodes.forEach((_, k) => {
    if (number.has(cls[k])) return;
    while (taken.has(free)) free++;
    number.set(cls[k], free);
    taken.add(free);
  });
  if (taken.size > BACKBL || Math.max(...taken) >= BACKBL) throw new Error(`${taken.size} shared blocks: more than ${BACKBL}`);
  const blocks = Array.from({ length: BACKBL }, (_, i) => emptyBlock(i));
  nodes.forEach((n, k) => {
    const b = blockOf(n);
    blocks[number.get(cls[k])!] = { ...b, nextBl: number.get(cls[at(n.s, b.nextBl)])!, touchBl: number.get(cls[at(n.s, b.touchBl)])! };
  });
  const numbers = scenes.map((s, k) => s.blocks.map((_, i) => (node.has(`${k}:${i}`) ? number.get(cls[at(k, i)])! : -1)));
  const maps = scenes.map((s, k) => ({ ...s.map, blocks: s.map.blocks.map((v) => numbers[k][v]) }));
  return { blocks, numbers, maps };
}
