// Rank hub branches by unpaid gates, stopping at the hub again. Static evidence only orders
// attempts; the real engine still decides whether a route and its pickups are reachable.
import type { Game, Link } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Entry } from '../explore';
import { SceneSim, type FileSource } from '../sim';
import { locksOf } from './gates';

/** Prefer branches with local keys over branches whose unpaid gates need a different trip. */
export function preferSuppliedBranches(game: Game, files: FileSource, scene: number, entry: Entry, ways: Link[]): Link[] {
  if (ways.length < 2) return ways;
  const carried = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev).w.ci;
  const debt = (link: Link): number => {
    const visited = new Set([scene, 0, 1]);
    const todo = [link];
    let missing = 0;
    while (todo.length) {
      const next = todo.shift()!;
      if (visited.has(next.toScene)) continue;
      visited.add(next.toScene);
      try {
        const w = new SceneSim(game, next.toScene, files, next.to, carried, entry.clock, entry.prev).w;
        const locks = locksOf(w);
        missing += locks.missing.size;
      } catch {
        // An inherited file may only be available after actually playing the preceding scene.
        continue;
      }
      for (const l of game.scenes[next.toScene].links) if (!visited.has(l.toScene) && game.scenes[l.toScene]) todo.push(l);
    }
    return missing;
  };
  const ranked = ways.map((link) => ({ link, debt: debt(link) }));
  const least = Math.min(...ranked.map((r) => r.debt));
  return ranked.filter((r) => r.debt === least).map((r) => r.link);
}
