// Rank hub branches and target supplies for later gates, preserving inherited assets along links.
// Static evidence only orders
// attempts; the real engine still decides whether a route and its pickups are reachable.
import { sceneKind, type Game, type Link } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Entry } from '../explore';
import { SceneSim, type FileSource } from '../sim';
import { locksOf, sourcesOf, liveMonsterSources, type Locks } from './gates';
import { INF_REPEAT, type World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';

/** Prefer branches with local keys over branches whose unpaid gates need a different trip. */
export function preferSuppliedBranches(game: Game, files: FileSource, scene: number, entry: Entry, ways: Link[]): Link[] {
  if (ways.length < 2) return ways;
  const current = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev).w;
  const carried = current.ci;
  const debt = (link: Link): number => {
    const visited = new Set([scene, 0, 1]);
    const todo = [{ link, prev: current }];
    let missing = 0;
    while (todo.length) {
      const { link: next, prev } = todo.shift()!;
      if (visited.has(next.toScene)) continue;
      visited.add(next.toScene);
      let w: World;
      try {
        w = new SceneSim(game, next.toScene, files, next.to, carried, entry.clock, prev).w;
        const locks = locksOf(w);
        missing += locks.missing.size;
      } catch {
        // An inherited file may only be available after actually playing the preceding scene.
        continue;
      }
      for (const l of game.scenes[next.toScene].links) if (!visited.has(l.toScene) && game.scenes[l.toScene]) todo.push({ link: l, prev: w });
    }
    return missing;
  };
  const ranked = ways.map((link) => ({ link, debt: debt(link) }));
  const least = Math.min(...ranked.map((r) => r.debt));
  const supplied = ranked.filter((r) => r.debt === least).map((r) => r.link);
  const reaches = (from: number, to: number) => {
    const seen = new Set([scene, 0, 1]);
    const todo = [from];
    while (todo.length) {
      const at = todo.pop()!;
      if (seen.has(at)) continue;
      if (at === to) return true;
      seen.add(at);
      for (const link of game.scenes[at]?.links ?? []) if (!seen.has(link.toScene)) todo.push(link.toScene);
    }
    return false;
  };
  // When one choice joins another farther along, start with the earlier route.
  // Cyclic hub branches stay alternatives; this only defers one-way shortcuts.
  return supplied.filter((link) => !supplied.some((other) => other !== link && reaches(other.toScene, link.toScene) && !reaches(link.toScene, other.toScene)));
}

/** Fetch local supplies needed by an unpaid gate elsewhere before returning from a side room. */
export function suppliesForOtherScenes(game: Game, files: FileSource, scene: number, entry: Entry): Pick<Locks, 'owed' | 'wanted' | 'sources'> | undefined {
  const w = new SceneSim(game, scene, files, entry.start, entry.ci, entry.clock, entry.prev).w;
  const owed = new Map<number, number>();
  const inherited = [0, 2, 3, 4, 5, 6];
  const names = game.scenes[scene].files.slice(0, 7).map((name, slot) => name.toLowerCase() || `@entry-${slot}`);
  const todo = [{ scene, world: w, names }];
  const seen = new Set([`${scene}:${names.join('|')}`]);
  // Bound alternative inherited file combinations in cyclic scene graphs.
  while (todo.length) {
    const next = todo.shift()!;
    if (next.scene !== scene)
      for (const [counter, need] of locksOf(next.world).owed)
        if (w.ci.meter[counter] !== INF_REPEAT && w.ci.meter[counter] <= need) owed.set(counter, Math.max(owed.get(counter) ?? 0, need));
    for (const link of game.scenes[next.scene].links) {
      const target = game.scenes[link.toScene];
      if (!target || sceneKind(target) !== 'adventure') continue;
      const names = target.files.slice(0, 7).map((name, slot) => name.toLowerCase() || (inherited.includes(slot) ? next.names[slot] : '@empty-map'));
      const key = `${link.toScene}:${names.join('|')}`;
      if (seen.has(key) || seen.size >= game.scenes.length * 16) continue;
      seen.add(key);
      try {
        const world = new SceneSim(game, link.toScene, files, link.to, w.ci, entry.clock, next.world).w;
        todo.push({ scene: link.toScene, world, names });
      } catch {
        // Missing files leave this static suggestion incomplete; actual play still decides.
      }
    }
  }
  if (!owed.size) return;
  const sources = sourcesOf(w.map, w.bg, new Set(owed.keys()), liveMonsterSources(w), (n) => w.blkmap[n], w).filter((source) => {
    const price = new Map<number, number>();
    for (const p of source.price ?? []) price.set(p.counter, (price.get(p.counter) ?? 0) + p.takes);
    return [...price].every(([counter, takes]) => w.ci.meter[counter] === INF_REPEAT || w.ci.meter[counter] > takes);
  });
  const wanted = new Set(sources.map((s) => s.counter));
  return wanted.size ? { owed, wanted, sources } : undefined;
}
