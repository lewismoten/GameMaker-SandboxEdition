// Which scenes the player's World Map (worldMap.ts) shows as places, and which it folds into
// the place they belong to. A scene shown under an all-black palette is never seen: its intro
// is a conversation, a sign or a passage, and it hands the player straight back (realm's
// people, Snowbound's pines, the Teddy games' drives). It folds into the linked scene that
// shares its map, else the one it leads to, else the one that leads to it. A game can also
// name its places itself in printables.json ("worldMap": { "groups": [...] }). Folded scenes
// are listed on their place's land by name and number; the map's "Every scene" view keeps them all.
import { ENDTYPE, NOSCENE, STARTTYPE, type Game, type Link } from '../../formats/game';
import type { Graph } from '../../editor/editors/integrator/layoutCells';
import type { WorldMapHints } from './types';

export interface Grouping {
  /** Folded scene -> the place it's shown on. */
  hostOf: Map<number, number>;
  /** Place -> the scenes folded into it, in scene order. */
  folded: Map<number, number[]>;
  /** A place's own name for the map, when the game gives one. */
  names: Map<number, string>;
  /** A place's labels, when the game gives them (otherwise its folded scenes' names). */
  labels: Map<number, string[]>;
}

/** True for a palette (768 bytes of 6-bit RGB) that is black all through. */
export function isBlackPalette(pal: Uint8Array | undefined): boolean {
  return !!pal && pal.length >= 768 && pal.subarray(0, 768).every((v) => v === 0);
}

/** A hint's scene reference to scene numbers: 12, "9-18", or a scene's name when only one scene has it. */
export function sceneRefs(game: Game, ref: number | string): number[] {
  if (typeof ref === 'number') return [ref];
  const range = /^(\d+)\s*-\s*(\d+)$/.exec(ref.trim());
  if (range) {
    const [a, b] = [+range[1], +range[2]];
    return Array.from({ length: Math.abs(b - a) + 1 }, (_, k) => Math.min(a, b) + k);
  }
  const want = ref.trim().toLowerCase();
  const hits = game.scenes.flatMap((s, i) => (s.gametype !== NOSCENE && s.desc.trim().toLowerCase() === want ? [i] : []));
  return hits.length === 1 ? hits : [];
}

/** Problems with a game's hints (unknown or repeated scenes, a title or end screen folded): empty when they're fine. */
export function hintProblems(game: Game, hints: WorldMapHints | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<number>();
  for (const [k, g] of (hints?.groups ?? []).entries()) {
    for (const ref of g.scenes) {
      const ids = sceneRefs(game, ref);
      if (!ids.length) out.push(`group ${k + 1}: no single scene "${ref}"`);
      for (const i of ids) {
        const s = game.scenes[i];
        if (!s || s.gametype === NOSCENE) out.push(`group ${k + 1}: scene ${i} isn't used`);
        else if (s.gametype === STARTTYPE || s.gametype === ENDTYPE) out.push(`group ${k + 1}: scene ${i} is the title or the end`);
        if (seen.has(i)) out.push(`group ${k + 1}: scene ${i} is in two groups`);
        seen.add(i);
      }
    }
  }
  return out;
}

/**
 * The player's places. `dark(i)` says scene i is shown under a black palette. The game's own
 * groups come first (their first scene is the place); a dark scene not in one folds as above,
 * following its host on if that folds too.
 */
export function groupScenes(game: Game, graph: Graph, dark: (i: number) => boolean, hints?: WorldMapHints): Grouping {
  const adventure = (i: number) => graph.nodes.includes(i) && game.scenes[i].gametype !== STARTTYPE && game.scenes[i].gametype !== ENDTYPE;
  const hostOf = new Map<number, number>();
  const names = new Map<number, string>();
  const labels = new Map<number, string[]>();
  const hinted = new Set<number>();
  for (const g of hints?.groups ?? []) {
    const ids = g.scenes.flatMap((r) => sceneRefs(game, r)).filter(adventure);
    if (!ids.length) continue;
    const [place, ...rest] = ids;
    ids.forEach((i) => hinted.add(i));
    for (const i of rest) if (i !== place) hostOf.set(i, place);
    if (g.name) names.set(place, g.name);
    if (g.labels) labels.set(place, g.labels);
  }
  const map = (i: number) => game.scenes[i].files[1]?.toLowerCase() ?? '';
  for (const i of graph.nodes) {
    if (hinted.has(i) || !adventure(i) || !dark(i)) continue;
    const outs = (graph.out.get(i) ?? []).filter(adventure);
    const ins = (graph.inn.get(i) ?? []).filter(adventure);
    const near = [...outs, ...ins];
    const host = near.find((n) => map(n) === map(i)) ?? outs[0] ?? ins[0];
    if (host !== undefined) hostOf.set(i, host);
  }
  // a host that folds too hands its scenes on (a loop of dark scenes keeps its first one)
  const resolve = (i: number): number => {
    const path = new Set<number>([i]);
    let h = hostOf.get(i)!;
    while (hostOf.has(h) && !path.has(h)) (path.add(h), (h = hostOf.get(h)!));
    return path.has(h) ? Math.min(...path) : h;
  };
  for (const i of [...hostOf.keys()]) hostOf.set(i, resolve(i));
  for (const [i, h] of [...hostOf]) if (i === h) hostOf.delete(i);
  const folded = new Map<number, number[]>();
  for (const [i, h] of [...hostOf].sort((a, b) => a[0] - b[0])) folded.set(h, [...(folded.get(h) ?? []), i]);
  return { hostOf, folded, names, labels };
}

/** The game as the player's map sees it: folded scenes gone, every link to one led to its place instead. */
export function placesGame(game: Game, g: Grouping): Game {
  if (!g.hostOf.size) return game;
  const to = (l: Link): Link => (g.hostOf.has(l.toScene) ? { ...l, toScene: g.hostOf.get(l.toScene)! } : l);
  return {
    ...game,
    scenes: game.scenes.map((s, i) =>
      g.hostOf.has(i)
        ? { ...s, gametype: NOSCENE, links: [] }
        : {
            ...s,
            desc: g.names.get(i) ?? s.desc,
            // a place also leads wherever its folded scenes do
            links: [...s.links, ...(g.folded.get(i) ?? []).flatMap((f) => game.scenes[f].links)].map(to),
          },
    ),
  };
}

/** What a place's land says about the scenes folded into it: "6 Grandma Pim", one name once ("11, 16 Ms. Pagely"). */
export function placeLabels(game: Game, g: Grouping, place: number): string[] {
  const own = g.labels.get(place);
  if (own) return own;
  const byName = new Map<string, number[]>();
  for (const i of g.folded.get(place) ?? []) {
    const name = game.scenes[i].desc.trim() || 'Untitled';
    byName.set(name, [...(byName.get(name) ?? []), i]);
  }
  return [...byName].map(([name, ids]) => `${ids.join(', ')} ${name}`);
}
