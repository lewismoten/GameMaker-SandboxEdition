// map_sketch: a map region as a few characters a cell, the chat's cheap stand-in for a picture:
// # solid, . open, * points or a pickup, ^ hurts, M a monster, S where the hero starts, E a link
// out. A small model reads it in a few hundred tokens where render_png costs far more.
import { ADVTYPE, NOSCENE } from '../../formats/game';
import { BACKBL, parseBlocks } from '../../formats/blocks';
import { LASTMON } from '../../formats/monster';
import { MLEN, MWID, parseMap } from '../../formats/map';
import { normalize } from '../../project/files';
import { clampInt, fileName, gameOf, int, need } from '../tools/common';
import { runTool } from '../tools/run';
import { text, type GameContext, type ToolDef } from '../tools/types';
import type { AgentTool } from './agent';

const def: ToolDef = {
  name: 'map_sketch',
  description: 'A map region as text, a character a cell: # solid, . open, * points or pickup, ^ hurts, M monster, S start, E exit link.',
  inputSchema: {
    type: 'object',
    properties: {
      file: { type: 'string', description: 'A map, e.g. level1.map.' },
      x: int('Left column (default 0).', 0, 99),
      y: int('Top row (default 0).', 0, 99),
      width: int('Columns (default 40).', 1, 60),
      height: int('Rows (default 25).', 1, 40),
    },
    required: ['file'],
  },
  async run(a, ctx) {
    const name = fileName(a.file, 'map');
    const map = parseMap(need(ctx, name, 'map'));
    const game = gameOf(ctx);
    const at = game.scenes.findIndex((s) => s.gametype === ADVTYPE && s.files[1] && normalize(s.files[1]) === name);
    const bbl = at >= 0 ? ctx.files.get(normalize(game.scenes[at].files[2])) : undefined;
    const blocks = bbl ? parseBlocks(bbl, BACKBL) : [];
    const x0 = clampInt(a.x, 0, 99, 0);
    const y0 = clampInt(a.y, 0, 99, 0);
    const w = Math.min(clampInt(a.width, 1, 60, 40), MLEN - x0);
    const h = Math.min(clampInt(a.height, 1, 40, 25), MWID - y0);
    const marks = new Map<number, string>();
    for (const m of map.monsters) if (m.monnum < LASTMON) marks.set(m.cury * MLEN + m.curx, 'M');
    if (at >= 0) {
      for (const l of game.scenes[at].links) if (l.toScene !== NOSCENE) marks.set(l.from.y * MLEN + l.from.x, 'E');
      // where links into this scene put the hero
      for (const s of game.scenes) for (const l of s.links) if (l.toScene === at) marks.set(l.to.y * MLEN + l.to.x, 'S');
    }
    const rows: string[] = [];
    for (let y = y0; y < y0 + h; y++) {
      let row = '';
      for (let x = x0; x < x0 + w; x++) {
        const i = y * MLEN + x;
        const b = blocks[map.blocks[i]];
        row += marks.get(i) ?? (!b ? '?' : b.solid ? '#' : b.chHitPt < 0 ? '^' : b.scorePts > 0 || b.obj ? '*' : '.');
      }
      rows.push(row);
    }
    // with no level using it, its blocks are unknown: say so rather than leave the model a page of ?
    const why =
      at < 0
        ? `\n(? = unknown: no level uses ${name} as its map, so its blocks aren't known. get_scene shows each level's files.)`
        : !bbl
          ? `\n(? = unknown: the level's block set ${game.scenes[at].files[2] || '(none)'} isn't in the game.)`
          : '';
    return text(`${name} columns ${x0}-${x0 + w - 1}, rows ${y0}-${y0 + h - 1}:\n${rows.join('\n')}${why}`);
  },
};

/** The sketch as one of the chat's tools. */
export function mapSketchTool(ctx: GameContext): AgentTool {
  return { def, run: (a) => runTool(def, a, ctx) };
}
