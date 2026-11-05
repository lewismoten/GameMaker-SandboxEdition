// Level generator core: draws a dungeon or a forest into a rectangle of a map using the blocks a
// person gave roles to (kit/blockRoles). No DOM, so it runs in a Worker; the same seed always gives the
// same blocks. It returns ordinary map cells and proposals (where the hero could start, an exit), and
// writes nothing itself: the map editor puts the cells into the map as one undo step, and draws
// wall and tree edges with the set's terrain brushes (`terrainCells`).
import { FACINGS, MAX_PAIR, blocksWithRole, type Facing, type Role, type RoleMap } from '../blockRoles';
import { checkNeeds, kindInfo, type GenKind } from './needs';
import {
  DECOR,
  DOORC,
  FLOOR,
  HAZARD,
  KEY,
  LADDER,
  LIFE,
  LOCK,
  PATH,
  PLAT,
  ROCK,
  ROOF,
  SKY,
  TREASURE,
  TREE,
  WALL,
  WATER,
  closed,
  distances,
  stream,
  type Area,
} from './grid';
import { addProps, proveKeys, type LockInfo } from './props';
import { dungeon } from './dungeon';
import { forest } from './forest';
import { interior } from './interior';
import { castle } from './castle';
import { town, type SceneLink } from './town';
import { overworld } from './overworld';
import { platform, type PlatformProof } from './platform';
import { heroPhysics } from './jumpModel';
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { DIR, type Avail, type Item } from './furnish';

export { type Item as Furniture } from './furnish';
export { type SceneLink } from './town';
export { heroPhysics, weaker, type HeroPhysics } from './jumpModel';
export { capability, type Capability } from './platformCap';
export { reachFrom, type Step } from './platformReach';
export { LADDER as LADDER_CELL } from './grid';
export { closed as closedCell, DOORC as DOOR_CELL, FLOOR as FLOOR_CELL, LOCK as LOCK_CELL, PATH as PATH_CELL } from './grid';
export { type PlatformProof } from './platform';

export { type LockInfo } from './props';
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
  /** Monster numbers (from the game's .mon file) that may be placed; none or left out: no monsters. */
  monsters?: number[];
  /** The map wraps over its edges (overworld land then lines up across the seam). */
  wrap?: boolean;
  /** The hero's character file: a platform layout is sized to his real jump (the other kinds ignore it). */
  hero?: Character;
  /** Platform: how much of the hero's most the layout asks of him, in percent (10 to 100; 80 when left out). */
  difficulty?: number;
}

/** The smallest side any kind can draw in (each kind has its own minimum, `kindInfo(kind).min`). */
/** The biggest a building is drawn (blocks); a bigger area gets it in the middle. */
const MAX_SIZE: Partial<Record<GenKind, { w: number; h: number }>> = {
  home: { w: 24, h: 16 },
  shop: { w: 26, h: 14 },
  castle: { w: 56, h: 40 },
  town: { w: 80, h: 56 },
  platform: { w: 120, h: 24 },
};

export const MIN_SIDE = 10;

/** What the cells of a result are, for edges: which cells (area-local indexes) belong to a role's terrain. */
export type TerrainRole = 'wall' | 'tree' | 'path' | 'water';

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
  /** Locked doors with the cell of the key that opens each (rectangle-local), nearest the entry first. Dungeons only. */
  locks: LockInfo[];
  /** Cells of treasure, and of a heart or extra life if one was placed (rectangle-local). */
  treasure: number[];
  life?: number;
  /** Monsters to place as map monsters: a monster number and a rectangle-local start cell. */
  monsters: { cell: number; monnum: number }[];
  /** Furniture (interiors): the cell, the role, which way the front looks, and the block chosen. Rugs are walkable. */
  furniture: (Item & { block: number })[];
  /** Where the shopkeeper could stand (shops), a proposal like the entry. */
  shopkeeper?: number;
  /** Doors and sites a person could link to other scenes (towns and overworlds): proposals only, nothing is linked. */
  links: SceneLink[];
  /** Platform only: what was proven by jump math, the difficulty drawn and what the hero can do (cells). */
  platform?: { proof: PlatformProof; difficulty: number; can: { rise: number; gap: number }; asked: { rise: number; gap: number } };
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
  const min = kindInfo(params.kind).min;
  if (params.rect.w < min.w || params.rect.h < min.h)
    return { ok: false, message: `That area is small: a ${params.kind} needs at least ${min.w} by ${min.h} blocks.` };
  // a building is drawn in the middle of a big area and leaves the rest of the map as it is
  const cap = MAX_SIZE[params.kind];
  const w = Math.min(params.rect.w, cap?.w ?? Infinity),
    h = Math.min(params.rect.h, cap?.h ?? Infinity);
  const rect: Rect = { x: params.rect.x + ((params.rect.w - w) >> 1), y: params.rect.y + ((params.rect.h - h) >> 1), w, h };
  const r = stream(params.seed);
  const notes = [...needs.skipped];
  const has = (role: Role) => blocksWithRole(roles, role).length > 0;
  let area: Area;
  let entry: number, exit: number;
  const terrainCells: GenResult['terrainCells'] = {};
  let platformInfo: GenResult['platform'];
  let own: { locks: GenResult['locks']; treasure: number[]; life?: number; monsters: GenResult['monsters']; doorCells: number[] } | undefined;
  let furniture: GenResult['furniture'] = [];
  let shopkeeper: number | undefined;
  let links: SceneLink[] = [];
  const furnitureBlock = (role: Role, facing?: Facing): number => {
    const list = blocksWithRole(roles, role);
    return list.find((n) => roles[n].facing === facing) ?? list.find((n) => !roles[n].facing) ?? list[0];
  };
  if (params.kind === 'platform') {
    if (!params.hero) return { ok: false, message: 'A side view needs the hero’s character file, to measure how he jumps.' };
    const hp = heroPhysics(params.hero);
    if (!hp.ok) return { ok: false, message: hp.message };
    const pairs = Array.from({ length: MAX_PAIR }, (_, i) => i + 1).filter(
      (p) => blocksWithRole(roles, 'locked-door', p).length && blocksWithRole(roles, 'key', p).length,
    );
    const pl = platform(w, h, r, {
      physics: hp.physics,
      difficulty: Math.max(0.1, Math.min(1, (params.difficulty ?? 80) / 100)),
      ladder: has('ladder'),
      hazard: has('hazard'),
      ledge: has('platform'),
      cap: has('wall-top'),
      pairs,
      treasure: has('treasure'),
      life: has('life'),
      monsters: params.monsters ?? [],
      decorate: has('decoration'),
    });
    ({ area, entry, exit } = pl);
    notes.push(...pl.notes);
    if (has('locked-door') && !pairs.length) notes.push('The locked door blocks and key blocks share no lock number, so no doors were locked.');
    platformInfo = { proof: pl.proof, difficulty: pl.difficulty, can: pl.can, asked: pl.asked };
    own = { locks: pl.locks, treasure: pl.treasure, life: pl.life, monsters: pl.monsters, doorCells: pl.doorCells };
  } else if (params.kind === 'dungeon') {
    const d = dungeon(w, h, r, has('decoration'));
    ({ area, entry, exit } = d);
  } else if (params.kind === 'castle') {
    const c = castle(w, h, r, { path: has('path'), decorate: has('decoration') });
    ({ area, entry, exit } = c);
  } else if (params.kind === 'town') {
    const t = town(w, h, r, { tree: has('tree'), decor: has('decoration') });
    ({ area, entry, exit, links } = t);
  } else if (params.kind === 'overworld') {
    const o = overworld(w, h, r, { tree: has('tree'), rock: has('rock'), decor: has('decoration'), wrap: !!params.wrap });
    ({ area, entry, exit, links } = o);
  } else if (params.kind === 'home' || params.kind === 'shop') {
    const avail: Avail = {};
    for (const role of ['table', 'chair', 'bed', 'counter', 'shelf', 'stove', 'rug', 'lamp', 'plant'] as Role[]) {
      const list = blocksWithRole(roles, role);
      if (list.length) avail[role] = list.some((n) => !roles[n].facing) ? FACINGS : [...new Set(list.map((n) => roles[n].facing!))];
    }
    const it = interior(w, h, r, params.kind, avail);
    ({ area, entry, exit } = it);
    shopkeeper = it.shopkeeper;
    furniture = it.items.map((i) => ({ ...i, block: furnitureBlock(i.role, i.facing) }));
    for (const role of it.skipped)
      notes.push(
        role === 'chair'
          ? 'Chairs skipped: no chair block faces the way a chair beside a table must.'
          : `Some ${role}s skipped: no ${role} block faces the way it must stand against a wall.`,
      );
  } else {
    const f = forest(w, h, r, { path: has('path'), rock: has('rock'), decor: has('decoration') });
    ({ area, entry, exit } = f);
  }
  // props: locks and keys (dungeons), treasure, a heart, monsters; each needs its role, else it is skipped
  const pairs =
    params.kind === 'dungeon' || params.kind === 'castle'
      ? Array.from({ length: MAX_PAIR }, (_, i) => i + 1).filter(
          (p) => blocksWithRole(roles, 'locked-door', p).length && blocksWithRole(roles, 'key', p).length,
        )
      : [];
  const furnished = params.kind === 'home' || params.kind === 'shop' || params.kind === 'town' || params.kind === 'overworld';
  const props = own
    ? own
    : furnished
      ? { locks: [], treasure: [], life: undefined, monsters: [], doorCells: [] as number[] }
      : addProps(area, entry, exit, stream(params.seed ^ 0x9e3779b9), {
          pairs,
          treasure: has('treasure'),
          life: has('life'),
          monsters: params.monsters ?? [],
        });
  const dungeonish = params.kind === 'dungeon' || params.kind === 'castle';
  if (dungeonish && has('locked-door') && !pairs.length) notes.push('The locked door blocks and key blocks share no lock number, so no doors were locked.');
  if (dungeonish && pairs.length && !props.locks.length) notes.push('No narrow passage fit a locked door in this layout.');
  // blocks: the first block of each role, with the other floor blocks scattered for variety
  const pick: Record<number, number[]> = {
    [WALL]: blocksWithRole(roles, 'wall').slice(0, 1),
    [FLOOR]: blocksWithRole(roles, 'floor'),
    [PATH]: blocksWithRole(roles, 'path').slice(0, 1),
    [TREE]: blocksWithRole(roles, 'tree').slice(0, 1),
    [ROCK]: blocksWithRole(roles, 'rock').slice(0, 1),
    [DECOR]: blocksWithRole(roles, 'decoration'),
    [DOORC]: blocksWithRole(roles, 'door').slice(0, 1),
    [WATER]: blocksWithRole(roles, 'water').slice(0, 1),
    [SKY]: blocksWithRole(roles, 'sky').slice(0, 1),
    [LADDER]: blocksWithRole(roles, 'ladder').slice(0, 1),
    [HAZARD]: blocksWithRole(roles, 'hazard').slice(0, 1),
    [PLAT]: blocksWithRole(roles, 'platform').slice(0, 1),
    [ROOF]: blocksWithRole(roles, 'wall-top').length ? blocksWithRole(roles, 'wall-top').slice(0, 1) : blocksWithRole(roles, 'wall').slice(0, 1),
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
  const putBlocks = (cells: number[], list: number[]) => cells.forEach((c, i) => (blocks[c] = list[i % list.length]));
  for (const l of props.locks) {
    blocks[l.cell] = blocksWithRole(roles, 'locked-door', l.pair)[0];
    blocks[l.key] = blocksWithRole(roles, 'key', l.pair)[0];
  }
  if (own) for (const c of own.doorCells) blocks[c] = blocksWithRole(roles, 'locked-door', own.locks[0].pair)[0];
  putBlocks(props.treasure, blocksWithRole(roles, 'treasure').length ? blocksWithRole(roles, 'treasure') : [floor]);
  if (props.life !== undefined) blocks[props.life] = blocksWithRole(roles, 'life')[0];
  for (const f of furniture) blocks[f.cell] = f.block;
  const roofed = params.kind === 'town' && !has('wall-top');
  terrainCells.wall = params.kind !== 'forest' && params.kind !== 'overworld' ? [...cellsOf(WALL), ...(roofed ? cellsOf(ROOF) : [])] : undefined;
  terrainCells.tree = params.kind === 'forest' || params.kind === 'town' || params.kind === 'overworld' ? cellsOf(TREE) : undefined;
  terrainCells.water = params.kind === 'overworld' ? cellsOf(WATER) : undefined;
  terrainCells.path = cellsOf(PATH).length ? cellsOf(PATH) : undefined;
  return {
    ok: true,
    result: {
      rect,
      blocks,
      kinds: area.cells,
      terrainCells,
      entry,
      exit,
      locks: props.locks,
      treasure: props.treasure,
      life: props.life,
      monsters: props.monsters,
      furniture,
      shopkeeper,
      links,
      platform: platformInfo,
      notes,
    },
  };
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

export interface Proof {
  /** Every open cell can be reached from the entry (locks opened by their keys). */
  reach: boolean;
  /** Each key can be reached before its own lock (and every lock after it). */
  keysFirst: boolean;
  /** Every key, treasure and the exit can be collected by playing the keys out. */
  collectable: boolean;
  /** Furniture: every piece has a reachable open side, each chair looks at a table and the door's inside is open. True with none. */
  furnished: boolean;
  /** Every proposed door and site (towns, overworlds) can be reached from the entry. True with none. */
  linked: boolean;
}

/** The furniture part of the proof (plain cell codes only). */
function proveFurniture(result: GenResult): boolean {
  if (!result.furniture.length) return true;
  const a: Area = { w: result.rect.w, h: result.rect.h, cells: result.kinds };
  const d = distances(a, result.entry);
  const tables = new Set(result.furniture.filter((f) => f.role === 'table').map((f) => f.cell));
  return result.furniture.every((f) => {
    const x = f.cell % a.w,
      y = (f.cell / a.w) | 0;
    if (f.open) return d[f.cell] >= 0;
    if (f.role === 'chair') {
      const [dx, dy] = DIR[f.facing!];
      if (!tables.has((y + dy) * a.w + x + dx)) return false;
    }
    return Object.values(DIR).some(([dx, dy]) => {
      const nx = x + dx,
        ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < a.w && ny < a.h && d[ny * a.w + nx] >= 0;
    });
  });
}

/** Every proposed link's door or site can be reached from the entry. */
function proveLinks(result: GenResult): boolean {
  if (!result.links.length) return true;
  const a: Area = { w: result.rect.w, h: result.rect.h, cells: result.kinds };
  const d = distances(a, result.entry);
  return result.links.every((l) => d[l.cell] >= 0);
}

/** The generator's own proof for a result: reach, key-before-lock and that everything can be collected. */
export function proveResult(result: GenResult): Proof {
  const a: Area = { w: result.rect.w, h: result.rect.h, cells: result.kinds };
  const pickups = [...result.treasure, ...(result.life === undefined ? [] : [result.life])];
  if (result.platform) {
    const p = result.platform.proof;
    return { reach: p.exit, keysFirst: p.lockHolds, collectable: p.collectable, furnished: true, linked: true };
  }
  const k = proveKeys(a, result.entry, result.exit, result.locks, pickups);
  const reach = verifyReach(result).ok;
  return { reach, keysFirst: k.strict, collectable: k.ok, furnished: proveFurniture(result), linked: proveLinks(result) };
}

export const PROP_KINDS = { LOCK, KEY, TREASURE, LIFE };

export interface PlatformParams {
  /** The block set's roles (needs wall and sky; ladder, platform, hazard, wall-top, treasure, life, a lock and key pair and decoration are used when set). */
  roles: RoleMap;
  /** The hero's character file (hero.chr, parsed): his walk, jump and climb size the layout. */
  hero: Character;
  /** The same seed always draws the same layout. */
  seed: number;
  /** Where in the map to draw: at least 40 by 20 cells (more than 120 by 24 is drawn in the middle). */
  rect: Rect;
  /** How much of the hero's most (pit width, step height) it asks, in percent: 10 to 100, 80 when left out. */
  difficulty?: number;
  /** Monster numbers to stand on the long stretches. */
  monsters?: number[];
}

/** A side view layout for a game's build.ts: `generate` with the platform kind. See the tools README. */
export function generatePlatform(p: PlatformParams): GenOutcome {
  return generate(p.roles, { kind: 'platform', seed: p.seed, rect: p.rect, hero: p.hero, difficulty: p.difficulty, monsters: p.monsters });
}
