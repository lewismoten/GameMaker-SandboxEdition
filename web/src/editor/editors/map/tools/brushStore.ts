// A block set's terrains, stamps and buildings, kept in the project's companion file (project/companion.ts) under the .bbl's name.
import type { Project } from '../../../core/project';
import { newId } from '../../../../project/storage';
import { SLOTS, type Terrain } from './autotile';
import { BUILDING_PARTS, newBuilding, type Building } from './building';
import type { Stamp } from './stamps';

export type BrushKind = 'terrains' | 'stamps' | 'buildings';
type Item = { id: string; name: string };

const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** Terrains as stored, made safe to paint with (slots padded or cut to their kind, unknown keys kept). */
function cleanTerrain(t: Terrain): Terrain | undefined {
  if (!t || typeof t !== 'object' || !(t.kind in SLOTS)) return undefined;
  const n = SLOTS[t.kind].length;
  const tiles = Array.from({ length: n }, (_, i) => num(asArray<number>(t.tiles)[i], -1));
  return { ...t, id: String(t.id ?? newId()), name: String(t.name ?? 'Terrain'), tiles, outside: num(t.outside, 0) };
}

function cleanStamp(s: Stamp): Stamp | undefined {
  if (!s || typeof s !== 'object') return undefined;
  const w = num(s.w, 0),
    h = num(s.h, 0);
  const cells = asArray<number>(s.cells);
  if (w < 1 || h < 1 || cells.length !== w * h) return undefined;
  return { ...s, id: String(s.id ?? newId()), name: String(s.name ?? 'Stamp'), w, h, cells: cells.map((c) => num(c, -1)) };
}

function cleanBuilding(b: Building): Building | undefined {
  if (!b || typeof b !== 'object') return undefined;
  const base = newBuilding(String(b.id ?? newId()), String(b.name ?? 'Building'));
  const parts = { ...base.parts };
  for (const { part } of BUILDING_PARTS) parts[part] = num(b.parts?.[part], -1);
  return { ...b, id: base.id, name: base.name, parts, roofRows: Math.max(1, num(b.roofRows, 1)), windowEvery: Math.max(1, num(b.windowEvery, 2)) };
}

const CLEAN = { terrains: cleanTerrain, stamps: cleanStamp, buildings: cleanBuilding } as Record<BrushKind, (x: never) => Item | undefined>;

/** The brushes of one kind for a block set. */
export function loadBrushes<T extends Item>(project: Project, bbl: string, kind: BrushKind): T[] {
  if (!bbl) return [];
  return asArray<never>(project.extras(bbl, kind, []))
    .map((x) => CLEAN[kind](x))
    .filter((x): x is T => !!x);
}

/** Adds or replaces (by id) one brush, or with `remove` deletes it; saved with the project. */
export function saveBrush(project: Project, bbl: string, kind: BrushKind, item: Item, remove = false): void {
  if (!bbl) return;
  const list = asArray<Item>(project.extras(bbl, kind, [])).filter((x) => x?.id !== item.id);
  const at = asArray<Item>(project.extras(bbl, kind, [])).findIndex((x) => x?.id === item.id);
  if (!remove) list.splice(at < 0 ? list.length : at, 0, item);
  project.setExtras(bbl, kind, list.length ? list : undefined);
}
