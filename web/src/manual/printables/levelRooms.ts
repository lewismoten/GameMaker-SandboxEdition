// Maps that hold several separate rooms (levelMapLayout.ts levelsOf): a level whose rooms are
// reached only by links (doors that are teleports, one board per scene, a town walled in by
// hedges) prints each room as its own Level Map, so the page shows rooms and not the raw way
// the map file packs them. A room is everything joined to some of the level's arrivals through
// blocks the hero can get through, walled in all round; rooms that are copies of one room can
// be drawn once (levelRoomHints.ts), and a room (or a whole map) the hero never walks around
// in, because every scene there starts him right on its way out, is left out.
import type { Block } from '../../formats/blocks';
import { NOSCENE, type Game, type Point } from '../../formats/game';
import { MLEN, MWID } from '../../formats/map';
import type { Rect } from './worldMapLayout';

/** Can the hero get into this cell: not solid on every side, or a block that changes (a door). */
export const openCell = (cells: ArrayLike<number>, blocks: Block[], i: number): boolean => {
  const b = blocks[cells[i]];
  return !b || b.solid !== 15 || b.touchBl !== cells[i] || (b.nextBl !== cells[i] && b.ntime > 0);
};

/**
 * A map's separate rooms: each one's box, and which room each cell the hero can get to is in
 * (-1: none). Boxes are in the frame's blocks: the map turned round its wrapping edges so the
 * frame's top-left is `origin` (an unrolled level's box), and `at` turns any map block into that frame.
 */
export interface Rooms {
  rects: Rect[];
  region: Int16Array;
  origin: Point;
  at(p: Point): Point;
}

const mod = (v: number, n: number) => ((v % n) + n) % n;

/**
 * The separate rooms of a map: each set of arrivals joined by open blocks, as the box round it
 * with a block of wall on every side (the wall left off a side where it would take in another
 * room). The map's edge is a wall (a map that goes round is never cut up). Undefined when there
 * are fewer than two.
 */
export function separateRooms(map: ArrayLike<number>, blocks: Block[], starts: Point[], origin: Point = { x: 0, y: 0 }): Rooms | undefined {
  // the map turned round so the frame starts at `origin`: its edges are where the frame's are
  const cells = new Uint8Array(MLEN * MWID);
  for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) cells[y * MLEN + x] = map[mod(y + origin.y, MWID) * MLEN + mod(x + origin.x, MLEN)];
  starts = starts.map((p) => ({ x: mod(p.x - origin.x, MLEN), y: mod(p.y - origin.y, MWID) }));
  const region = new Int16Array(MLEN * MWID).fill(-1);
  const boxes: [number, number, number, number][] = [];
  // arrivals on open blocks first: one on a solid block (a doorway) joins the room beside it
  const inMap = starts.filter((p) => p.x >= 0 && p.y >= 0 && p.x < MLEN && p.y < MWID).map((p) => p.y * MLEN + p.x);
  const seeds = [...inMap.filter((i) => openCell(cells, blocks, i)), ...inMap.filter((i) => !openCell(cells, blocks, i))];
  for (const s of seeds) {
    if (region[s] >= 0) continue;
    const p = { x: s % MLEN, y: (s / MLEN) | 0 };
    const beside = [p.x > 0 && s - 1, p.x < MLEN - 1 && s + 1, p.y > 0 && s - MLEN, p.y < MWID - 1 && s + MLEN].find((j) => j !== false && region[j] >= 0);
    if (beside !== undefined && beside !== false) {
      const box = boxes[region[beside]];
      region[s] = region[beside];
      box[0] = Math.min(box[0], p.x);
      box[1] = Math.min(box[1], p.y);
      box[2] = Math.max(box[2], p.x);
      box[3] = Math.max(box[3], p.y);
      continue;
    }
    const r = boxes.length;
    const box: [number, number, number, number] = [p.x, p.y, p.x, p.y];
    boxes.push(box);
    region[s] = r;
    const todo = [s];
    while (todo.length) {
      const i = todo.pop()!;
      const x = i % MLEN;
      const y = (i / MLEN) | 0;
      box[0] = Math.min(box[0], x);
      box[1] = Math.min(box[1], y);
      box[2] = Math.max(box[2], x);
      box[3] = Math.max(box[3], y);
      const next = [x > 0 && i - 1, x < MLEN - 1 && i + 1, y > 0 && i - MLEN, y < MWID - 1 && i + MLEN];
      for (const j of next) if (j !== false && region[j] < 0 && openCell(cells, blocks, j)) ((region[j] = r), todo.push(j));
    }
  }
  if (boxes.length < 2) return undefined;
  const other = (r: number, x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (region[y * MLEN + x] >= 0 && region[y * MLEN + x] !== r) return true;
    return false;
  };
  const rects = boxes.map(([x0, y0, x1, y1], r) => {
    const l = x0 === 0 || other(r, x0 - 1, y0, x0 - 1, y1) ? x0 : x0 - 1;
    const t = y0 === 0 || other(r, x0, y0 - 1, x1, y0 - 1) ? y0 : y0 - 1;
    const rt = x1 === MLEN - 1 || other(r, x1 + 1, y0, x1 + 1, y1) ? x1 : x1 + 1;
    const b = y1 === MWID - 1 || other(r, x0, y1 + 1, x1, y1 + 1) ? y1 : y1 + 1;
    return { x: l + origin.x, y: t + origin.y, w: rt - l + 1, h: b - t + 1 };
  });
  return { rects, region, origin, at: (p) => ({ x: mod(p.x - origin.x, MLEN) + origin.x, y: mod(p.y - origin.y, MWID) + origin.y }) };
}

const inside = (r: Rect, x: number, y: number) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;

/** The links that bring the hero into `scenes` (from any scene), with the scene each arrives in. */
function arrivals(game: Game, scenes: ReadonlySet<number>): { scene: number; at: Point }[] {
  const out: { scene: number; at: Point }[] = [];
  for (const s of game.scenes) for (const l of s.links) if (l.toScene !== NOSCENE && scenes.has(l.toScene)) out.push({ scene: l.toScene, at: l.to });
  return out;
}

/**
 * Does the hero never walk around in these scenes: each one starts him right on a way out of
 * it (a talk's page, a verdict, a card before a board), so the map flashes past unseen? Only
 * the arrivals `here` takes in count (all of them when it is left out).
 */
export function passesThrough(game: Game, scenes: number[], here: (at: Point) => boolean = () => true): boolean {
  const ins = arrivals(game, new Set(scenes)).filter((a) => here(a.at));
  return ins.length > 0 && ins.every(({ scene, at }) => game.scenes[scene].links.some((l) => l.toScene !== NOSCENE && l.from.x === at.x && l.from.y === at.y));
}

/** What a Level Map's maker says about a map of rooms (levelRoomHints.ts). */
export interface RoomsHint {
  /** Rooms named by a cell in them; a room not named takes the name of the scene that brings you only there. */
  rooms?: RoomHint[];
  /** Rooms named by that scene are numbered across the game in scene order: "Board {n}: {name}" ({name} is `names[n - 1]`, else the scene's). */
  numbered?: { label: string; names?: string[] };
  /** A panel of people beside a room: who you meet there, and the rooms they take you to (not drawn themselves). */
  cast?: CastHint;
}

export interface RoomHint {
  at: [number, number];
  name: string;
  /** What a way into it from another room of the same scene says ("Florida"). */
  short?: string;
  /** The same room again (a later round): drawn once, its scenes and its ways out on the same blocks go with this one. */
  same?: [number, number][];
  /** A line printed under the room: what the copies change. */
  note?: string;
  /** Leave the room out. */
  skip?: boolean;
}

export interface CastHint {
  /** The room the panel goes beside (a cell in it). */
  beside: [number, number];
  title: string;
  people: {
    name: string;
    /** Their picture: map cells x, y, w, h. */
    picture: [number, number, number, number];
    /** The rooms they take you to (a cell in each): their scenes are listed, and `show` (cells from the room's corner) drawn small. */
    visits: { label: string; at: [number, number]; show?: [number, number, number, number] }[];
  }[];
}

/** A person in a cast panel, worked out: picture and the scenes of each visit. */
export interface CastPerson {
  name: string;
  picture: Rect;
  visits: { label: string; scenes: number[]; show?: Rect }[];
}

/** A room cut out of a map: its box, name, the scenes that arrive in it, and what goes with it. */
export interface RoomCut {
  rect: Rect;
  name: string;
  /** What a way into it from another room of the same scene says, when not the name. */
  short?: string;
  scenes: number[];
  /** The one scene that brings the hero only here, in a room the hint doesn't name (names and numbers it). */
  own?: number;
  /** Copies drawn as this room: their boxes. */
  copies: Rect[];
  note?: string;
  cast?: { title: string; people: CastPerson[] };
}

/** A scene that never scrolls shows one screen, its top-left half a screen up and left of where the hero arrives (playscene). */
const still = (game: Game, n: number) => {
  const sc = game.scenes[n]?.scroll;
  return !!sc && !sc.up && !sc.down && !sc.left && !sc.right;
};

/** Do two boxes share more than a wall? */
const overlap = (a: Rect, b: Rect) => a.x + 1 < b.x + b.w - 1 && b.x + 1 < a.x + a.w - 1 && a.y + 1 < b.y + b.h - 1 && b.y + 1 < a.y + a.h - 1;

/**
 * The rooms of a map of scenes `scenes` (`rooms`, from separateRooms): named and ordered (by
 * the scene that brings you only there, else as the hint lists them), copies joined, cast rooms
 * gathered into their panel, and rooms nobody walks around in left out. A room shown by scenes
 * that never scroll is the screens they show. Without a hint the map is cut up only when it is
 * plainly rooms: each one some scene's own place, and no room's box over another's; else undefined.
 */
export function cutRooms(game: Game, scenes: number[], rooms: Rooms, hint?: RoomsHint): RoomCut[] | undefined {
  const { rects, region, origin } = rooms;
  const ins = arrivals(game, new Set(scenes)).map((a) => ({ scene: a.scene, at: rooms.at(a.at) }));
  const roomOf = (mx: number, my: number) => {
    const { x, y } = rooms.at({ x: mx, y: my });
    const r = region[(y - origin.y) * MLEN + (x - origin.x)];
    return r >= 0 ? r : rects.findIndex((b) => inside(b, x, y));
  };
  const scenesIn = (k: number) => [...new Set(ins.filter((a) => roomOf(a.at.x, a.at.y) === k).map((a) => a.scene))].sort((a, b) => a - b);
  const hints = hint?.rooms ?? [];
  const hinted = (k: number) => hints.findIndex((h) => roomOf(...h.at) === k);
  const copyOf = new Map<number, number>();
  hints.forEach((h) => h.same?.forEach((c) => copyOf.set(roomOf(...c), roomOf(...h.at))));
  const castRooms = new Set((hint?.cast?.people ?? []).flatMap((p) => p.visits.map((v) => roomOf(...v.at))));
  // what the player sees of a room
  const shown = rects.map((rect, k) => {
    const here = ins.filter((a) => roomOf(a.at.x, a.at.y) === k);
    if (!here.length || !here.every((a) => still(game, a.scene))) return rect;
    const x0 = Math.min(...here.map((a) => a.at.x)) - 8;
    const y0 = Math.min(...here.map((a) => a.at.y)) - 5;
    const x1 = Math.max(...here.map((a) => a.at.x)) + 8;
    const y1 = Math.max(...here.map((a) => a.at.y)) + 5;
    const [fx, fy] = [Math.max(origin.x, x0), Math.max(origin.y, y0)];
    return { x: fx, y: fy, w: Math.min(origin.x + MLEN, x1) - fx, h: Math.min(origin.y + MWID, y1) - fy };
  });
  const out: (RoomCut & { order: number; k: number })[] = [];
  for (const [k, rect] of shown.entries()) {
    if (copyOf.has(k) || castRooms.has(k)) continue;
    const h = hints[hinted(k)];
    if (h?.skip || passesThrough(game, scenes, (at) => roomOf(at.x, at.y) === k)) continue;
    const copies = [...copyOf].filter(([, to]) => to === k).map(([c]) => c);
    const all = [...new Set([k, ...copies].flatMap(scenesIn))].sort((a, b) => a - b);
    // the scene that arrives in this room and no other one names it
    const own = scenesIn(k).find((s) => ins.every((a) => a.scene !== s || roomOf(a.at.x, a.at.y) === k));
    if (!hint && (own === undefined || shown.some((o, j) => j !== k && overlap(o, rect)))) return undefined;
    out.push({
      rect,
      name: h?.name ?? ((own !== undefined && game.scenes[own].desc) || `Room ${k + 1}`),
      short: h?.short,
      scenes: all,
      own: h ? undefined : own,
      copies: copies.map((c) => shown[c]),
      note: h?.note,
      order: own ?? 1e6 + (h ? hinted(k) : 1000 + k),
      k,
    });
  }
  if (out.length < 2 && !hint) return undefined;
  const cast = hint?.cast;
  const host = cast && out.find((c) => c.k === roomOf(...cast.beside));
  if (cast && host)
    host.cast = {
      title: cast.title,
      people: cast.people.map((p) => ({
        name: p.name,
        picture: { x: p.picture[0], y: p.picture[1], w: p.picture[2], h: p.picture[3] },
        visits: p.visits.map((v) => {
          const r = shown[roomOf(...v.at)];
          return {
            label: v.label,
            scenes: scenesIn(roomOf(...v.at)),
            show: v.show && r && { x: r.x + v.show[0], y: r.y + v.show[1], w: v.show[2], h: v.show[3] },
          };
        }),
      })),
    };
  return out.sort((a, b) => a.order - b.order).map(({ order: _, k: _k, ...c }) => c);
}

/** Names rooms numbered across the game ("Board 19: The Home Computer"): `cuts` in game order, numbered by their own scene. */
export function numberRooms(cuts: RoomCut[], game: Game, numbered: RoomsHint['numbered']): void {
  if (!numbered) return;
  const owned = cuts.filter((c) => c.own !== undefined).sort((a, b) => a.own! - b.own!);
  owned.forEach((c, i) => (c.name = `${numbered.label} ${i + 1}: ${numbered.names?.[i] ?? game.scenes[c.own!].desc}`));
}

/** Moves a mark from a copy onto the room drawn for it, when the block under it is the same there. */
export function ontoRoom(cells: ArrayLike<number>, from: Rect, to: Rect, p: Point): Point | undefined {
  const x = p.x - from.x + to.x;
  const y = p.y - from.y + to.y;
  return cells[mod(p.y, MWID) * MLEN + mod(p.x, MLEN)] === cells[mod(y, MWID) * MLEN + mod(x, MLEN)] ? { x, y } : undefined;
}
