// The Game Integrator's boards: the editor's own layout space for a game with many scenes.
//
// The DOS integrator (GAMEMAKR) has a 310x165 world and every scene's .GAM position stays in it.
// A big game (Final Curtain has 77 scenes) cannot be organised in that, so the editor can also
// keep named boards in a much larger space, and groups that fold several scenes into one stacked
// card. All of it is editor-only data in the project's companion (project/companion.ts), under
// the section `integratorBoards` of the .gam: the .gam's own positions and the DOS export never
// change. A game without that section has just the DOS layout, as before.
//
// Shape: { boards: [{id, name}], place: {"<scene>": {board, x, y}}, groups: [{id, name, board,
// x, y, members: [scene…]}], dismissed: ["<suggestion key>"] }. Positions use the same units as
// a scene's Pos (the card's 5x5 box corner). A scene with no `place` and in no group sits on the
// first board at its DOS position.
import type { Point } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { CARD_UNITS } from './layoutCells';

export const BOARDS_SECTION = 'integratorBoards';
/** The editor's layout space: four times the DOS world's width and height. */
export const BOARD_WORLD = { x: 0, y: 0, w: 1240, h: 660 };

export interface BoardDef {
  id: string;
  name: string;
}
interface Spot extends Point {
  board: string;
}
export interface GroupDef extends Point {
  id: string;
  name: string;
  board: string;
  members: number[];
}
export interface BoardsData {
  boards: BoardDef[];
  place: Record<string, Spot>;
  groups: GroupDef[];
  dismissed: string[];
}

/** One card on a board: a scene, or a group of scenes. */
export interface BoardNode {
  key: string;
  board: string;
  pos: Point;
  /** The scenes it stands for (one for a scene card). */
  scenes: number[];
  group?: GroupDef;
}

export const emptyBoards = (): BoardsData => ({ boards: [], place: {}, groups: [], dismissed: [] });
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const text = (v: unknown, max = 60) => (typeof v === 'string' ? v.slice(0, max) : '');

export function clampBoardPos(p: Point): Point {
  return {
    x: Math.round(Math.min(BOARD_WORLD.x + BOARD_WORLD.w - CARD_UNITS.w, Math.max(BOARD_WORLD.x, p.x))),
    y: Math.round(Math.min(BOARD_WORLD.y + BOARD_WORLD.h - CARD_UNITS.h, Math.max(BOARD_WORLD.y, p.y))),
  };
}

/** The boards from what the companion holds; whatever is not understood is left out. */
export function readBoards(raw: unknown): BoardsData {
  const out = emptyBoards();
  if (!isObj(raw)) return out;
  if (Array.isArray(raw.boards))
    for (const b of raw.boards)
      if (isObj(b) && typeof b.id === 'string' && b.id && !out.boards.some((x) => x.id === b.id)) out.boards.push({ id: b.id, name: text(b.name) || b.id });
  if (isObj(raw.place))
    for (const [k, s] of Object.entries(raw.place))
      if (isObj(s) && typeof s.board === 'string' && num(s.x) !== undefined && num(s.y) !== undefined)
        out.place[k] = { board: s.board, x: s.x as number, y: s.y as number };
  const seen = new Set<number>();
  if (Array.isArray(raw.groups))
    for (const g of raw.groups) {
      if (!isObj(g) || typeof g.id !== 'string' || out.groups.some((x) => x.id === g.id) || !Array.isArray(g.members)) continue;
      const members = (g.members as unknown[]).filter((m): m is number => Number.isInteger(m) && !seen.has(m as number));
      members.forEach((m) => seen.add(m));
      if (members.length && typeof g.board === 'string')
        out.groups.push({ id: g.id, name: text(g.name) || 'Group', board: g.board, x: num(g.x) ?? 0, y: num(g.y) ?? 0, members });
    }
  if (Array.isArray(raw.dismissed)) out.dismissed = raw.dismissed.filter((d): d is string => typeof d === 'string');
  return out;
}

/** Every card on every board: scene cards and group cards, keyed `s:<scene>` and `g:<id>`. */
export function layNodes(data: BoardsData, scenes: number[], dosPos: (i: number) => Point): { nodes: BoardNode[]; nodeOf: Map<number, BoardNode> } {
  const first = data.boards[0]?.id;
  const known = new Set(data.boards.map((b) => b.id));
  const boardOr = (id: string | undefined) => (id && known.has(id) ? id : first);
  const nodes: BoardNode[] = [];
  const nodeOf = new Map<number, BoardNode>();
  const used = new Set(scenes);
  const inGroup = new Set<number>();
  for (const g of data.groups) {
    const members = g.members.filter((m) => used.has(m));
    const board = boardOr(g.board);
    if (!members.length || !board) continue;
    const n: BoardNode = { key: `g:${g.id}`, board, pos: { x: g.x, y: g.y }, scenes: members, group: g };
    nodes.push(n);
    for (const m of members) (inGroup.add(m), nodeOf.set(m, n));
  }
  if (!first) return { nodes, nodeOf };
  for (const i of scenes) {
    if (inGroup.has(i)) continue;
    const s = data.place[i];
    const board = boardOr(s?.board);
    const n: BoardNode = { key: `s:${i}`, board, pos: s && known.has(s.board) ? { x: s.x, y: s.y } : dosPos(i), scenes: [i] };
    nodes.push(n);
    nodeOf.set(i, n);
  }
  return { nodes, nodeOf };
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'board';
const uniqueId = (taken: string[], base: string) => {
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
};

/** Adds a board named `name` and returns its id. */
export function addBoard(d: BoardsData, name: string): string {
  const id = uniqueId(
    d.boards.map((b) => b.id),
    slug(name),
  );
  d.boards.push({ id, name: name.trim().slice(0, 40) || 'Board' });
  return id;
}

export function renameBoard(d: BoardsData, id: string, name: string): void {
  const b = d.boards.find((x) => x.id === id);
  if (b && name.trim()) b.name = name.trim().slice(0, 40);
}

/** Removes a board: its scenes and groups go to the first board left (or to the DOS layout, with none left). */
export function removeBoard(d: BoardsData, id: string): void {
  d.boards = d.boards.filter((b) => b.id !== id);
  const to = d.boards[0]?.id;
  if (!to) return void Object.assign(d, { place: {}, groups: [] });
  for (const s of Object.values(d.place)) if (s.board === id) s.board = to;
  for (const g of d.groups) if (g.board === id) g.board = to;
}

/** A spot on `board` where no card in `taken` sits, searching rows from the top left. */
export function freeSpotOn(taken: Point[], from: Point = { x: 8, y: 8 }): Point {
  const gw = CARD_UNITS.w + 3;
  const gh = CARD_UNITS.h + 3;
  for (let y = from.y; y < BOARD_WORLD.h - CARD_UNITS.h; y += gh)
    for (let x = y === from.y ? from.x : 8; x < BOARD_WORLD.w - CARD_UNITS.w; x += gw)
      if (!taken.some((p) => Math.abs(p.x - x) < CARD_UNITS.w && Math.abs(p.y - y) < CARD_UNITS.h)) return { x, y };
  return from;
}

const leaveGroups = (d: BoardsData, i: number) => {
  for (const g of d.groups) g.members = g.members.filter((m) => m !== i);
  d.groups = d.groups.filter((g) => g.members.length);
};

/** Puts scene `i` on `board` at `pos`, out of any group. */
export function placeScene(d: BoardsData, i: number, board: string, pos: Point): void {
  leaveGroups(d, i);
  d.place[i] = { board, ...clampBoardPos(pos) };
}

export function moveGroup(d: BoardsData, id: string, board: string, pos: Point): void {
  const g = d.groups.find((x) => x.id === id);
  if (g) Object.assign(g, { board, ...clampBoardPos(pos) });
}

/** A new group of `members` on `board` at `pos`; their own spots are dropped, and they leave other groups. */
export function addGroup(d: BoardsData, name: string, board: string, pos: Point, members: number[]): string {
  for (const m of members) (leaveGroups(d, m), delete d.place[m]);
  const id = uniqueId(
    d.groups.map((g) => g.id),
    slug(name),
  );
  d.groups.push({ id, name: name.trim().slice(0, 60) || 'Group', board, ...clampBoardPos(pos), members: [...members] });
  return id;
}

export function renameGroup(d: BoardsData, id: string, name: string): void {
  const g = d.groups.find((x) => x.id === id);
  if (g && name.trim()) g.name = name.trim().slice(0, 60);
}

export function addToGroup(d: BoardsData, id: string, i: number): void {
  const g = d.groups.find((x) => x.id === id);
  if (!g || g.members.includes(i)) return;
  leaveGroups(d, i);
  delete d.place[i];
  g.members.push(i);
}

/** Takes every member out of a group, laying them in a row from the group's card. */
export function ungroup(d: BoardsData, id: string): void {
  const g = d.groups.find((x) => x.id === id);
  if (!g) return;
  d.groups = d.groups.filter((x) => x !== g);
  const taken = Object.values(d.place)
    .filter((s) => s.board === g.board)
    .map((s) => ({ x: s.x, y: s.y }));
  taken.push(...d.groups.filter((x) => x.board === g.board));
  for (const m of g.members) {
    const spot = freeSpotOn(taken, { x: g.x, y: g.y });
    taken.push(spot);
    d.place[m] = { board: g.board, ...spot };
  }
}

/** Hides a suggestion (by its key) for good. */
export function dismiss(d: BoardsData, key: string): void {
  if (!d.dismissed.includes(key)) d.dismissed.push(key);
}
