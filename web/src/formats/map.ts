// .map files: a 100x100 grid of { block, monster index } followed by 200 placed monsters
// (see code/GM/MAP.H). Grid is stored row by row: map[y][x].
import { Reader, Writer } from './binary';

export const MLEN = 100;
export const MWID = 100;
export const LASTMM = 200;
export const MAP_CELLS = MLEN * MWID;

export interface PlacedMonster {
  /** Monster number in the .mon file; LASTMON (64) or more = empty slot. */
  monnum: number;
  status: number;
  xtra: number;
  curx: number;
  cury: number;
  extra: number;
}

export interface GameMap {
  /** Background block per cell (index = y * 100 + x). */
  blocks: Uint8Array;
  /** Placed monster index per cell (LASTMM = none). */
  mons: Uint8Array;
  monsters: PlacedMonster[];
}

export function parseMap(bytes: Uint8Array): GameMap {
  const r = new Reader(bytes);
  const blocks = new Uint8Array(MAP_CELLS);
  const mons = new Uint8Array(MAP_CELLS);
  for (let i = 0; i < MAP_CELLS; i++) {
    blocks[i] = r.u8();
    mons[i] = r.u8();
  }
  const monsters: PlacedMonster[] = [];
  for (let i = 0; i < LASTMM; i++) {
    monsters.push({ monnum: r.u8(), status: r.i16(), xtra: r.u8(), curx: r.i16(), cury: r.i16(), extra: r.i16() });
  }
  return { blocks, mons, monsters };
}

export function serializeMap(m: GameMap): Uint8Array {
  const w = new Writer(MAP_CELLS * 2 + LASTMM * 10);
  for (let i = 0; i < MAP_CELLS; i++) w.u8(m.blocks[i]).u8(m.mons[i]);
  for (const p of m.monsters) w.u8(p.monnum).i16(p.status).u8(p.xtra).i16(p.curx).i16(p.cury).i16(p.extra);
  return w.toBytes();
}

export function newMap(): GameMap {
  return {
    blocks: new Uint8Array(MAP_CELLS),
    mons: new Uint8Array(MAP_CELLS).fill(LASTMM),
    monsters: Array.from({ length: LASTMM }, () => ({ monnum: 64, status: 0, xtra: 0, curx: 0, cury: 0, extra: 0 })),
  };
}

/** Rebuilds the per-cell monster index from the placed monster list (as the map editor does). */
export function reindexMonsters(m: GameMap): void {
  m.mons.fill(LASTMM);
  m.monsters.forEach((p, i) => {
    if (p.monnum < 64 && p.curx >= 0 && p.curx < MLEN && p.cury >= 0 && p.cury < MWID) m.mons[p.cury * MLEN + p.curx] = i;
  });
}
