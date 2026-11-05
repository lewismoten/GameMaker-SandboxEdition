// Level generator core: draws a dungeon or a forest into a rectangle of a map using the blocks a
// person gave roles to (kit/blockRoles). No DOM, so it runs in a Worker; the same seed always gives the
// same blocks. It returns ordinary map cells and proposals (where the hero could start, an exit), and
// writes nothing itself: the map editor puts the cells into the map as one undo step, and draws
// wall and tree edges with the set's terrain brushes (`terrainCells`).
import { blocksWithRole, type Role, type RoleMap } from '../blockRoles';
import { checkNeeds, type GenKind } from './needs';
import { DECOR, FLOOR, PATH, ROCK, TREE, WALL, closed, distances, stream, type Area } from './grid';
import { dungeon } from './dungeon';
import { forest } from './forest';

export { KINDS, checkNeeds, kindInfo, type GenKind, type KindInfo, type NeedItem, type NeedsReport } from './needs';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GenParams {
  kind: GenKind;
  seed: number;
  /** The part of the map to draw in (cells). */
  rect: Rect;
}

export const MIN_SIDE = 12;

/** What the cells of a result are, for edges: which cells (area-local indexes) belong to a role's terrain. */
export type TerrainRole = 'wall' | 'tree' | 'path';

export interface GenResult {
  rect: Rect;
  /** A block number per cell of the rectangle, in reading order. */
  blocks: Uint8Array;
  /** The same cells as a plain kind (0 wall, 1 floor, 2 path, 3 tree, 4 rock, 5 decoration). */
  kinds: Uint8Array;
  /** Cells (rectangle-local indexes) a terrain brush should give edges and corners to. */
  terrainCells: Partial<Record<TerrainRole, number[]>>;
  /** Where the hero could come in, and a far cell for an exit, as rectangle-local indexes. Proposals only. */
  entry: number;
  exit: number;
  /** What was left out, in plain words. */
  notes: string[];
}

export type GenOutcome = { ok: true; result: GenResult } | { ok: false; message: string };

/** The seed of offer `i` (0..3) from a base seed: four different layouts that stay the same every time. */
export const offerSeed = (base: number, i: number): number => (base + Math.imul(i, 0x9e3779b1)) >>> 0;

const first = (roles: RoleMap, role: Role): number | undefined => blocksWithRole(roles, role)[0];

/** Draws one layout into `params.rect`. Fails with a plain message when a needed role is missing or the area is small. */
export function generate(roles: RoleMap, params: GenParams): GenOutcome {
  const needs = checkNeeds(params.kind, roles);
  if (!needs.ok) return { ok: false, message: needs.message };
  const { w, h } = params.rect;
  if (w < MIN_SIDE || h < MIN_SIDE) return { ok: false, message: `That area is small: a ${params.kind} needs at least ${MIN_SIDE} by ${MIN_SIDE} blocks.` };
  const r = stream(params.seed);
  const notes = [...needs.skipped];
  const has = (role: Role) => blocksWithRole(roles, role).length > 0;
  let area: Area;
  let entry: number, exit: number;
  const terrainCells: GenResult['terrainCells'] = {};
  if (params.kind === 'dungeon') {
    const d = dungeon(w, h, r, has('decoration'));
    ({ area, entry, exit } = d);
  } else {
    const f = forest(w, h, r, { path: has('path'), rock: has('rock'), decor: has('decoration') });
    ({ area, entry, exit } = f);
  }
  // blocks: the first block of each role, with the other floor blocks scattered for variety
  const pick: Record<number, number[]> = {
    [WALL]: blocksWithRole(roles, 'wall').slice(0, 1),
    [FLOOR]: blocksWithRole(roles, 'floor'),
    [PATH]: blocksWithRole(roles, 'path').slice(0, 1),
    [TREE]: blocksWithRole(roles, 'tree').slice(0, 1),
    [ROCK]: blocksWithRole(roles, 'rock').slice(0, 1),
    [DECOR]: blocksWithRole(roles, 'decoration'),
  };
  const floor = first(roles, 'floor')!;
  const blocks = new Uint8Array(area.cells.length);
  const variety = stream(params.seed ^ 0x5bd1e995);
  for (let i = 0; i < blocks.length; i++) {
    const list = pick[area.cells[i]] ?? [floor];
    blocks[i] = area.cells[i] === FLOOR && list.length > 1 && variety.chance(0.1) ? list[variety.int(1, list.length - 1)] : (list[0] ?? floor);
  }
  const cellsOf = (kind: number) => {
    const out: number[] = [];
    area.cells.forEach((c, i) => c === kind && out.push(i));
    return out;
  };
  terrainCells.wall = params.kind === 'dungeon' ? cellsOf(WALL) : undefined;
  terrainCells.tree = params.kind === 'forest' ? cellsOf(TREE) : undefined;
  terrainCells.path = cellsOf(PATH).length ? cellsOf(PATH) : undefined;
  return { ok: true, result: { rect: params.rect, blocks, kinds: area.cells, terrainCells, entry, exit, notes } };
}

/** Whether every open cell of a result can be reached from its entry (a check the generators should always pass). */
export function verifyReach(result: GenResult): { ok: boolean; open: number; reached: number } {
  const a: Area = { w: result.rect.w, h: result.rect.h, cells: result.kinds };
  const d = distances(a, result.entry);
  let open = 0,
    reached = 0;
  for (let i = 0; i < d.length; i++)
    if (!closed(a.cells[i])) {
      open++;
      if (d[i] >= 0) reached++;
    }
  return { ok: open === reached && open > 0, open, reached };
}

