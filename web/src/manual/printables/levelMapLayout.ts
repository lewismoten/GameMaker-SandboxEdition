// Assemble grouped maps, courses and rooms into printable Level Map layouts.
import { type Game, ADVTYPE, NOSCENE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { type Rect } from './worldMapLayout';
import { type LevelMark, levelMarks } from './levelMapMarks';
import { type Unrolled } from '../../editor/check/unroll';
import { type CourseLayout, type CourseFit, layOutCourse } from './levelCourse';
import { passesThrough } from '../../project/sceneArrivals';
import { type CastPerson, type RoomCut, type Rooms, ontoRoom, type RoomsHint, separateRooms, cutRooms, numberRooms } from './levelRooms';
import { type Block, parseBlocks, BACKBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { type SeenRect, type UnrolledMap } from './levelViews';
import { seenArea, trimPadding, hideSecrets, usedArea, walledReach, joinRects, unrolledLevel, wrapReach } from './levelMapGeometry';
import { type CoursePath } from '../../editor/check/course';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { fromCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';

export { fillerBlock } from './levelMapGeometry';
export { usedArea } from './levelMapGeometry';
export { hideSecrets } from './levelMapGeometry';
export { seenArea } from './levelMapGeometry';
export { walledReach } from './levelMapGeometry';
export { trimPadding } from './levelMapGeometry';
export { wrapReach } from './levelMapGeometry';
export { levelMarks } from './levelMapMarks';
export { markLabel } from './levelMapMarks';

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

/** Where a box goes when packed: its page and its top-left there. */
interface Placed {
  page: number;
  x: number;
  y: number;
}

/** Keep Pass the Pie's opening maps together when a vertical stack fits near full size. */
export function mapPrintLayout(id: string, boxes: { w: number; h: number }[], area: { w: number; h: number }, gap: number) {
  const [first, second] = boxes;
  let scale = 1;
  if (id === 'pass-the-pie' && first && second && Math.max(first.w, second.w) <= area.w && first.w + gap + second.w > area.w) {
    const stacked = (area.h - gap) / (first.h + second.h);
    if (stacked >= 0.9 && stacked < 1) scale = stacked;
  }
  const placed = packPages(
    boxes.map(({ w, h }) => ({ w: w * scale, h: h * scale })),
    area,
    gap,
  );
  return { placed, scale };
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
  /** A course through the wrap (levelCourse.ts): printed as the strip the way runs, not as `area`. */
  course?: CourseLayout<LevelMark>;
  /** A room cut out of a map of rooms (levelRooms.ts): who you meet there, printed beside it. */
  cast?: { title: string; people: CastPerson[] };
  /** A room cut out of a map of rooms: what its copies change. Several states of one place (levelStates.ts): how they differ. */
  note?: string;
  /** Several levels that show one place, printed as one (levelStates.ts): how many. */
  states?: number;
}

/** The scene a room is drawn with (palette, monsters): the first that doesn't pass straight through. */
const drawnWith = (game: Game, scenes: number[]) => scenes.find((n) => !passesThrough(game, [n])) ?? scenes[0];

/**
 * A room of a map of rooms as a level of its own: its marks (a copy's on the same blocks moved
 * onto it), cropped to what the player sees of it. `cuts` are all the map's rooms, for naming a
 * way into another room of the same scene.
 */
function roomLevel(game: Game, level: Level, cut: RoomCut, cuts: RoomCut[], rooms: Rooms, blocks: Block[], seen?: SeenRect): Level {
  const within = (r: Rect, m: LevelMark) => m.x >= r.x && m.y >= r.y && m.x + m.w <= r.x + r.w && m.y + m.h <= r.y + r.h;
  const marks: LevelMark[] = level.marks.filter((m) => within(cut.rect, m)).map((m) => ({ ...m, scenes: [...m.scenes] }));
  for (const copy of cut.copies)
    for (const m of level.marks.filter((x) => within(copy, x))) {
      const at = ontoRoom(level.cells, copy, cut.rect, m);
      if (!at) continue;
      const same = marks.find((o) => o.kind === m.kind && o.x === at.x && o.y === at.y && o.w === m.w && o.h === m.h);
      if (same) same.scenes = [...new Set([...same.scenes, ...m.scenes])].sort((a, b) => a - b);
      else marks.push({ ...m, ...at });
    }
  // a way into another room of the same scene says which room
  for (const m of marks) {
    if (m.kind !== 'exit') continue;
    const names = new Set<string>();
    let other = false;
    for (const n of level.group.scenes)
      for (const l of game.scenes[n].links) {
        const from = rooms.at(l.from);
        const at = rooms.at(l.to);
        if (l.toScene === NOSCENE || from.x < m.x || from.y < m.y || from.x >= m.x + m.w || from.y >= m.y + m.h) continue;
        const room =
          l.toScene === n
            ? cuts.find((c) => c !== cut && at.x >= c.rect.x && at.y >= c.rect.y && at.x < c.rect.x + c.rect.w && at.y < c.rect.y + c.rect.h)
            : undefined;
        if (room) names.add(room.short ?? room.name);
        else other = true;
      }
    if (names.size && !other) m.text = [...names].join(', ');
  }
  const r = cut.rect;
  // an unrolled level's room keeps to the box the player went through; another, to what he sees of it
  const cropped = level.unrolled ? intersect(level.area, r) : seen && intersect({ x: seen[0], y: seen[1], w: seen[2], h: seen[3] }, r);
  const crop = cropped && !level.unrolled ? seenArea(r, [cropped.x, cropped.y, cropped.w, cropped.h], marks, 1, level.cells) : (cropped ?? r);
  const area = trimPadding(crop, level.cells, marks, [false, false], blocks);
  const scenes = cut.scenes.length ? cut.scenes : level.group.scenes;
  return {
    ...level,
    group: { ...level.group, scenes },
    area,
    whole: r,
    marks,
    name: cut.name,
    scene: drawnWith(game, scenes),
    mapMarks: undefined,
    cast: cut.cast,
    note: cut.note,
  };
}

/** A room of a map of rooms, waiting to be laid out as a level of its own (roomLevel). */
interface RoomPart {
  cut: RoomCut;
  level: Level;
  cuts: RoomCut[];
  seen?: SeenRect;
  rooms: Rooms;
  blocks: Block[];
}

/** The part two boxes share, or undefined. */
function intersect(a: Rect, b: Rect): Rect | undefined {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : undefined;
}

/**
 * The levels to map: one per map file and block set, secrets hidden, cropped and marked. `views`
 * (levelViews/*.json's boxes by "map|bbl") crops each to what the player sees; `unrolled` lays out
 * a map the hero walks off the edge of as the player goes through it. A map the hero never walks
 * around in (every scene starts him on its way out) is left out, and a map of separate rooms
 * (levelRooms.ts; `rooms`, levelRoomHints.ts, says how a map's maker wants it cut) prints each
 * room as a level of its own. A map in `courses` (a course through the wrap, by "map|bbl") is
 * laid out as its strip, its panels fitted to the paper (`fit`).
 */
export function levelsOf(
  game: Game,
  files: { get(n: string): Uint8Array | undefined },
  secret: Record<string, number[]>,
  views: Record<string, SeenRect> = {},
  unrolled: Record<string, UnrolledMap> = {},
  rooms: Record<string, RoomsHint> = {},
  courses: Record<string, CoursePath> = {},
  fit: CourseFit = { pageW: 101, pageH: 62, padW: 13.2, padH: 6.4 },
): Level[] {
  const numbered: { cut: RoomCut; hint: RoomsHint }[] = [];
  const levels = mapGroups(game).flatMap((group): (Level | RoomPart)[] => {
    const mapB = files.get(group.map);
    const bblB = files.get(group.bbl);
    if (!mapB || !bblB || passesThrough(game, group.scenes)) return [];
    const map = parseMap(mapB);
    const blocks = parseBlocks(bblB, BACKBL);
    const { cells, hidden } = hideSecrets(map.blocks, blocks, new Set(secret[group.bbl] ?? []));
    const marks = levelMarks(game, group.scenes, hidden);
    const first = game.scenes[group.scenes[0]];
    const name = group.scenes.length > 1 ? `${fromCp437(first.desc) || 'Untitled'} and ${group.scenes.length - 1} more` : fromCp437(first.desc) || 'Untitled';
    const whole = usedArea(cells, marks);
    const key = `${group.map}|${group.bbl}`;
    const seen = views[key];
    let area = seen ? seenArea(whole, seen, marks, 1, cells) : whole;
    const starts = marks.filter((m) => m.kind === 'start');
    // an enclosed level shows every part the hero can get to, though the bots never went there
    const reach = seen && walledReach(map.blocks, blocks, starts);
    if (reach) area = joinRects(area, reach, whole);
    area = trimPadding(area, cells, marks, [false, false], blocks);
    const level: Level = { group, cells, area, whole, marks, name, scene: group.scenes[0] };
    const path = courses[key];
    if (path) return [{ ...level, course: layOutCourse(cells, blocks, path, marks, fit) }];
    let top = level;
    if (unrolled[key]) {
      top = unrolledLevel(level, unrolled[key], wrapReach(map.blocks, blocks, starts), blocks, unrolled[key].stood);
      // a way that goes round, or winds on, stays as it is; one laid out in one piece can be cut into rooms
      if (top.unrolled!.loops[0] || top.unrolled!.loops[1] || top.unrolled!.runs) return [top];
    }
    const u = top.unrolled;
    const parts = separateRooms(map.blocks, blocks, starts, u ? { x: u.box[0], y: u.box[1] } : undefined);
    const cuts = parts && cutRooms(game, group.scenes, parts, rooms[key]);
    if (!cuts?.length) return [top];
    const hint = rooms[key];
    if (hint?.numbered) for (const cut of cuts) numbered.push({ cut, hint });
    return cuts.map((cut) => ({ cut, level: top, cuts, seen, rooms: parts!, blocks }));
  });
  // rooms numbered across the game are named before they are laid out
  for (const label of new Set(numbered.map((n) => n.hint.numbered!.label)))
    numberRooms(
      numbered.filter((n) => n.hint.numbered!.label === label).map((n) => n.cut),
      game,
      numbered.find((n) => n.hint.numbered!.label === label)!.hint.numbered,
    );
  return levels.map((l) => ('cut' in l ? roomLevel(game, l.level, l.cut, l.cuts, l.rooms, l.blocks, l.seen) : l));
}
