// One map a level: a level's scenes (its verses, rooms or stages) share one .MAP, scene k drawn
// STRIDE * k rows down. A view starts half a screen above the start and never scrolls up or
// down (DESIGN.md, Views), and the filler walls each scene in, so every scene shows and plays as
// it did on a map of its own. Scenes whose maps are the same (the cups' rounds) share it as is.
import { LASTMM, newMap, reindexMonsters, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';

/** Rows a scene's band takes: the level at ORIGIN, ten rows, and filler round it. */
export const STRIDE = 13;

/** Each shared .MAP (by name, without .map) and its scenes, in order down the map. */
export const STACKS: Record<string, string[]> = {
  fan: ['fan1', 'fan2'],
  cups: ['cups1', 'cups2', 'cups3'],
  horn: ['horn1', 'horn2', 'horn3'],
  gear: ['gear1', 'gear2', 'gear3', 'gear4'],
  dash: ['dash1', 'dash2'],
  road: ['road1', 'road2'],
  band: ['band1', 'band2', 'band3'],
};
/** Stacks whose scenes have one map, so each is drawn once, at the top. */
const SAME = new Set(['cups']);

const stackOf = (file: string) => Object.keys(STACKS).find((s) => STACKS[s].includes(file));

/** The .MAP a scene uses. */
export const mapOf = (file: string): string => `${stackOf(file) ?? file}.map`;

/** How many rows down its map a scene is drawn. */
export function rowOffset(file: string): number {
  const s = stackOf(file);
  return s && !SAME.has(s) ? STRIDE * STACKS[s].indexOf(file) : 0;
}

const same = (a: GameMap, b: GameMap) => a.blocks.every((v, i) => v === b.blocks[i]) && JSON.stringify(a.monsters) === JSON.stringify(b.monsters);

/** The disk's maps by file name, from each scene's own map. */
export function stackMaps(maps: Map<string, GameMap>): Map<string, GameMap> {
  const out = new Map<string, GameMap>();
  for (const [file, m] of maps) if (!stackOf(file)) out.set(`${file}.map`, m);
  for (const [name, files] of Object.entries(STACKS)) {
    const parts = files.map((f) => maps.get(f)!);
    if (SAME.has(name)) {
      if (!parts.every((m) => same(m, parts[0]))) throw new Error(`${name}: its scenes' maps differ`);
      out.set(`${name}.map`, parts[0]);
      continue;
    }
    const m: GameMap = structuredClone(parts[0]);
    const filler = m.blocks[99 * 100];
    const placed = (g: GameMap) => g.monsters.filter((x) => x.monnum < 64);
    m.monsters = placed(m);
    parts.forEach((p, k) => {
      for (let i = STRIDE * 100; i < p.blocks.length; i++) if (p.blocks[i] !== filler) throw new Error(`${files[k]}: more than ${STRIDE} rows`);
      if (k === 0) return;
      m.blocks.set(p.blocks.subarray(0, STRIDE * 100), STRIDE * k * 100);
      for (const x of placed(p)) m.monsters.push({ ...x, cury: x.cury + STRIDE * k });
    });
    if (m.monsters.length > LASTMM) throw new Error(`${name}: more than ${LASTMM} monsters`);
    m.monsters.push(...newMap().monsters.slice(m.monsters.length));
    reindexMonsters(m);
    out.set(`${name}.map`, m);
  }
  return out;
}
