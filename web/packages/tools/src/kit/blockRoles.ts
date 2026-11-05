// Block roles: what a background block is for (wall, door, chair facing south...), kept as editor-only
// companion data so a level generator can pick blocks by use. No DOM and no game bytes: the block set
// itself never changes. `suggestRoles` guesses roles from what a block does in PLAYGAME (the same
// rules the map editor's behavior marks use, code/GM BLOC.H and PLAYGAME.C touch/pickup/gravity) and
// from its picture; it only suggests, a person confirms each one.
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

export type RoleGroup = 'Ground' | 'Doors' | 'Loot' | 'Furniture' | 'Spawn';

export interface RoleInfo {
  id: string;
  label: string;
  group: RoleGroup;
  hint: string;
}

export const ROLES = [
  { id: 'floor', label: 'Floor', group: 'Ground', hint: 'Something to walk on' },
  { id: 'wall', label: 'Wall', group: 'Ground', hint: 'Solid on every side' },
  { id: 'wall-top', label: 'Wall top', group: 'Ground', hint: 'The top edge of a wall' },
  { id: 'wall-edge', label: 'Wall edge or corner', group: 'Ground', hint: 'An edge or corner piece of a wall set' },
  { id: 'path', label: 'Path or road', group: 'Ground', hint: 'A path, road or trail' },
  { id: 'water', label: 'Water', group: 'Ground', hint: 'Water to cross or swim' },
  { id: 'shore', label: 'Shore', group: 'Ground', hint: 'Where land meets water' },
  { id: 'tree', label: 'Tree', group: 'Ground', hint: 'A tree' },
  { id: 'rock', label: 'Rock', group: 'Ground', hint: 'A rock or boulder' },
  { id: 'sky', label: 'Sky', group: 'Ground', hint: 'Open air behind a platform level' },
  { id: 'decoration', label: 'Decoration', group: 'Ground', hint: 'Looks nice, does nothing' },
  { id: 'hazard', label: 'Hazard', group: 'Ground', hint: 'Hurts the hero' },
  { id: 'platform', label: 'Platform', group: 'Doors', hint: 'Solid on top only: stand on it from above' },
  { id: 'ladder', label: 'Ladder', group: 'Doors', hint: 'Pulls the hero up or down' },
  { id: 'door', label: 'Door', group: 'Doors', hint: 'Open; turns into another block when touched' },
  { id: 'locked-door', label: 'Locked door', group: 'Doors', hint: 'Needs a key (same lock number)' },
  { id: 'exit', label: 'Exit', group: 'Doors', hint: 'Leads out of the level' },
  { id: 'entry', label: 'Entry', group: 'Doors', hint: 'Where the hero comes in' },
  { id: 'stairs-up', label: 'Stairs up', group: 'Doors', hint: 'Stairs going up' },
  { id: 'stairs-down', label: 'Stairs down', group: 'Doors', hint: 'Stairs going down' },
  { id: 'chest', label: 'Chest', group: 'Loot', hint: 'A chest that holds something' },
  { id: 'treasure', label: 'Treasure', group: 'Loot', hint: 'Money or score when picked up' },
  { id: 'key', label: 'Key', group: 'Loot', hint: 'Opens a locked door with the same lock number' },
  { id: 'life', label: 'Heart or life', group: 'Loot', hint: 'Adds a life' },
  { id: 'powerup', label: 'Power-up', group: 'Loot', hint: 'Picked up to help the hero' },
  { id: 'chair', label: 'Chair', group: 'Furniture', hint: 'Faces one way' },
  { id: 'table', label: 'Table', group: 'Furniture', hint: 'A table or desk' },
  { id: 'bed', label: 'Bed', group: 'Furniture', hint: 'A bed' },
  { id: 'counter', label: 'Counter', group: 'Furniture', hint: 'A shop counter or bar' },
  { id: 'shelf', label: 'Shelf', group: 'Furniture', hint: 'A shelf or bookcase' },
  { id: 'rug', label: 'Rug', group: 'Furniture', hint: 'A rug on the floor' },
  { id: 'lamp', label: 'Lamp', group: 'Furniture', hint: 'A lamp or torch' },
  { id: 'stove', label: 'Stove', group: 'Furniture', hint: 'A stove or fireplace' },
  { id: 'plant', label: 'Plant', group: 'Furniture', hint: 'A pot plant or flower' },
  { id: 'monster-spawn', label: 'Monster spawn', group: 'Spawn', hint: 'Gives birth to monsters' },
  { id: 'hero-start', label: 'Hero start', group: 'Spawn', hint: 'Where the hero begins' },
] as const satisfies readonly RoleInfo[];

export type Role = (typeof ROLES)[number]['id'];
export const ROLE_IDS: readonly Role[] = ROLES.map((r) => r.id);
export const ROLE_GROUPS: readonly RoleGroup[] = ['Ground', 'Doors', 'Loot', 'Furniture', 'Spawn'];

export const FACINGS = ['N', 'E', 'S', 'W'] as const;
export type Facing = (typeof FACINGS)[number];
export const FACING_NAMES: Record<Facing, string> = { N: 'north (up)', E: 'east (right)', S: 'south (down)', W: 'west (left)' };

/** Roles whose blocks have a front, so they can say which way they face. */
const FACING_ROLES: ReadonlySet<Role> = new Set<Role>(['chair', 'bed', 'counter', 'shelf', 'stove', 'table', 'lamp', 'entry', 'exit']);
/** Roles a lock number pairs up (a locked door and its key). */
const PAIR_ROLES: ReadonlySet<Role> = new Set<Role>(['locked-door', 'key']);
export const MAX_PAIR = 10;

export const hasFacing = (roles: readonly Role[]) => roles.some((r) => FACING_ROLES.has(r));
export const hasPair = (roles: readonly Role[]) => roles.some((r) => PAIR_ROLES.has(r));

/** What is kept for one block. */
export interface BlockRole {
  roles: Role[];
  /** Which way a furniture block faces. */
  facing?: Facing;
  /** The lock number (1..MAX_PAIR) a locked door and its key share. */
  pair?: number;
}

/** Roles by block number; blocks with no roles are left out. */
export type RoleMap = Record<number, BlockRole>;

const isRole = (v: unknown): v is Role => typeof v === 'string' && (ROLE_IDS as readonly string[]).includes(v);

/** Stored roles made safe to use: unknown roles and numbers out of range dropped, no repeats, extras only where they apply. */
export function cleanRoles(raw: unknown, count: number): RoleMap {
  const out: RoleMap = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(k);
    if (!Number.isInteger(n) || n < 0 || n >= count || !v || typeof v !== 'object') continue;
    const e = v as { roles?: unknown; facing?: unknown; pair?: unknown };
    const roles = [...new Set((Array.isArray(e.roles) ? e.roles : []).filter(isRole))];
    if (!roles.length) continue;
    const entry: BlockRole = { roles };
    if (hasFacing(roles) && (FACINGS as readonly unknown[]).includes(e.facing)) entry.facing = e.facing as Facing;
    const pair = Math.round(Number(e.pair));
    if (hasPair(roles) && pair >= 1 && pair <= MAX_PAIR) entry.pair = pair;
    out[n] = entry;
  }
  return out;
}

/** The map to store: only blocks that have roles, in block order (undefined when there are none). */
export function packRoles(map: RoleMap): Record<string, BlockRole> | undefined {
  const keys = Object.keys(map)
    .map(Number)
    .filter((n) => map[n]?.roles.length)
    .sort((a, b) => a - b);
  if (!keys.length) return undefined;
  return Object.fromEntries(keys.map((n) => [String(n), map[n]]));
}

/** The blocks that hold a role (with a lock number, only those with that pair). */
export function blocksWithRole(map: RoleMap, role: Role, pair?: number): number[] {
  return Object.keys(map)
    .map(Number)
    .filter((n) => map[n].roles.includes(role) && (pair === undefined || map[n].pair === pair))
    .sort((a, b) => a - b);
}

export interface RoleSuggestion {
  role: Role;
  /** Why, in a few words, for the chip's tooltip. */
  why: string;
  /** The lock number a door or key suggestion implies. */
  pair?: number;
}

export interface SuggestContext {
  /** The set's palette (768 bytes, 6-bit), to read the picture's colors. Without it the picture is not looked at. */
  palette?: Uint8Array;
  /** Whether the block is already in one of the set's terrains (edge sets), which suggests an edge piece. */
  inTerrain?: boolean;
}

const CLOSED = SOLTOP | SOLRIG | SOLBOT | SOLLEF;

/** The share of the picture that is blue, and its average brightness (0..1), or undefined with no palette. */
export function pictureBlue(pixels: Uint8Array, palette: Uint8Array): { blue: number; light: number } | undefined {
  let n = 0,
    blue = 0,
    light = 0;
  for (const p of pixels) {
    if (p === 255) continue;
    const r = palette[p * 3] ?? 0,
      g = palette[p * 3 + 1] ?? 0,
      b = palette[p * 3 + 2] ?? 0;
    n++;
    light += (r + g + b) / (3 * 63);
    if (b > 20 && b > r * 1.4 && b > g * 1.1) blue++;
  }
  return n ? { blue: blue / n, light: light / n } : undefined;
}

/**
 * Roles a background block seems to have. Pure and never applied by itself: the block editor shows
 * these as dim chips. Rules (the design note's table): solid all round is a wall; solid on top only a
 * platform; touching turns it into another block, a door; a negative counter 20..29 a lock; a
 * pick-up that adds money or score is treasure, that adds to a counter 20..29 a key, that adds a life
 * a life; hurting on touch a hazard; an upward pull a ladder; births monsters a spawn; a mostly
 * blue picture water or sky.
 */
export function suggestRoles(b: Block, index: number, ctx: SuggestContext = {}): RoleSuggestion[] {
  const out: RoleSuggestion[] = [];
  const add = (role: Role, why: string, pair?: number) => {
    if (!out.some((s) => s.role === role)) out.push({ role, why, pair });
  };
  const solid = b.solid & CLOSED;
  const counter = b.effect >= 20 && b.effect <= 29 ? b.effect - 19 : undefined;
  const becomes = b.touchBl !== index;
  const g = b.grav & 15;
  const pic = ctx.palette ? pictureBlue(b.pixels, ctx.palette) : undefined;
  const blue = !!pic && pic.blue >= 0.6;
  // a pick-up (obj), or a walk-through block that gives something and turns into another block
  const gives = b.obj !== 0 || (becomes && !solid && (b.scorePts > 0 || (b.eamt > 0 && b.effect !== 0)));
  const how = b.obj ? 'picked up' : 'touched';
  if (gives) {
    if (b.effect === 3 && b.eamt > 0) add('treasure', `${how}, adds money`);
    else if (b.scorePts > 0 && !(counter && b.eamt > 0)) add('treasure', `${how}, adds score`);
    if (counter && b.eamt > 0) add('key', `${how}, adds to special counter ${counter}`, counter);
    if (b.effect === 1 && b.eamt > 0) add('life', `${how}, adds a life`);
    if (!out.length) add('powerup', b.obj ? 'can be picked up' : `${how}, changes the hero`);
  } else {
    if (solid === CLOSED) {
      if (becomes || (counter && b.eamt < 0))
        add('locked-door', counter ? `solid, and costs special counter ${counter}` : 'solid, and turns into another block when touched', counter);
      else add('wall', 'solid on every side');
    } else if (solid === SOLTOP) add('platform', 'solid on top only');
    if (solid !== CLOSED) {
      if (counter && b.eamt < 0) add('locked-door', `costs special counter ${counter} when touched`, counter);
      else if (becomes) add('door', 'turns into another block when touched');
    }
  }
  if (b.chHitPt < 0 && !b.obj) add('hazard', 'hurts when touched');
  // gravity down alone is ordinary falling; a pull up is what makes a ladder or a climb
  if (g & 1 && solid !== CLOSED) add('ladder', (g & 5) === 5 ? 'up and down pulls cancel' : 'pulls up');
  if (b.birthTime > 0 && b.birthMon > 0) add('monster-spawn', `gives birth to monster ${b.birthMon}`);
  if (ctx.inTerrain) add('wall-edge', 'part of a terrain (edge set) in this block set');
  if (blue && !solid && !b.obj) {
    if (pic.light > 0.55) add('sky', 'a light blue picture, nothing solid');
    add('water', 'a mostly blue picture, nothing solid');
  }
  const plain = !solid && !b.obj && !becomes && !b.chHitPt && !b.scorePts && !(g & 1) && !counter;
  if (plain && !blue && !out.length) add('floor', 'walkable and does nothing');
  return out;
}

/** Suggestions not yet chosen (what the editor shows as dim chips). */
export function pendingSuggestions(have: readonly Role[], s: RoleSuggestion[]): RoleSuggestion[] {
  return s.filter((x) => !have.includes(x.role));
}
