// One map as the player goes through it, found by the explorer (explore.ts) playing each scene
// that uses it from every way in, with Unroll (unroll.ts) following the hero. For the map
// editor's "As players see it" picture; the printed Level Maps get theirs from levelViews.json,
// which also replays the walkthrough. No DOM (it runs in unrollWorker.ts).
import { ADVTYPE, NOSCENE, type Game } from '../../formats/game';
import { explore } from './explore';
import { startCharInfo, type FileSource } from './sim';
import { Unroll, type Unrolled, type UnrolledBox } from './unroll';

export interface MapUnroll {
  /** The map as the player goes through it, when the hero walks off an edge. */
  unrolled?: Unrolled;
  /** What the player sees, on the map itself, when the hero doesn't. */
  seen?: UnrolledBox;
  /** Every way in was explored to the end before the time ran out. */
  complete: boolean;
}

/** The places tried from each way in: plenty for a level, and it stops sooner when the time runs out. */
const MAX_NODES = 4000;

/** The scenes that play on `map` with `bbl` (lower case), and every way into them. */
function waysIn(game: Game, map: string, bbl: string): { scene: number; start: { x: number; y: number } }[] {
  const mine = (n: number) =>
    game.scenes[n]?.gametype === ADVTYPE && game.scenes[n].files[1]?.toLowerCase() === map && game.scenes[n].files[2]?.toLowerCase() === bbl;
  const out = new Map<string, { scene: number; start: { x: number; y: number } }>();
  for (const s of game.scenes)
    for (const l of s.links) if (l.toScene !== NOSCENE && mine(l.toScene)) out.set(`${l.toScene}:${l.to.x},${l.to.y}`, { scene: l.toScene, start: l.to });
  return [...out.values()];
}

/** Explores `map` from every way in, in `budgetMs` all told; `progress` hears each way in as it starts. */
export async function unrollMap(
  game: Game,
  files: FileSource,
  map: string,
  bbl: string,
  budgetMs: number,
  progress?: (done: number, total: number) => void,
): Promise<MapUnroll> {
  const ways = waysIn(game, map, bbl);
  const u = new Unroll();
  let complete = true;
  for (const [i, w] of ways.entries()) {
    progress?.(i, ways.length);
    u.cut();
    const ex = await explore(
      game,
      w.scene,
      files,
      { start: w.start, ci: startCharInfo(), clock: 1 },
      { maxNodes: MAX_NODES, budgetMs: budgetMs / ways.length, onTick: (world) => u.lookAt(world) },
    );
    complete &&= ex.complete;
  }
  progress?.(ways.length, ways.length);
  const unrolled = u.result();
  return unrolled ? { unrolled, complete } : { seen: u.seenBox(), complete };
}
