// The World Map's regions (worldMap.ts): places that belong together, drawn as one sector,
// neighborhood, set of rooms or land, and lettered with its name. A hub and the dead ends off
// it (a sector's worlds, a wing's books) are one; so are a level's scenes when the game gives
// each level a palette of its own; so are linked scenes that share a map (a map every part of
// the game passes through, like a passage, doesn't count).
import { ENDTYPE, STARTTYPE, type Game } from '../../formats/game';
import type { Graph } from '../../editor/editors/integrator/layoutCells';
import { sceneLabel } from './worldMapGroups';

interface Region {
  /** Its places, the first one naming it. */
  ids: number[];
  name: string;
}

/** Linked places with the same key, each group in scene order. */
function linkedGroups(ids: number[], key: (i: number) => string | undefined, g: Graph): number[][] {
  const parent = new Map(ids.map((i) => [i, i]));
  const find = (i: number): number => (parent.get(i) === i ? i : find(parent.get(i)!));
  for (const [a, b] of g.pairs) {
    if (!parent.has(a) || !parent.has(b) || !key(a) || key(a) !== key(b)) continue;
    const [ra, rb] = [find(a), find(b)];
    if (ra !== rb) parent.set(Math.max(ra, rb), Math.min(ra, rb));
  }
  const groups = new Map<number, number[]>();
  for (const i of [...ids].sort((a, b) => a - b)) groups.set(find(i), [...(groups.get(find(i)) ?? []), i]);
  return [...groups.values()];
}

/** The regions of a game's places (`g`, the graph of its places). */
export function regionsOf(game: Game, g: Graph): Region[] {
  const adventure = (i: number) => game.scenes[i].gametype !== STARTTYPE && game.scenes[i].gametype !== ENDTYPE;
  const near = (i: number) => new Set([...(g.out.get(i) ?? []), ...(g.inn.get(i) ?? [])]);
  const out: Region[] = [];
  const taken = new Set<number>();
  const add = (ids: number[]) => {
    out.push({ ids, name: sceneLabel(game.scenes[ids[0]].desc) });
    ids.forEach((i) => taken.add(i));
  };
  // a hub and its dead ends
  for (const hub of g.nodes.filter(adventure)) {
    const ends = [...near(hub)].filter((i) => adventure(i) && !taken.has(i) && near(i).size === 1).sort((a, b) => a - b);
    if (ends.length >= 3) add([hub, ...ends]);
  }
  const free = () => g.nodes.filter((i) => adventure(i) && !taken.has(i));
  // a level's own palette, when the game has several levels of a few scenes each
  const pal = (i: number) => game.scenes[i].files[0]?.toLowerCase() || undefined;
  const byPal = linkedGroups(free(), pal, g);
  if (byPal.length >= 3 && byPal.every((r) => r.length <= g.nodes.length * 0.4)) byPal.filter((r) => r.length >= 2).forEach(add);
  // linked scenes on one map, unless the map turns up all over the game
  const map = (i: number) => game.scenes[i].files[1]?.toLowerCase() || undefined;
  const byMap = linkedGroups(free(), map, g).filter((r) => r.length >= 2);
  const seen = new Map<string, number>();
  for (const r of byMap) seen.set(map(r[0])!, (seen.get(map(r[0])!) ?? 0) + 1);
  byMap.filter((r) => seen.get(map(r[0])!)! < 3).forEach(add);
  return out;
}
