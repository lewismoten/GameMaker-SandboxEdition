// Tools for a level's map (.map): its 100 x 100 cells as rows of background block numbers, and
// the monsters placed on it (up to 200), read and written a region at a time.
import { LASTMM, MLEN, MWID, newMap, parseMap, reindexMonsters, serializeMap } from '../../formats/map';
import { LASTMON } from '../../formats/monster';
import { DRY_RUN, commit } from './run';
import { FILE, clampInt, fileName, int, intRows, need } from './common';
import { json, ToolError, type ToolDef } from './types';

const getMap: ToolDef = {
  name: 'get_map',
  description: 'A region of a map: rows of background block numbers (row y first) and the monsters placed in it.',
  inputSchema: {
    type: 'object',
    properties: {
      file: FILE,
      x: int('Left column (0-99).', 0, 99),
      y: int('Top row (0-99).', 0, 99),
      width: int('Columns (default 100).', 1, 100),
      height: int('Rows (default 100).', 1, 100),
    },
    required: ['file'],
  },
  async run(a, ctx) {
    const map = parseMap(need(ctx, a.file, 'map'));
    const x = clampInt(a.x, 0, 99, 0);
    const y = clampInt(a.y, 0, 99, 0);
    const w = Math.min(clampInt(a.width, 1, 100, 100), MLEN - x);
    const h = Math.min(clampInt(a.height, 1, 100, 100), MWID - y);
    const rows = Array.from({ length: h }, (_, r) => [...map.blocks.subarray((y + r) * MLEN + x, (y + r) * MLEN + x + w)]);
    const monsters = map.monsters
      .map((m, slot) => ({ slot, monster: m.monnum, x: m.curx, y: m.cury }))
      .filter((m) => m.monster < LASTMON && m.x >= x && m.x < x + w && m.y >= y && m.y < y + h);
    return json({ file: fileName(a.file), x, y, width: w, height: h, rows, monsters });
  },
};

const setMap: ToolDef = {
  name: 'set_map',
  description:
    'Writes rows of block numbers into a map at (x, y), and places or removes monsters. Makes the map if it is new. Blocks are the scene’s .bbl numbers (0-149).',
  writes: true,
  inputSchema: {
    type: 'object',
    properties: {
      file: FILE,
      x: int('Left column of the rows (default 0).', 0, 99),
      y: int('Top row of the rows (default 0).', 0, 99),
      rows: intRows('Rows of block numbers, top to bottom.'),
      fill: int('Fill the whole map with this block first (a new map starts all 0).', 0, 149),
      monsters: {
        type: 'array',
        maxItems: LASTMM,
        description: 'Monsters to place: monster number (0-63, from the .mon) at a cell; -1 removes the monster there.',
        items: {
          type: 'object',
          properties: { monster: int('Monster number, or -1 to remove.', -1, 63), x: int('Column.', 0, 99), y: int('Row.', 0, 99) },
          required: ['monster', 'x', 'y'],
        },
      },
      clear_monsters: { type: 'boolean', description: 'Remove every placed monster first.' },
      dry_run: DRY_RUN,
    },
    required: ['file'],
  },
  async run(a, ctx) {
    const name = fileName(a.file, 'map');
    const had = ctx.files.get(name);
    const map = had ? parseMap(had) : newMap();
    if (typeof a.fill === 'number') map.blocks.fill(a.fill);
    const x0 = clampInt(a.x, 0, 99, 0);
    const y0 = clampInt(a.y, 0, 99, 0);
    let cells = 0;
    for (const [r, row] of ((a.rows ?? []) as number[][]).entries()) {
      if (y0 + r >= MWID) throw new ToolError(`Row ${r} falls below the map (row ${y0 + r}; the map has 100).`);
      if (x0 + row.length > MLEN) throw new ToolError(`Row ${r} runs off the right of the map (${row.length} cells from column ${x0}).`);
      row.forEach((b, c) => {
        if (b > 149) throw new ToolError(`Block ${b} at row ${r}, column ${c}: background blocks are 0-149.`);
        map.blocks[(y0 + r) * MLEN + x0 + c] = b;
        cells++;
      });
    }
    if (a.clear_monsters) for (const m of map.monsters) m.monnum = LASTMON;
    let placed = 0;
    for (const p of (a.monsters ?? []) as { monster: number; x: number; y: number }[]) {
      const at = map.monsters.findIndex((m) => m.monnum < LASTMON && m.curx === p.x && m.cury === p.y);
      if (at >= 0) map.monsters[at].monnum = LASTMON;
      if (p.monster < 0) continue;
      const slot = map.monsters.findIndex((m) => m.monnum >= LASTMON);
      if (slot < 0) throw new ToolError(`A map holds at most ${LASTMM} monsters.`);
      Object.assign(map.monsters[slot], { monnum: p.monster, curx: p.x, cury: p.y });
      placed++;
    }
    reindexMonsters(map);
    return commit(ctx, a, { summary: `Map ${name}: ${cells} cells, ${placed} monsters placed`, files: { [name]: serializeMap(map) } });
  },
};

export const MAP_TOOLS: ToolDef[] = [getMap, setMap];
