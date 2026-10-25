// A scene's map from ASCII rows: each character names a block (through the scene's legend), the
// drawing goes at ORIGIN on the 100x100 grid, and the rest of the grid is the set's filler. Marks
// (a letter the scene's links and the bot look up) are kept by name, and a legend entry can put
// a monster on its cell too.
import { LASTMM, MLEN, newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import { ORIGIN } from '../ids';
import type { Bestiary, BlockSet } from '../blocks/sets';

export type Cell = string | { tile: string; mon?: string };

export interface Stamped {
  map: GameMap;
  /** Map coordinates of every mark character, in reading order. */
  marks: Map<string, { x: number; y: number }[]>;
  width: number;
  height: number;
}

/** Map coordinates of a cell given in drawing coordinates. */
export const at = (x: number, y: number) => ({ x: x + ORIGIN, y: y + ORIGIN });

export function stamp(rows: string[], legend: Record<string, Cell>, set: BlockSet, filler: string, mons?: Bestiary, markChars = ''): Stamped {
  const width = Math.max(...rows.map((r) => r.length));
  rows.forEach((r, y) => {
    if (r.length !== width) throw new Error(`row ${y} is ${r.length} wide, not ${width}: "${r}"`);
  });
  if (rows.length + ORIGIN > MLEN - 2 || width + ORIGIN > MLEN - 2) throw new Error('map too big');
  const map = newMap();
  map.blocks.fill(set.id(filler));
  const marks = new Map<string, { x: number; y: number }[]>();
  let placed = 0;
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const cell = legend[ch];
      if (cell === undefined) throw new Error(`no legend for "${ch}" at ${x},${y}`);
      const { x: mx, y: my } = at(x, y);
      const tile = typeof cell === 'string' ? cell : cell.tile;
      map.blocks[my * MLEN + mx] = set.id(tile);
      if (typeof cell !== 'string' && cell.mon) {
        if (!mons) throw new Error(`"${ch}" places a monster, but the scene has none`);
        if (placed >= LASTMM) throw new Error('too many monsters');
        map.monsters[placed++] = { monnum: mons.id(cell.mon), status: 0, xtra: 0, curx: mx, cury: my, extra: 0 };
      }
      if (markChars.includes(ch)) {
        if (!marks.has(ch)) marks.set(ch, []);
        marks.get(ch)!.push({ x: mx, y: my });
      }
    }),
  );
  reindexMonsters(map);
  return { map, marks, width, height: rows.length };
}

/** The one cell a mark names (it must appear exactly once). */
export function mark(s: Stamped, ch: string): { x: number; y: number } {
  const m = s.marks.get(ch);
  if (!m || m.length !== 1) throw new Error(`mark "${ch}" appears ${m?.length ?? 0} times`);
  return m[0];
}

/** Puts block `name` at drawing cell (x, y) of a stamped map (for parts wider than a character). */
export function paint(s: Stamped, set: BlockSet, x: number, y: number, name: string): void {
  const { x: mx, y: my } = at(x, y);
  s.map.blocks[my * MLEN + mx] = set.id(name);
}
