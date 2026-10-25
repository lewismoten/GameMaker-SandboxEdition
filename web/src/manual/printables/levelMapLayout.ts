// The arithmetic behind the printed Level Maps (levelMaps.ts): which scenes share a map, the part
// of the 100 x 100 map a level really uses and the part of it the player sees (levelViews.ts), the ground drawn over the blocks that must stay
// hidden (levelSecrets.ts), the marks for where you arrive and the ways out, and how the maps
// pack onto printed pages. No DOM, so it is tested on the real disks.
import { BACKBL, parseBlocks, type Block } from '../../formats/blocks';
import { ADVTYPE, ENDTYPE, NOSCENE, STARTTYPE, type Game, type Point } from '../../formats/game';
import { MLEN, MWID, parseMap } from '../../formats/map';
import type { Rect } from './worldMapLayout';
import type { SeenRect } from './levelViews';
import { unrolledAt, type Unrolled } from '../../editor/check/unroll';

/** The scenes that play on one map with one block set: one Level Map. */
interface MapGroup {
  /** The map file, lower case. */
  map: string;
  bbl: string;
  /** Its scenes, in game order; the first one's palette draws it. */
  scenes: number[];
}

/** Every map a level plays on, in the order its first scene comes in the game. */
export function mapGroups(game: Game): MapGroup[] {
  const out = new Map<string, MapGroup>();
  game.scenes.forEach((s, i) => {
    if (s.gametype !== ADVTYPE || !s.files[1] || !s.files[2]) return;
    const map = s.files[1].toLowerCase();
    const bbl = s.files[2].toLowerCase();
    const key = `${map}|${bbl}`;
    const g = out.get(key) ?? { map, bbl, scenes: [] };
    g.scenes.push(i);
    out.set(key, g);
  });
  return [...out.values()];
}

/** The block a map is padded with: the commonest one round its edge. */
export function fillerBlock(cells: ArrayLike<number>): number {
  const counts = new Map<number, number>();
  const count = (x: number, y: number) => counts.set(cells[y * MLEN + x], (counts.get(cells[y * MLEN + x]) ?? 0) + 1);
  for (let x = 0; x < MLEN; x++) (count(x, 0), count(x, MWID - 1));
  for (let y = 1; y < MWID - 1; y++) (count(0, y), count(MLEN - 1, y));
  let best = 0;
  let most = -1;
  for (const [b, n] of counts) if (n > most || (n === most && b < best)) ((best = b), (most = n));
  return best;
}

/**
 * The part of the map in use, in cells: everything that isn't the edge's padding block, and
 * the cells in `keep` (arrivals, ways out), with `pad` cells round it, inside the map.
 */
export function usedArea(cells: ArrayLike<number>, keep: Point[] = [], pad = 1): Rect {
  const filler = fillerBlock(cells);
  let x0 = MLEN;
  let y0 = MWID;
  let x1 = -1;
  let y1 = -1;
  const take = (x: number, y: number) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) if (cells[y * MLEN + x] !== filler) take(x, y);
  for (const p of keep) if (p.x >= 0 && p.y >= 0 && p.x < MLEN && p.y < MWID) take(p.x, p.y);
  if (x1 < 0) return { x: 0, y: 0, w: MLEN, h: MWID };
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(MLEN - 1, x1 + pad);
  y1 = Math.min(MWID - 1, y1 + pad);
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * The map's background blocks with every secret one drawn as plain ground: what it turns
 * into when touched (a tin heart or an egg's touch block is the ground under it), else the
 * commonest of its neighbours that isn't secret, else the padding. Also returns the cells it
 * covered, which are never marked.
 */
export function hideSecrets(cells: ArrayLike<number>, blocks: Block[], secret: ReadonlySet<number>): { cells: Uint8Array; hidden: Set<number> } {
  const out = Uint8Array.from(cells);
  const hidden = new Set<number>();
  if (!secret.size) return { cells: out, hidden };
  const filler = fillerBlock(cells);
  for (let i = 0; i < out.length; i++) {
    const b = cells[i];
    if (!secret.has(b)) continue;
    hidden.add(i);
    const t = blocks[b]?.touchBl;
    if (t !== undefined && t !== b && !secret.has(t)) {
      out[i] = t;
      continue;
    }
    const x = i % MLEN;
    const y = (i / MLEN) | 0;
    const around = new Map<number, number>();
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= MLEN || ny >= MWID) continue;
      const n = cells[ny * MLEN + nx];
      if (!secret.has(n)) around.set(n, (around.get(n) ?? 0) + 1);
    }
    out[i] = [...around].sort((a, b2) => b2[1] - a[1] || a[0] - b2[0])[0]?.[0] ?? filler;
  }
  return { cells: out, hidden };
}

/**
 * The used area cut down to what the player sees (`seen`, from levelViews.json) with `pad` cells
 * round it, but never so far that a mark (an arrival or a way out) is cut off.
 */
export function seenArea(used: Rect, seen: SeenRect, marks: { x: number; y: number; w: number; h: number }[], pad = 1): Rect {
  let x0 = seen[0];
  let y0 = seen[1];
  let x1 = seen[0] + seen[2] - 1;
  let y1 = seen[1] + seen[3] - 1;
  for (const m of marks) {
    x0 = Math.min(x0, m.x);
    y0 = Math.min(y0, m.y);
    x1 = Math.max(x1, m.x + m.w - 1);
    y1 = Math.max(y1, m.y + m.h - 1);
  }
  x0 = Math.max(used.x, x0 - pad);
  y0 = Math.max(used.y, y0 - pad);
  x1 = Math.min(used.x + used.w - 1, x1 + pad);
  y1 = Math.min(used.y + used.h - 1, y1 + pad);
  return x1 < x0 || y1 < y0 ? used : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

type MarkKind = 'start' | 'exit' | 'end';

/** A mark on a Level Map: where you arrive (in `scenes`), or a way out (to `scenes`). */
interface LevelMark extends Point {
  kind: MarkKind;
  scenes: number[];
  /** Cells across and down: side-by-side cells going the same way are one mark (a wide door). */
  w: number;
  h: number;
}

/**
 * The marks for a map: where the hero arrives in each of its scenes (the "to" block of every
 * link into it) and every way out (a link's "from" block, to the scenes it leads to; the end
 * of the game is its own kind). A cell in `hidden` is never marked.
 */
export function levelMarks(game: Game, scenes: number[], hidden: ReadonlySet<number> = new Set()): LevelMark[] {
  const marks = new Map<string, LevelMark>();
  const put = (kind: MarkKind, p: Point, scene: number) => {
    if (p.x < 0 || p.y < 0 || p.x >= MLEN || p.y >= MWID || hidden.has(p.y * MLEN + p.x)) return;
    const key = `${kind}:${p.x},${p.y}`;
    const m = marks.get(key) ?? { kind, x: p.x, y: p.y, scenes: [], w: 1, h: 1 };
    if (!m.scenes.includes(scene)) m.scenes.push(scene);
    marks.set(key, m);
  };
  const mine = new Set(scenes);
  const real = (n: number) => n !== NOSCENE && !!game.scenes[n] && game.scenes[n].gametype !== NOSCENE;
  game.scenes.forEach((s) => {
    for (const l of s.links) if (real(l.toScene) && mine.has(l.toScene)) put('start', l.to, l.toScene);
  });
  for (const i of scenes)
    for (const l of game.scenes[i].links) {
      if (!real(l.toScene)) continue;
      put(game.scenes[l.toScene].gametype === ENDTYPE ? 'end' : 'exit', l.from, l.toScene);
    }
  const order: Record<MarkKind, number> = { start: 0, exit: 1, end: 2 };
  const cells = [...marks.values()].map((m) => ({ ...m, scenes: m.scenes.sort((a, b) => a - b) }));
  return joinNeighbors(cells).sort((a, b) => order[a.kind] - order[b.kind] || a.y - b.y || a.x - b.x);
}

/** Marks of one kind to the same scenes on touching cells (a row of door blocks) as one mark round them all. */
function joinNeighbors(marks: LevelMark[]): LevelMark[] {
  const key = (m: LevelMark) => `${m.kind}:${m.scenes.join(',')}`;
  const left = [...marks];
  const out: LevelMark[] = [];
  while (left.length) {
    const group = [left.shift()!];
    for (let k = 0; k < group.length; k++) {
      const g = group[k];
      for (let j = left.length - 1; j >= 0; j--) {
        const o = left[j];
        if (key(o) === key(g) && Math.abs(o.x - g.x) <= 1 && Math.abs(o.y - g.y) <= 1) group.push(...left.splice(j, 1));
      }
    }
    const x0 = Math.min(...group.map((m) => m.x));
    const y0 = Math.min(...group.map((m) => m.y));
    const x1 = Math.max(...group.map((m) => m.x + m.w - 1));
    const y1 = Math.max(...group.map((m) => m.y + m.h - 1));
    out.push({ ...group[0], x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
  }
  return out;
}

/** A mark's label: the scene numbers (the title screen is ★, the end ⚑), "4, 7" or "4–9" for a run. */
export function markLabel(game: Game, scenes: number[]): string {
  const name = (n: number) => (game.scenes[n]?.gametype === ENDTYPE ? '⚑' : game.scenes[n]?.gametype === STARTTYPE ? '★' : String(n));
  const parts: string[] = [];
  for (let k = 0; k < scenes.length;) {
    let j = k;
    while (j + 1 < scenes.length && scenes[j + 1] === scenes[j] + 1 && game.scenes[scenes[j + 1]]?.gametype === ADVTYPE) j++;
    parts.push(
      j - k >= 2
        ? `${scenes[k]}–${scenes[j]}`
        : scenes
            .slice(k, j + 1)
            .map(name)
            .join(', '),
    );
    k = j + 1;
  }
  return parts.join(', ');
}

/** Where a box goes when packed: its page and its top-left there. */
interface Placed {
  page: number;
  x: number;
  y: number;
}

/**
 * Boxes (`w` x `h`) packed onto pages `area` large, in order, in rows (shelves) with `gap`
 * between them; one too big for a page gets a page of its own (the caller tiles it).
 */
export function packPages(boxes: { w: number; h: number }[], area: { w: number; h: number }, gap: number): Placed[] {
  const out: Placed[] = [];
  let page = -1;
  let x = 0;
  let y = 0;
  let row = 0;
  let open = false;
  for (const b of boxes) {
    const big = b.w > area.w || b.h > area.h;
    if (big) {
      page += 1;
      out.push({ page, x: 0, y: 0 });
      open = false;
      continue;
    }
    if (open && x > 0 && x + b.w > area.w) ((x = 0), (y += row + gap), (row = 0));
    if (!open || y + b.h > area.h) ((page += 1), (x = 0), (y = 0), (row = 0), (open = true));
    out.push({ page, x, y });
    x += b.w + gap;
    row = Math.max(row, b.h);
  }
  return out;
}

/** One printed Level Map. */
export interface Level {
  group: MapGroup;
  /** Its background blocks with the secret ones drawn as ground. */
  cells: Uint8Array;
  /** The part printed: what the player sees when that is known, else `whole`. */
  area: Rect;
  /** Every block of the map in use (usedArea). */
  whole: Rect;
  marks: LevelMark[];
  name: string;
  /** The scene whose palette and monsters draw it. */
  scene: number;
  /**
   * The map as the player goes through it, when the hero walks off its edge: `area` is then in
   * unwrapped blocks (x mod 100 is the map's), and `marks` sit on the laps where they are met.
   */
  unrolled?: Unrolled;
  /** With `unrolled`, the marks where they are on the map itself (for "Every block of the map"). */
  mapMarks?: LevelMark[];
}

/** A level laid out as the player goes through it: its box, and each mark on the lap where it is met. */
function unrolledLevel(level: Level, u: Unrolled): Level {
  const marks = level.marks.map((m) => ({ ...m, ...unrolledAt(u, m.x, m.y) }));
  const [x, y, w, h] = u.box;
  return { ...level, area: { x, y, w, h }, marks, unrolled: u, mapMarks: level.marks };
}

/**
 * The levels to map: one per map file and block set, secrets hidden, cropped and marked. `views`
 * (levelViews.json's boxes by "map|bbl") crops each to what the player sees; `unrolled` lays out
 * a map the hero walks off the edge of as the player goes through it.
 */
export function levelsOf(
  game: Game,
  files: { get(n: string): Uint8Array | undefined },
  secret: Record<string, number[]>,
  views: Record<string, SeenRect> = {},
  unrolled: Record<string, Unrolled> = {},
): Level[] {
  return mapGroups(game).flatMap((group): Level[] => {
    const mapB = files.get(group.map);
    const bblB = files.get(group.bbl);
    if (!mapB || !bblB) return [];
    const map = parseMap(mapB);
    const { cells, hidden } = hideSecrets(map.blocks, parseBlocks(bblB, BACKBL), new Set(secret[group.bbl] ?? []));
    const marks = levelMarks(game, group.scenes, hidden);
    const first = game.scenes[group.scenes[0]];
    const name = group.scenes.length > 1 ? `${first.desc || 'Untitled'} and ${group.scenes.length - 1} more` : first.desc || 'Untitled';
    const whole = usedArea(cells, marks);
    const key = `${group.map}|${group.bbl}`;
    const seen = views[key];
    const level: Level = { group, cells, area: seen ? seenArea(whole, seen, marks) : whole, whole, marks, name, scene: group.scenes[0] };
    return [unrolled[key] ? unrolledLevel(level, unrolled[key]) : level];
  });
}
