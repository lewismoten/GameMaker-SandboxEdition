// Where a change shows in the editor: the file a write tool changed, and where in it to look (a
// map's cell, a block, a monster), so the chat can move the editor there as the AI works.
import { normalize } from '../../project/files';
import type { ToolCall } from './providers';

export interface ChangePlace {
  file: string;
  /** The editor's address settings: a map's x and y, a block set's block, a monster's number. */
  params?: Record<string, number>;
}

const GAME_WRITES = new Set(['set_scene', 'add_scene', 'set_links', 'delete_file', 'set_player_patches']);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

/** Where a write tool's change is, or undefined when it has no place to show. */
export function changePlace(call: ToolCall, gam: string): ChangePlace | undefined {
  const a = call.args;
  if (GAME_WRITES.has(call.name)) return { file: gam };
  if (typeof a.file !== 'string' || !a.file.trim()) return undefined;
  const file = normalize(a.file);
  switch (call.name) {
    case 'set_map': {
      const rows = Array.isArray(a.rows) ? (a.rows as unknown[][]) : [];
      const mons = Array.isArray(a.monsters) ? (a.monsters as { x?: unknown; y?: unknown }[]) : [];
      if (rows.length) {
        const w = Math.max(...rows.map((r) => (Array.isArray(r) ? r.length : 0)));
        return { file, params: { x: (num(a.x) ?? 0) + Math.floor(w / 2), y: (num(a.y) ?? 0) + Math.floor(rows.length / 2) } };
      }
      const m = mons.find((x) => num(x.x) !== undefined && num(x.y) !== undefined);
      return m ? { file, params: { x: num(m.x)!, y: num(m.y)! } } : { file };
    }
    case 'set_block':
      return num(a.index) !== undefined ? { file, params: { block: num(a.index)! } } : { file };
    case 'set_monster':
      return num(a.index) !== undefined ? { file, params: { monster: num(a.index)! } } : { file };
    default:
      return { file };
  }
}
