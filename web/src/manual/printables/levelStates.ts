// Levels that show one place in several states (Depth Perception's near and far planes, a street
// before and after) print as one Level Map (levelMaps.ts): the player knows the place, so it is
// drawn once, from its first state, cropped to everything any state shows, with every state's
// arrivals and ways out on it. Two levels are one place when what they show overlaps (at least
// half of the smaller one) and, over all of both, at least 95% of the blocks that aren't padding
// are the same block number: the same map file, or a copy of it, drawn with another block set or
// palette. A layout that only matches with its blocks renumbered (a level built alike from other
// blocks) is another place. A course, a map that wraps, and a room with a cast stay their own.
import type { Game } from '../../formats/game';
import { MLEN } from '../../formats/map';
import { fillerBlock, markLabel, type Level } from './levelMapLayout';
import type { Rect } from './worldMapLayout';

/** The share of the blocks that must match, and of the smaller view the two views must share. */
const SAME = 0.95;
const OVERLAP = 0.5;

type Mark = Level['marks'][number];

const area = (r: Rect) => r.w * r.h;

function overlap(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

/** Can this level share a page with another state of its place? */
const mergeable = (l: Level) => !l.course && !l.unrolled && !l.cast;

/** The blocks two levels' maps differ in, over everything both show, and how many were compared (padding on both is left out). */
function compare(a: Level, b: Level): { differ: number; of: number } {
  const r = union(a.area, b.area);
  const fa = fillerBlock(a.cells);
  const fb = fillerBlock(b.cells);
  let differ = 0;
  let of = 0;
  for (let y = r.y; y < r.y + r.h; y++)
    for (let x = r.x; x < r.x + r.w; x++) {
      const ca = a.cells[y * MLEN + x];
      const cb = b.cells[y * MLEN + x];
      if (ca === fa && cb === fb) continue;
      of++;
      if (ca !== cb) differ++;
    }
  return { differ, of };
}

/** Do two levels show the same place? */
export function samePlace(a: Level, b: Level): boolean {
  if (!mergeable(a) || !mergeable(b)) return false;
  if (overlap(a.area, b.area) < OVERLAP * Math.min(area(a.area), area(b.area))) return false;
  const { differ, of } = compare(a, b);
  return of > 0 && of - differ >= SAME * of;
}

/** A state's name from its scenes' descriptions: "Near" from "5. Near: Teapot Temple". */
function stateName(game: Game, l: Level): string | undefined {
  for (const n of l.group.scenes) {
    const m = /^(?:\d+[.):-]?\s*)?([A-Za-z][A-Za-z ]{0,11}):\s/.exec(game.scenes[n]?.desc ?? '');
    if (m) return m[1].trim();
  }
  return undefined;
}

/** "a", "a and b", "a, b and c". */
const andList = (xs: string[]) => (xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** Each state's name ("near", "far"), when every one has its own; else undefined. */
function stateNames(game: Game, states: Level[]): string[] | undefined {
  const names = states.map((l) => stateName(game, l)?.toLowerCase());
  return names.every(Boolean) && new Set(names).size === names.length ? (names as string[]) : undefined;
}

/** What a merged level's caption adds: its states, what differs between them, and which one is drawn. */
function statesNote(game: Game, states: Level[], names?: string[]): string {
  const palette = (l: Level) => (game.scenes[l.scene]?.files[0] ?? '').toLowerCase();
  const differs: string[] = [];
  if (new Set(states.map((l) => l.group.bbl)).size > 1) differs.push('a block set each');
  if (new Set(states.map(palette)).size > 1) differs.push('a palette each');
  const changed = Math.max(...states.slice(1).map((l) => compare(states[0], l).differ));
  if (changed > 0) differs.push(`${changed} block${changed === 1 ? '' : 's'} change`);
  const head = names ? `${andList(names)}: one place` : `one place in ${states.length} states`;
  return `${head}${differs.length ? `, ${andList(differs)}` : ''}; drawn as ${names ? names[0] : `in scene ${states[0].scene}`}`;
}

/** The scenes of `l` with a link out of the mark's blocks to one of its scenes. */
function sources(game: Game, l: Level, m: Mark): number[] {
  const out = l.group.scenes.filter((n) =>
    game.scenes[n].links.some((k) => m.scenes.includes(k.toScene) && k.from.x >= m.x && k.from.y >= m.y && k.from.x < m.x + m.w && k.from.y < m.y + m.h),
  );
  return out.length ? out : l.group.scenes;
}

/**
 * Every state's marks on one map: marks of one kind on the same blocks are one mark (their scenes
 * joined); a way out only some states have says which it leaves from, by name ("→20 from far")
 * or scene ("→7 from 3").
 */
function mergedMarks(game: Game, states: Level[], names?: string[]): Mark[] {
  const all = new Map<string, { mark: Mark; from: Set<number>; in: Set<number> }>();
  for (const [i, l] of states.entries())
    for (const m of l.marks) {
      const key = `${m.kind}:${m.x},${m.y},${m.w},${m.h}:${m.text ?? ''}`;
      const at = all.get(key) ?? { mark: { ...m, scenes: [] }, from: new Set<number>(), in: new Set<number>() };
      at.mark.scenes = [...new Set([...at.mark.scenes, ...m.scenes])].sort((a, b) => a - b);
      if (m.kind === 'exit') for (const n of sources(game, l, m)) at.from.add(n);
      at.in.add(i);
      all.set(key, at);
    }
  const order = { start: 0, exit: 1, end: 2 };
  const fromText = (from: Set<number>, seen: Set<number>) =>
    names
      ? andList([...seen].sort((a, b) => a - b).map((i) => names[i]))
      : markLabel(
          game,
          [...from].sort((a, b) => a - b),
        );
  return [...all.values()]
    .map(({ mark, from, in: seen }) =>
      mark.kind !== 'exit' || seen.size === states.length || mark.text
        ? mark
        : { ...mark, text: `${markLabel(game, mark.scenes)} from ${fromText(from, seen)}` },
    )
    .sort((a, b) => order[a.kind] - order[b.kind] || a.y - b.y || a.x - b.x);
}

/** One Level Map for levels that show one place: drawn from the first, every scene named, cropped to all their views, every mark kept. */
function merge(game: Game, states: Level[]): Level {
  const [first] = states;
  const scenes = states.flatMap((l) => l.group.scenes).sort((a, b) => a - b);
  const names = stateNames(game, states);
  const note = statesNote(game, states, names);
  return {
    ...first,
    group: { ...first.group, scenes },
    area: states.map((l) => l.area).reduce(union),
    whole: states.map((l) => l.whole).reduce(union),
    marks: mergedMarks(game, states, names),
    name: game.scenes[scenes[0]]?.desc || first.name,
    note: first.note ? `${first.note} · ${note}` : note,
    states: states.length,
  };
}

/** The levels to print with each place shown once: levels that are states of one place (samePlace with the first of them) become one, where the first was. */
export function mergeStates(game: Game, levels: Level[]): Level[] {
  const groups: Level[][] = [];
  for (const l of levels) {
    const g = groups.find((x) => samePlace(x[0], l));
    if (g) g.push(l);
    else groups.push([l]);
  }
  return groups.map((g) => (g.length > 1 ? merge(game, g) : g[0]));
}
