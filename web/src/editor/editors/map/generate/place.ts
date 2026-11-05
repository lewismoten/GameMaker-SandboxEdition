// Puts a generated layout into a map's cells (no DOM): the blocks the generator chose, then edges and
// corners from the set's terrain brushes for walls, trees and paths. Only ordinary cells change.
import { LASTMM, MLEN, MWID, reindexMonsters, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { blocksWithRole, type Role, type RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import {
  generate,
  offerSeed,
  type GenKind,
  type GenOutcome,
  type GenResult,
  type Rect,
  type TerrainRole,
} from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { LASTMON, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { checkLayout, type LayoutCheck } from './verifyOffer';
import { paintTerrain, pickBlock, type Terrain } from '../tools/autotile';

const TERRAIN_ROLE: Record<TerrainRole, Role> = { wall: 'wall', tree: 'tree', path: 'path' };

/** The terrain that holds a block with this role as its fill (so painting it gives that block edges), if any. */
export function terrainFor(terrains: Terrain[], roles: RoleMap, role: TerrainRole): Terrain | undefined {
  const blocks = new Set(blocksWithRole(roles, TERRAIN_ROLE[role]));
  const fillIn = terrains.filter((t) => blocks.has(pickBlock(t, 0xff)));
  // a path terrain for the path role, an area terrain for the others
  return fillIn.find((t) => (role === 'path') === (t.kind === 'path'));
}

/** `blocks` copied with the result placed in it; the cells that changed are in `changed`. */
export function place(blocks: Uint8Array, result: GenResult, roles: RoleMap, terrains: Terrain[]): { blocks: Uint8Array; changed: number[] } {
  const out = blocks.slice();
  const { x, y, w } = result.rect;
  for (let i = 0; i < result.blocks.length; i++) out[(y + ((i / w) | 0)) * MLEN + x + (i % w)] = result.blocks[i];
  for (const role of Object.keys(result.terrainCells) as TerrainRole[]) {
    const cells = result.terrainCells[role];
    const t = cells && terrainFor(terrains, roles, role);
    if (t)
      paintTerrain(
        out,
        t,
        cells.map((i) => ({ x: result.rect.x + (i % w), y: result.rect.y + ((i / w) | 0) })),
      );
  }
  const changed: number[] = [];
  for (let i = 0; i < out.length; i++) if (out[i] !== blocks[i]) changed.push(i);
  return { blocks: out, changed };
}

/** Monster numbers a layout may use: in the .mon file, with a picture, and killable by the hero. */
export function usableMonsters(mons: Monster[]): number[] {
  const out: number[] = [];
  mons.slice(0, LASTMON).forEach((m, n) => m.used && m.pic[0]?.[0] < 100 && m.power < 100 && out.push(n));
  return out;
}

/**
 * Puts a result's monsters into the map (changing it): monsters already standing inside the area go first,
 * since the layout replaced the ground under them. Returns how many were placed and how many did not fit.
 */
export function placeMonsters(map: Pick<GameMap, 'monsters' | 'mons'>, result: GenResult): { placed: number; dropped: number } {
  const { x, y, w, h } = result.rect;
  for (const m of map.monsters) if (m.monnum < LASTMON && m.curx >= x && m.curx < x + w && m.cury >= y && m.cury < y + h) m.monnum = LASTMON;
  let placed = 0;
  for (const m of result.monsters) {
    const slot = map.monsters.findIndex((p) => p.monnum >= LASTMON);
    if (slot < 0 || slot >= LASTMM) break;
    Object.assign(map.monsters[slot], { monnum: m.monnum, status: 0, xtra: 0, extra: 0, curx: x + (m.cell % w), cury: y + Math.floor(m.cell / w) });
    placed++;
  }
  reindexMonsters(map as GameMap);
  return { placed, dropped: result.monsters.length - placed };
}

export interface Offer {
  seed: number;
  outcome: GenOutcome;
  /** Verified or Not proven (only for a result that worked). */
  check?: LayoutCheck;
  /** The whole map's blocks as they would be (only for a result that worked). */
  blocks?: Uint8Array;
}

/** Four layouts from a seed, each already placed in a copy of the map. */
export function offers(
  blocks: Uint8Array,
  roles: RoleMap,
  terrains: Terrain[],
  kind: GenKind,
  seed: number,
  rect: Rect,
  extra: { monsters?: number[]; bg?: Block[] } = {},
): Offer[] {
  return [0, 1, 2, 3].map((i) => {
    const s = offerSeed(seed, i);
    const outcome = generate(roles, { kind, seed: s, rect, monsters: extra.monsters });
    const placed = outcome.ok ? place(blocks, outcome.result, roles, terrains).blocks : undefined;
    return { seed: s, outcome, blocks: placed, check: outcome.ok ? checkLayout(outcome.result, placed!, extra.bg) : undefined };
  });
}

export const WHOLE: Rect = { x: 0, y: 0, w: MLEN, h: MWID };
